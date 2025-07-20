import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LiveAnalysisService } from '../services/api';
import toast from 'react-hot-toast';
import {
  PlayIcon,
  StopIcon,
  VideoCameraIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const LiveAnalysis = ({ usageLimits, onAuthRequired }) => {
  const { user } = useAuth();
  const webcamRef = useRef(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  
  const liveServiceRef = useRef(null);
  const analysisIntervalRef = useRef(null);

  // Initialize live analysis service
  useEffect(() => {
    liveServiceRef.current = new LiveAnalysisService();
    
    liveServiceRef.current.setOnAnalysis((analysis) => {
      setCurrentAnalysis(analysis);
      setAnalysisHistory(prev => [
        { ...analysis, id: Date.now() },
        ...prev.slice(0, 9) // Keep last 10 analyses
      ]);
    });
    
    liveServiceRef.current.setOnError((errorMessage) => {
      setError(errorMessage);
      toast.error(`Live analysis error: ${errorMessage}`);
    });

    return () => {
      if (liveServiceRef.current) {
        liveServiceRef.current.disconnect();
      }
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, []);

  const startAnalysis = async () => {
    try {
      // Check usage limits
      if (usageLimits && !usageLimits.can_analyze) {
        if (!user) {
          toast.error('Daily limit reached. Please register for live analysis.');
          onAuthRequired();
          return;
        } else {
          toast.error('Daily analysis limit reached. Please upgrade your plan.');
          return;
        }
      }

      setError(null);
      setConnectionStatus('connecting');
      
      // Connect to WebSocket
      await liveServiceRef.current.connect();
      setConnectionStatus('connected');
      setIsAnalyzing(true);
      
      // Start capturing and analyzing frames
      analysisIntervalRef.current = setInterval(() => {
        captureAndAnalyze();
      }, 2000); // Analyze every 2 seconds
      
      toast.success('Live analysis started! 📹');
      
    } catch (error) {
      setError('Failed to start live analysis');
      setConnectionStatus('error');
      toast.error('Failed to start live analysis. Please try again.');
    }
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    setConnectionStatus('disconnected');
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    
    if (liveServiceRef.current) {
      liveServiceRef.current.disconnect();
    }
    
    setCurrentAnalysis(null);
    toast.success('Live analysis stopped');
  };

  const captureAndAnalyze = useCallback(() => {
    if (webcamRef.current && isAnalyzing) {
      try {
        const imageSrc = webcamRef.current.getScreenshot({
          width: 640,
          height: 480,
          screenshotFormat: 'image/jpeg',
          screenshotQuality: 0.8
        });
        
        if (imageSrc && liveServiceRef.current) {
          liveServiceRef.current.sendFrame(imageSrc);
        }
      } catch (error) {
        console.error('Error capturing frame:', error);
      }
    }
  }, [isAnalyzing]);

  const getEmotionEmoji = (emotion) => {
    const emojiMap = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      surprised: '😲',
      fear: '😨',
      neutral: '😐',
      confident: '😎',
      stressed: '😰',
      focused: '🤔',
      relaxed: '😌'
    };
    return emojiMap[emotion?.toLowerCase()] || '😐';
  };

  const getEmotionColor = (emotion) => {
    const colorMap = {
      happy: 'text-green-600 bg-green-100',
      sad: 'text-gray-600 bg-gray-100',
      angry: 'text-red-600 bg-red-100',
      surprised: 'text-yellow-600 bg-yellow-100',
      fear: 'text-purple-600 bg-purple-100',
      neutral: 'text-blue-600 bg-blue-100',
      confident: 'text-indigo-600 bg-indigo-100',
      stressed: 'text-orange-600 bg-orange-100'
    };
    return colorMap[emotion?.toLowerCase()] || 'text-blue-600 bg-blue-100';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8"
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">📹</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Live Camera Analysis</h2>
          <p className="text-gray-600">Real-time emotion analysis using your camera</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera Feed */}
          <div className="space-y-4">
            <div className="relative bg-black rounded-xl overflow-hidden">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: 'user'
                }}
                className="w-full h-auto"
                onUserMediaError={(error) => {
                  console.error('Camera error:', error);
                  setError('Failed to access camera. Please check permissions.');
                  toast.error('Camera access denied. Please enable camera permissions.');
                }}
              />
              
              {/* Recording Indicator */}
              {isAnalyzing && (
                <div className="absolute top-4 left-4 flex items-center bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                  ANALYZING
                </div>
              )}

              {/* Connection Status */}
              <div className="absolute top-4 right-4">
                <div className={`flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                  connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                  connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  <SignalIcon className="w-3 h-3 mr-1" />
                  {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              {!isAnalyzing ? (
                <button
                  onClick={startAnalysis}
                  className="btn-primary"
                  disabled={connectionStatus === 'connecting'}
                >
                  <PlayIcon className="w-5 h-5 mr-2" />
                  Start Live Analysis
                </button>
              ) : (
                <button
                  onClick={stopAnalysis}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200"
                >
                  <StopIcon className="w-5 h-5 mr-2" />
                  Stop Analysis
                </button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-red-800 font-semibold">Error</p>
                </div>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            )}
          </div>

          {/* Analysis Results */}
          <div className="space-y-6">
            {/* Current Analysis */}
            {currentAnalysis && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border-2 border-primary-200 rounded-xl p-6"
              >
                <div className="flex items-center mb-4">
                  <SparklesIcon className="w-5 h-5 text-primary-600 mr-2" />
                  <h3 className="font-semibold text-gray-800">Current Analysis</h3>
                  <div className="ml-auto text-xs text-gray-500">
                    {new Date(currentAnalysis.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                {/* Emotional State */}
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2">
                    {getEmotionEmoji(currentAnalysis.emotional_state)}
                  </div>
                  <div className={`inline-block px-4 py-2 rounded-full font-semibold capitalize ${
                    getEmotionColor(currentAnalysis.emotional_state)
                  }`}>
                    {currentAnalysis.emotional_state || 'Neutral'}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Confidence: {currentAnalysis.confidence || 'Medium'}
                  </div>
                </div>

                {/* Expressions */}
                {currentAnalysis.expressions && currentAnalysis.expressions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Detected Expressions</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentAnalysis.expressions.slice(0, 4).map((expr, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize"
                        >
                          {expr.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Analysis History */}
            {analysisHistory.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Recent Analysis</h3>
                  <button
                    onClick={() => setAnalysisHistory([])}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {analysisHistory.slice(0, 5).map((analysis, index) => (
                    <div
                      key={analysis.id}
                      className="bg-white rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {getEmotionEmoji(analysis.emotional_state)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 capitalize">
                              {analysis.emotional_state || 'Neutral'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(analysis.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {analysis.confidence || 'Medium'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Usage Info */}
            {usageLimits && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <EyeIcon className="w-5 h-5 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-blue-800">Usage Information</h4>
                </div>
                <p className="text-blue-700 text-sm">
                  Today's analyses: {usageLimits.usage?.today || 0}
                  {usageLimits.limits?.daily_analyses === -1 
                    ? ' / Unlimited'
                    : ` / ${usageLimits.limits?.daily_analyses || 5}`
                  }
                </p>
                <p className="text-blue-600 text-xs mt-1">
                  Live analysis frames are processed in real-time and don't count toward your daily limit.
                </p>
              </div>
            )}

            {/* Premium Features Notice */}
            {!user && (
              <div className="bg-gradient-to-r from-purple-50 to-primary-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <VideoCameraIcon className="w-5 h-5 text-purple-600 mr-2" />
                  <h4 className="font-semibold text-gray-800">Get More Features</h4>
                </div>
                <p className="text-gray-700 text-sm mb-3">
                  Register for extended live analysis sessions and history saving.
                </p>
                <button
                  onClick={onAuthRequired}
                  className="btn-primary text-sm"
                >
                  Sign Up Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">📋 How to Use Live Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <div className="font-semibold text-gray-700 mb-1">1. Position Camera</div>
              <p>Ensure your face is clearly visible and well-lit</p>
            </div>
            <div>
              <div className="font-semibold text-gray-700 mb-1">2. Start Analysis</div>
              <p>Click "Start Live Analysis" to begin real-time emotion detection</p>
            </div>
            <div>
              <div className="font-semibold text-gray-700 mb-1">3. View Results</div>
              <p>Watch live emotion analysis update every 2 seconds</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LiveAnalysis;
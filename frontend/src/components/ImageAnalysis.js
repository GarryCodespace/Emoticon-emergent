import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { useAnalysis } from '../context/AnalysisContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  CloudArrowUpIcon,
  PhotoIcon,
  SparklesIcon,
  EyeIcon,
  ShieldExclamationIcon,
  HeartIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ImageAnalysis = ({ usageLimits, onAuthRequired }) => {
  const { analyzeImage, loading } = useAnalysis();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [contextInput, setContextInput] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image file too large. Maximum size is 10MB.');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload a valid image file.');
        return;
      }

      setSelectedImage({
        file,
        preview: URL.createObjectURL(file)
      });
      setAnalysisResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first.');
      return;
    }

    // Check usage limits
    if (usageLimits && !usageLimits.can_analyze) {
      if (!user) {
        toast.error('Daily limit reached. Please register for more analyses.');
        onAuthRequired();
        return;
      } else {
        toast.error('Daily analysis limit reached. Please upgrade your plan.');
        return;
      }
    }

    const result = await analyzeImage(selectedImage.file, contextInput);
    if (result.success) {
      setAnalysisResult(result.data);
    }
  };

  const handleClearImage = () => {
    if (selectedImage?.preview) {
      URL.revokeObjectURL(selectedImage.preview);
    }
    setSelectedImage(null);
    setAnalysisResult(null);
    setContextInput('');
  };

  const quickContexts = [
    { label: '😄 Fun Analysis', context: "I'm having fun analyzing this photo to see what emotions and personality traits are visible." },
    { label: '💼 Interview Assessment', context: "I'm analyzing this person during an interview to assess confidence level, honesty, and stress indicators." },
    { label: '💕 Date Analysis', context: "I'm analyzing this photo from a date to understand genuine interest level and emotional state." },
    { label: '🔍 Deception Detection', context: "I need to analyze this person for deception indicators and assess truthfulness based on facial expressions." }
  ];

  return (
    <div id="analysis-section" className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8"
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">📸</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Image Emotion Analysis</h2>
          <p className="text-gray-600">Upload an image to analyze facial expressions and emotions using advanced AI</p>
        </div>

        {/* Context Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Analysis Context (Optional)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {quickContexts.map((item, index) => (
              <button
                key={index}
                onClick={() => setContextInput(item.context)}
                className="text-xs px-3 py-2 bg-gray-100 hover:bg-primary-100 hover:text-primary-700 rounded-lg transition-colors duration-200"
              >
                {item.label}
              </button>
            ))}
          </div>
          <textarea
            value={contextInput}
            onChange={(e) => setContextInput(e.target.value)}
            placeholder="Describe your analysis scenario for more targeted insights..."
            className="input-field h-20 resize-none"
          />
        </div>

        {/* File Upload */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : selectedImage
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
          }`}
        >
          <input {...getInputProps()} />
          {selectedImage ? (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={selectedImage.preview}
                  alt="Selected"
                  className="max-w-sm max-h-64 rounded-lg shadow-md mx-auto"
                />
              </div>
              <div className="space-x-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearImage();
                  }}
                  className="btn-ghost"
                >
                  Clear Image
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="btn-secondary"
                >
                  Change Image
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                {isDragActive ? (
                  <CloudArrowUpIcon className="w-8 h-8 text-primary-600" />
                ) : (
                  <PhotoIcon className="w-8 h-8 text-primary-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {isDragActive ? 'Drop your image here' : 'Upload Image'}
                </h3>
                <p className="text-gray-500">
                  Drag & drop or click to select • JPG, PNG, WebP • Max 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Analyze Button */}
        {selectedImage && (
          <div className="mt-6 text-center">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="btn-primary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 inline mr-2" />
                  Analyze Emotions
                </>
              )}
            </button>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
          >
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="text-green-600 mr-2">✅</div>
                <h3 className="font-semibold text-green-800">Analysis Complete!</h3>
              </div>
              <p className="text-green-700 text-sm">
                Confidence Level: <span className="font-semibold">{analysisResult.confidence_level}</span>
              </p>
            </div>

            {/* Primary Emotional State */}
            {analysisResult.emotional_state && analysisResult.emotional_state !== 'neutral' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <HeartIcon className="w-5 h-5 text-primary-600 mr-2" />
                  <h4 className="font-semibold text-gray-800">Primary Emotional State</h4>
                </div>
                <div className="text-2xl font-bold text-primary-600 capitalize">
                  {analysisResult.emotional_state}
                </div>
              </div>
            )}

            {/* Detailed Analysis */}
            {analysisResult.detailed_analysis && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <EyeIcon className="w-5 h-5 text-primary-600 mr-2" />
                  <h4 className="font-semibold text-gray-800">AI Analysis</h4>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {analysisResult.detailed_analysis}
                </p>
              </div>
            )}

            {/* Facial Expressions */}
            {analysisResult.facial_expressions && analysisResult.facial_expressions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="text-2xl mr-2">😊</div>
                  <h4 className="font-semibold text-gray-800">
                    Facial Expressions Detected ({analysisResult.facial_expressions.length})
                  </h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {analysisResult.facial_expressions.slice(0, 8).map((expression, index) => (
                    <div key={index} className="emotion-badge emotion-neutral capitalize">
                      {expression.replace(/_/g, ' ')}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Body Language */}
            {analysisResult.body_language && analysisResult.body_language.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="text-2xl mr-2">🤝</div>
                  <h4 className="font-semibold text-gray-800">
                    Body Language Patterns ({analysisResult.body_language.length})
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {analysisResult.body_language.slice(0, 6).map((pattern, index) => (
                    <div key={index} className="flex items-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-green-600 mr-2">•</div>
                      <span className="text-sm text-gray-700 capitalize">
                        {pattern.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Premium Features Teaser */}
            {(!user || !user.features?.lie_detector) && (
              <div className="bg-gradient-to-r from-purple-50 to-primary-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <ShieldExclamationIcon className="w-6 h-6 text-purple-600 mr-2" />
                  <h4 className="font-semibold text-gray-800">Premium Features Available</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-red-500">🔍</div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Lie Detection Analysis</h5>
                      <p className="text-sm text-gray-600">Analyze micro-expressions for deception indicators</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="text-orange-500">😰</div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Stress & Anxiety Level</h5>
                      <p className="text-sm text-gray-600">Measure stress indicators and provide recommendations</p>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  {!user ? (
                    <button
                      onClick={onAuthRequired}
                      className="btn-primary"
                    >
                      Sign Up for Premium Features
                    </button>
                  ) : (
                    <button className="btn-primary">
                      Upgrade to Professional
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Usage Warning */}
        {usageLimits && !user && usageLimits.usage?.today >= 3 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <p className="font-semibold text-yellow-800">Daily Limit Notice</p>
                <p className="text-yellow-700 text-sm">
                  You've used {usageLimits.usage.today} of 5 free daily analyses. 
                  Register for unlimited daily analyses!
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ImageAnalysis;
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { useAnalysis } from '../context/AnalysisContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  CloudArrowUpIcon,
  FilmIcon,
  PlayIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const VideoAnalysis = ({ usageLimits, onAuthRequired }) => {
  const { analyzeVideo, loading } = useAnalysis();
  const { user } = useAuth();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [maxAnalyses, setMaxAnalyses] = useState(10);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file size (100MB limit - increased from original)
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`Video file too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 100MB.`);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast.error('Please upload a valid video file.');
        return;
      }

      // Show file size warning for large files
      const fileSizeMB = file.size / 1024 / 1024;
      if (fileSizeMB > 50) {
        toast.success(`Large video detected (${fileSizeMB.toFixed(1)}MB). Processing may take longer.`, {
          duration: 5000
        });
      }

      setSelectedVideo({
        file,
        preview: URL.createObjectURL(file),
        size: fileSizeMB
      });
      setAnalysisResult(null);
      setUploadProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']
    },
    multiple: false,
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  const handleAnalyze = async () => {
    if (!selectedVideo) {
      toast.error('Please select a video first.');
      return;
    }

    // Check usage limits
    if (usageLimits && !usageLimits.can_analyze) {
      if (!user) {
        toast.error('Daily limit reached. Please register for video analysis.');
        onAuthRequired();
        return;
      } else {
        toast.error('Daily analysis limit reached. Please upgrade your plan.');
        return;
      }
    }

    const result = await analyzeVideo(selectedVideo.file, {
      maxAnalyses,
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      }
    });

    if (result.success) {
      setAnalysisResult(result.data);
      setUploadProgress(0);
    }
  };

  const handleClearVideo = () => {
    if (selectedVideo?.preview) {
      URL.revokeObjectURL(selectedVideo.preview);
    }
    setSelectedVideo(null);
    setAnalysisResult(null);
    setUploadProgress(0);
  };

  const formatTimestamp = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8"
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🎬</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Video Emotion Analysis</h2>
          <p className="text-gray-600">Upload a video to analyze facial expressions and emotions throughout the timeline</p>
        </div>

        {/* Analysis Settings */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Analysis Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Key Moments to Analyze
              </label>
              <select
                value={maxAnalyses}
                onChange={(e) => setMaxAnalyses(parseInt(e.target.value))}
                className="input-field"
              >
                <option value={5}>5 moments (faster)</option>
                <option value={10}>10 moments (recommended)</option>
                <option value={15}>15 moments (detailed)</option>
                <option value={20}>20 moments (comprehensive)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Size Limit
              </label>
              <div className="input-field bg-gray-100 text-gray-600">
                100MB maximum (optimized for faster processing)
              </div>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : selectedVideo
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
          }`}
        >
          <input {...getInputProps()} />
          {selectedVideo ? (
            <div className="space-y-4">
              <div className="relative inline-block">
                <video
                  src={selectedVideo.preview}
                  className="max-w-sm max-h-64 rounded-lg shadow-md mx-auto"
                  controls
                  preload="metadata"
                />
              </div>
              <div className="text-sm text-gray-600">
                File size: {selectedVideo.size.toFixed(1)}MB
              </div>
              <div className="space-x-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearVideo();
                  }}
                  className="btn-ghost"
                >
                  Clear Video
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="btn-secondary"
                >
                  Change Video
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                {isDragActive ? (
                  <CloudArrowUpIcon className="w-8 h-8 text-primary-600" />
                ) : (
                  <FilmIcon className="w-8 h-8 text-primary-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {isDragActive ? 'Drop your video here' : 'Upload Video'}
                </h3>
                <p className="text-gray-500 mb-2">
                  Drag & drop or click to select • MP4, MOV, AVI, WebM • Max 100MB
                </p>
                <p className="text-sm text-gray-400">
                  Tip: Shorter videos (under 5 minutes) process faster
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Uploading video...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Analyze Button */}
        {selectedVideo && (
          <div className="mt-6 text-center">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="btn-primary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Analyzing Video...
                </>
              ) : (
                <>
                  <PlayIcon className="w-5 h-5 inline mr-2" />
                  Analyze Video ({maxAnalyses} key moments)
                </>
              )}
            </button>
            {!loading && (
              <p className="text-sm text-gray-500 mt-2">
                This may take 1-3 minutes depending on video length
              </p>
            )}
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
          >
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="text-green-600 mr-2">✅</div>
                <h3 className="font-semibold text-green-800">Video Analysis Complete!</h3>
              </div>
              <p className="text-green-700 text-sm">
                Found {analysisResult.analyses?.length || 0} significant emotional moments
                • Video Size: {analysisResult.videoInfo?.file_size_mb}MB
              </p>
            </div>

            {/* Summary Statistics */}
            {analysisResult.summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 text-center">
                  <ChartBarIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">
                    {analysisResult.summary.total_analyses || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Analyses</div>
                </div>
                
                <div className="card p-4 text-center">
                  <ClockIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">
                    {analysisResult.summary.timeline?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Timeline Events</div>
                </div>

                <div className="card p-4 text-center">
                  <SparklesIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">
                    {analysisResult.summary.dominant_emotions?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Unique Emotions</div>
                </div>
              </div>
            )}

            {/* Dominant Emotions */}
            {analysisResult.summary?.dominant_emotions && analysisResult.summary.dominant_emotions.length > 0 && (
              <div className="card p-6">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <ChartBarIcon className="w-5 h-5 mr-2" />
                  Dominant Emotions Throughout Video
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {analysisResult.summary.dominant_emotions.slice(0, 5).map(([emotion, count], index) => (
                    <div key={index} className="text-center">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-2">
                        {emotion === 'happy' ? '😊' :
                         emotion === 'sad' ? '😢' :
                         emotion === 'angry' ? '😠' :
                         emotion === 'surprised' ? '😲' :
                         emotion === 'neutral' ? '😐' : '🤔'}
                      </div>
                      <div className="font-semibold text-gray-800 capitalize">{emotion}</div>
                      <div className="text-sm text-gray-600">{count} times</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {analysisResult.summary?.timeline && analysisResult.summary.timeline.length > 0 && (
              <div className="card p-6">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <ClockIcon className="w-5 h-5 mr-2" />
                  Expression Timeline
                </h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {analysisResult.summary.timeline.slice(0, 10).map((moment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-mono text-gray-600 bg-white px-2 py-1 rounded">
                          {formatTimestamp(moment.timestamp)}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {moment.expressions.slice(0, 3).map((expr, i) => (
                            <span key={i} className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full capitalize">
                              {expr.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {moment.significance ? `${(moment.significance * 100).toFixed(0)}%` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Analysis */}
            {analysisResult.analyses && analysisResult.analyses.length > 0 && (
              <div className="card p-6">
                <h4 className="font-semibold text-gray-800 mb-4">
                  Detailed Analysis of Key Moments
                </h4>
                <div className="space-y-4">
                  {analysisResult.analyses.slice(0, 6).map((analysis, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="text-lg font-semibold text-primary-600">
                            Moment {index + 1}
                          </div>
                          <div className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {formatTimestamp(analysis.timestamp)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Significance: {(analysis.significance_score * 100).toFixed(0)}%
                        </div>
                      </div>
                      
                      {/* Expressions */}
                      <div className="mb-3">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Detected Expressions:</div>
                        <div className="flex flex-wrap gap-1">
                          {analysis.expressions.map((expr, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                              {expr.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* AI Analysis */}
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        <div className="font-semibold mb-1">AI Analysis:</div>
                        {analysis.ai_analysis}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results Message */}
            {(!analysisResult.analyses || analysisResult.analyses.length === 0) && (
              <div className="card p-6 text-center">
                <div className="text-4xl mb-4">🤔</div>
                <h4 className="font-semibold text-gray-800 mb-2">No Significant Expressions Detected</h4>
                <p className="text-gray-600 mb-4">This could mean:</p>
                <ul className="text-sm text-gray-600 text-left max-w-md mx-auto space-y-1">
                  <li>• No clear face visible throughout the video</li>
                  <li>• Video quality is too low for accurate detection</li>
                  <li>• Mostly neutral expressions with minimal changes</li>
                  <li>• Poor lighting or camera angle</li>
                </ul>
                <div className="mt-4 text-sm text-gray-500">
                  Try uploading a video with clear, well-lit faces for better results
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
                  Register for unlimited video analysis!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">💡 Tips for Better Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <div className="font-semibold text-gray-700 mb-1">Video Quality</div>
              <p>• Good lighting and clear face visibility</p>
              <p>• Stable camera angle</p>
              <p>• Resolution of at least 480p</p>
            </div>
            <div>
              <div className="font-semibold text-gray-700 mb-1">Performance</div>
              <p>• Shorter videos (under 5 min) process faster</p>
              <p>• Smaller file sizes upload quicker</p>
              <p>• MP4 format works best</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VideoAnalysis;
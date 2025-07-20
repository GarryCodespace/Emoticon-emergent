import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const AnalysisContext = createContext();

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};

export const AnalysisProvider = ({ children }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usageLimits, setUsageLimits] = useState(null);

  // Analyze image
  const analyzeImage = useCallback(async (file, context = '') => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      if (context) {
        formData.append('context', context);
      }
      
      const response = await apiService.analyzeImage(formData);
      
      if (response.data.success) {
        const analysis = {
          id: response.data.session_id,
          type: 'image',
          timestamp: new Date(response.data.timestamp),
          ...response.data.analysis
        };
        
        // Add to history
        setHistory(prev => [analysis, ...prev.slice(0, 19)]); // Keep last 20
        
        toast.success('Image analysis completed! 🎭');
        return { success: true, data: analysis };
      } else {
        throw new Error(response.data.error || 'Analysis failed');
      }
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Image analysis failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Analyze video
  const analyzeVideo = useCallback(async (file, options = {}) => {
    try {
      setLoading(true);
      
      // Check file size
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        throw new Error('Video file is too large. Maximum size is 100MB.');
      }
      
      const formData = new FormData();
      formData.append('file', file);
      if (options.maxAnalyses) {
        formData.append('max_analyses', options.maxAnalyses);
      }
      
      const response = await apiService.analyzeVideo(formData, {
        onUploadProgress: options.onUploadProgress
      });
      
      if (response.data.success) {
        const analysis = {
          id: response.data.session_id,
          type: 'video',
          timestamp: new Date(response.data.timestamp),
          summary: response.data.summary,
          analyses: response.data.analyses,
          videoInfo: response.data.video_info
        };
        
        // Add to history
        setHistory(prev => [analysis, ...prev.slice(0, 19)]);
        
        toast.success(`Video analysis completed! Found ${response.data.analyses.length} significant moments 🎬`);
        return { success: true, data: analysis };
      } else {
        throw new Error(response.data.message || 'Video analysis failed');
      }
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Video analysis failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Load analysis history
  const loadHistory = useCallback(async (limit = 20) => {
    try {
      const response = await apiService.getHistory(limit);
      
      if (response.data.success) {
        const formattedHistory = response.data.history.map(item => ({
          id: item.timestamp,
          type: item.analysis_type,
          timestamp: new Date(item.timestamp),
          expressions: item.expressions,
          analysis: item.ai_analysis,
          confidence: item.confidence
        }));
        
        setHistory(formattedHistory);
        return { success: true, data: formattedHistory };
      }
    } catch (error) {
      // Don't show error toast for history loading failure
      console.error('Failed to load history:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Load usage limits
  const loadUsageLimits = useCallback(async () => {
    try {
      const response = await apiService.getUsageLimits();
      
      if (response.data.success) {
        setUsageLimits(response.data);
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error('Failed to load usage limits:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    toast.success('Analysis history cleared');
  }, []);

  // Get emotion color for display
  const getEmotionColor = useCallback((emotion) => {
    const emotionColors = {
      happy: 'text-green-600 bg-green-100',
      joy: 'text-green-600 bg-green-100',
      sad: 'text-gray-600 bg-gray-100',
      angry: 'text-red-600 bg-red-100',
      surprise: 'text-yellow-600 bg-yellow-100',
      surprised: 'text-yellow-600 bg-yellow-100',
      fear: 'text-purple-600 bg-purple-100',
      neutral: 'text-blue-600 bg-blue-100',
      confident: 'text-indigo-600 bg-indigo-100',
      stressed: 'text-orange-600 bg-orange-100'
    };
    
    const normalizedEmotion = emotion.toLowerCase();
    return emotionColors[normalizedEmotion] || emotionColors.neutral;
  }, []);

  const value = {
    history,
    loading,
    usageLimits,
    analyzeImage,
    analyzeVideo,
    loadHistory,
    loadUsageLimits,
    clearHistory,
    getEmotionColor
  };

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
};
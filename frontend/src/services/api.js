import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8001/api',
  timeout: 30000, // 30 second timeout for video uploads
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('emoticon_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timed out. Please try again.');
    } else if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('emoticon_token');
          localStorage.removeItem('emoticon_user');
          if (data.detail !== 'Not authenticated') {
            toast.error('Session expired. Please login again.');
          }
          break;
          
        case 403:
          toast.error('Access denied. Please check your permissions.');
          break;
          
        case 413:
          toast.error('File too large. Please use a smaller file.');
          break;
          
        case 429:
          toast.error(data.detail || 'Too many requests. Please try again later.');
          break;
          
        case 500:
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          if (data.detail) {
            toast.error(data.detail);
          } else if (data.error) {
            toast.error(data.error);
          } else {
            toast.error('Something went wrong. Please try again.');
          }
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('Something went wrong. Please try again.');
    }
    
    return Promise.reject(error);
  }
);

// API service methods
export const apiService = {
  // Health check
  healthCheck: () => api.get('/health'),
  
  // Authentication
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  
  // User profile
  getProfile: () => api.get('/user/profile'),
  getHistory: (limit = 10) => api.get(`/user/history?limit=${limit}`),
  
  // Analysis
  analyzeImage: (formData, options = {}) => {
    return api.post('/analyze-image', formData, {
      ...options,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...options.headers,
      },
    });
  },
  
  analyzeVideo: (formData, options = {}) => {
    return api.post('/analyze-video', formData, {
      ...options,
      timeout: 60000, // 1 minute timeout for videos
      headers: {
        'Content-Type': 'multipart/form-data',
        ...options.headers,
      },
      onUploadProgress: options.onUploadProgress,
    });
  },
  
  // Usage and limits
  getUsageLimits: () => api.get('/usage/limits'),
  getPricingPlans: () => api.get('/pricing/plans'),
};

// WebSocket service for live analysis
export class LiveAnalysisService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.onAnalysis = null;
    this.onError = null;
  }
  
  connect() {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = process.env.REACT_APP_API_URL?.replace('http', 'ws') || 'ws://localhost:8001/api';
        this.ws = new WebSocket(`${wsUrl}/live-analysis`);
        
        this.ws.onopen = () => {
          this.isConnected = true;
          console.log('✅ Live analysis WebSocket connected');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'analysis' && this.onAnalysis) {
              this.onAnalysis(data.data);
            } else if (data.type === 'error' && this.onError) {
              this.onError(data.message);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (this.onError) {
            this.onError('Connection error');
          }
          reject(error);
        };
        
        this.ws.onclose = () => {
          this.isConnected = false;
          console.log('🔌 Live analysis WebSocket disconnected');
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  sendFrame(imageData) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({
        type: 'frame',
        image: imageData
      }));
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
  
  setOnAnalysis(callback) {
    this.onAnalysis = callback;
  }
  
  setOnError(callback) {
    this.onError = callback;
  }
}

export default api;
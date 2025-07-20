import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  ClockIcon,
  EyeIcon,
  StarIcon,
  TrendingUpIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const UserDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { loadHistory, loadUsageLimits, history, getEmotionColor } = useAnalysis();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [historyResult, limitsResult] = await Promise.all([
        loadHistory(20),
        loadUsageLimits()
      ]);

      if (limitsResult.success) {
        setStats(limitsResult.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-600 mb-6">Please login to view your dashboard</p>
        <Link to="/" className="btn-primary">
          Go to Home
        </Link>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAnalysisTypeIcon = (type) => {
    switch (type) {
      case 'image': return '📷';
      case 'video': return '🎬';
      case 'webcam': return '📹';
      default: return '🎭';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center lg:text-left"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.email.split('@')[0]}! 👋
          </h1>
          <p className="text-gray-600">
            Here's your emotion analysis activity and insights
          </p>
        </motion.div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Analyses</p>
                <p className="text-3xl font-bold text-gray-900">{stats.usage?.today || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <EyeIcon className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <span className="text-green-600">
                  {stats.limits?.daily_analyses === -1 ? 'Unlimited' : `${stats.limits?.daily_analyses || 5} daily limit`}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-gray-900">{stats.usage?.this_month || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Plan</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{stats.plan || 'Free'}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <StarIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/pricing" className="text-sm text-primary-600 hover:text-primary-700">
                View plans →
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Analyses</p>
                <p className="text-3xl font-bold text-gray-900">{stats.usage?.total || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUpIcon className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Feature Access */}
      {user.features && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Feature Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { key: 'save_history', label: 'Save History', icon: '💾' },
              { key: 'lie_detector', label: 'Lie Detection', icon: '🔍' },
              { key: 'stress_detector', label: 'Stress Analysis', icon: '😰' },
              { key: 'advanced_features', label: 'Advanced Features', icon: '⭐' },
              { key: 'api_access', label: 'API Access', icon: '🔌' }
            ].map(feature => (
              <div key={feature.key} className="text-center p-3 rounded-lg bg-gray-50">
                <div className="text-2xl mb-1">{feature.icon}</div>
                <div className="text-sm font-medium text-gray-800">{feature.label}</div>
                <div className={`text-xs mt-1 ${user.features[feature.key] ? 'text-green-600' : 'text-gray-400'}`}>
                  {user.features[feature.key] ? '✓ Available' : '✗ Upgrade'}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Analysis History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Analysis History</h2>
          {history.length > 0 && (
            <button className="text-sm text-primary-600 hover:text-primary-700">
              View All
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <div className="space-y-4">
            {history.slice(0, 10).map((item, index) => (
              <div key={item.id || index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl border border-gray-200">
                    {getAnalysisTypeIcon(item.type)}
                  </div>
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {item.type} Analysis
                    </h3>
                    <div className="text-sm text-gray-500 flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {formatDate(item.timestamp)}
                    </div>
                  </div>
                  
                  {item.expressions && item.expressions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {item.expressions.slice(0, 4).map((expr, i) => (
                        <span
                          key={i}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getEmotionColor(expr)}`}
                        >
                          {expr.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {item.expressions.length > 4 && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                          +{item.expressions.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  {item.analysis && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.analysis.length > 100 
                        ? `${item.analysis.substring(0, 100)}...` 
                        : item.analysis
                      }
                    </p>
                  )}
                  
                  {item.confidence && (
                    <div className="mt-2 text-xs text-gray-500">
                      Confidence: {(item.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Analysis History</h3>
            <p className="text-gray-600 mb-4">Start analyzing images or videos to see your history here</p>
            <Link to="/" className="btn-primary">
              Start Analyzing
            </Link>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Link to="/" className="card p-6 hover:shadow-lg transition-shadow duration-300 text-center">
          <div className="text-4xl mb-4">📷</div>
          <h3 className="font-semibold text-gray-900 mb-2">Analyze Image</h3>
          <p className="text-gray-600 text-sm">Upload an image for emotion analysis</p>
        </Link>

        <Link to="/" className="card p-6 hover:shadow-lg transition-shadow duration-300 text-center">
          <div className="text-4xl mb-4">🎬</div>
          <h3 className="font-semibold text-gray-900 mb-2">Analyze Video</h3>
          <p className="text-gray-600 text-sm">Process video for timeline analysis</p>
        </Link>

        <Link to="/pricing" className="card p-6 hover:shadow-lg transition-shadow duration-300 text-center">
          <div className="text-4xl mb-4">⭐</div>
          <h3 className="font-semibold text-gray-900 mb-2">Upgrade Plan</h3>
          <p className="text-gray-600 text-sm">Unlock premium features</p>
        </Link>
      </motion.div>
    </div>
  );
};

export default UserDashboard;
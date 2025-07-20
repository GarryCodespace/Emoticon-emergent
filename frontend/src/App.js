import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Import components
import Header from './components/Header';
import Hero from './components/Hero';
import ImageAnalysis from './components/ImageAnalysis';
import VideoAnalysis from './components/VideoAnalysis';
import LiveAnalysis from './components/LiveAnalysis';
import AuthModal from './components/AuthModal';
import UserDashboard from './components/UserDashboard';
import PricingPage from './components/PricingPage';
import Footer from './components/Footer';

// Import context and services
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnalysisProvider } from './context/AnalysisContext';
import api from './services/api';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('image');
  const [showAuth, setShowAuth] = useState(false);
  const [usageLimits, setUsageLimits] = useState(null);

  // Load usage limits on component mount
  useEffect(() => {
    const loadUsageLimits = async () => {
      try {
        const response = await api.get('/usage/limits');
        if (response.data.success) {
          setUsageLimits(response.data);
        }
      } catch (error) {
        console.error('Failed to load usage limits:', error);
      }
    };

    loadUsageLimits();
  }, [user]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Show loading screen while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎭</div>
          <div className="text-xl font-semibold text-gray-700">Loading Emoticon...</div>
          <div className="text-sm text-gray-500 mt-2">Preparing AI emotion analysis</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50">
      {/* Header */}
      <Header onAuthClick={() => setShowAuth(true)} />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={
            <>
              {/* Hero Section */}
              <Hero />
              
              {/* Analysis Tabs */}
              <div className="mt-12">
                <div className="flex justify-center mb-8">
                  <div className="bg-white rounded-xl p-2 shadow-lg border border-gray-200">
                    <div className="flex space-x-1">
                      {[
                        { id: 'image', label: '📷 Image Analysis', icon: '🖼️' },
                        { id: 'video', label: '🎥 Video Analysis', icon: '🎬' },
                        { id: 'live', label: '📹 Live Camera', icon: '📸' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                            activeTab === tab.id
                              ? 'bg-primary-600 text-white shadow-md transform scale-105'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                          }`}
                        >
                          <span className="mr-2">{tab.icon}</span>
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Analysis Components */}
                <div className="animate-fade-in">
                  {activeTab === 'image' && (
                    <ImageAnalysis 
                      usageLimits={usageLimits} 
                      onAuthRequired={() => setShowAuth(true)}
                    />
                  )}
                  {activeTab === 'video' && (
                    <VideoAnalysis 
                      usageLimits={usageLimits} 
                      onAuthRequired={() => setShowAuth(true)}
                    />
                  )}
                  {activeTab === 'live' && (
                    <LiveAnalysis 
                      usageLimits={usageLimits} 
                      onAuthRequired={() => setShowAuth(true)}
                    />
                  )}
                </div>
              </div>
              
              {/* Usage Stats */}
              {usageLimits && (
                <div className="mt-12 text-center">
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 max-w-md mx-auto">
                    <h3 className="font-semibold text-gray-800 mb-4">Today's Usage</h3>
                    <div className="flex justify-center items-center space-x-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-600">
                          {usageLimits.usage?.today || 0}
                        </div>
                        <div className="text-sm text-gray-500">
                          {usageLimits.limits?.daily_analyses === -1 
                            ? '/ Unlimited'
                            : `/ ${usageLimits.limits?.daily_analyses || 5}`
                          }
                        </div>
                      </div>
                      <div className="text-gray-300">|</div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-700">
                          {usageLimits.plan?.charAt(0).toUpperCase() + usageLimits.plan?.slice(1) || 'Free'}
                        </div>
                        <div className="text-sm text-gray-500">Current Plan</div>
                      </div>
                    </div>
                    
                    {!user && usageLimits.usage?.today >= 3 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          💡 Register for unlimited daily analyses!
                        </p>
                        <button
                          onClick={() => setShowAuth(true)}
                          className="mt-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
                        >
                          Sign Up Now →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          } />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/pricing" element={<PricingPage />} />
        </Routes>
      </main>
      
      {/* Footer */}
      <Footer />
      
      {/* Auth Modal */}
      {showAuth && (
        <AuthModal 
          isOpen={showAuth} 
          onClose={() => setShowAuth(false)} 
        />
      )}
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AnalysisProvider>
          <AppContent />
        </AnalysisProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
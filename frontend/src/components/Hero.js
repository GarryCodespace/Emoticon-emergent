import React from 'react';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  EyeIcon, 
  HeartIcon, 
  BoltIcon 
} from '@heroicons/react/24/outline';

const Hero = () => {
  const features = [
    {
      icon: <EyeIcon className="w-6 h-6" />,
      title: 'Advanced AI Vision',
      description: 'Powered by GPT-4o for precise emotion detection'
    },
    {
      icon: <BoltIcon className="w-6 h-6" />,
      title: 'Real-time Analysis',
      description: 'Instant results from images and live camera'
    },
    {
      icon: <HeartIcon className="w-6 h-6" />,
      title: 'Emotion Insights',
      description: 'Detailed analysis of facial expressions and mood'
    },
    {
      icon: <SparklesIcon className="w-6 h-6" />,
      title: 'Premium Features',
      description: 'Lie detection, stress analysis & more'
    }
  ];

  return (
    <div className="text-center py-16">
      {/* Main Hero Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto"
      >
        {/* Hero Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-800 text-sm font-semibold mb-8"
        >
          <SparklesIcon className="w-4 h-4 mr-2" />
          Powered by OpenAI GPT-4o
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold text-gray-900 mb-6"
        >
          <span className="gradient-text">Emoticon</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed"
        >
          Advanced AI-powered emotion analysis platform
          <br />
          <span className="text-lg text-gray-500">
            Analyze facial expressions, detect emotions, and gain deep insights
          </span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <button
            onClick={() => document.getElementById('analysis-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            🎭 Try Analysis Now
          </button>
          <a
            href="#features"
            className="btn-secondary text-lg px-8 py-4"
          >
            Learn More
          </a>
        </motion.div>

        {/* Demo Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative max-w-3xl mx-auto mb-16"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Emoticon - AI Emotion Analysis
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-pulse-subtle">😊</div>
                <div className="text-xl font-semibold text-gray-800 mb-2">
                  Analysis Complete!
                </div>
                <div className="text-gray-600 mb-4">
                  Detected: Happy, Confident, Engaged
                </div>
                <div className="flex justify-center space-x-2">
                  <span className="emotion-badge emotion-happy">Happy 92%</span>
                  <span className="emotion-badge emotion-neutral">Confident 89%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        id="features"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
            className="card p-6 text-center hover:scale-105 transition-transform duration-300"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 mx-auto mb-4">
              {feature.icon}
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-600">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Start Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="mt-16 max-w-4xl mx-auto"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              title: 'Upload or Capture',
              description: 'Upload an image, record video, or use live camera',
              emoji: '📸'
            },
            {
              step: '2',
              title: 'AI Analysis',
              description: 'Our advanced AI analyzes facial expressions and emotions',
              emoji: '🤖'
            },
            {
              step: '3',
              title: 'Get Insights',
              description: 'Receive detailed emotion analysis and actionable insights',
              emoji: '📊'
            }
          ].map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4 + index * 0.2, duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {step.step}
              </div>
              <div className="text-4xl mb-3">{step.emoji}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Hero;
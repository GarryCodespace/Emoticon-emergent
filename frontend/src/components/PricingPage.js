import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const PricingPage = () => {
  const { user } = useAuth();

  const plans = [
    {
      id: 'free',
      name: 'Free Trial',
      price: 0,
      priceDisplay: 'Free',
      description: 'Perfect for trying out our emotion analysis',
      features: [
        '5 analyses per day',
        'Basic emotion detection',
        'Image analysis only',
        'Community support'
      ],
      limitations: [
        'No history saving',
        'No video analysis',
        'No premium features',
        'Limited accuracy'
      ],
      recommended: false,
      current: user?.plan?.current === 'free'
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 9.99,
      priceDisplay: '$9.99',
      description: 'Great for personal use and small projects',
      features: [
        'Unlimited daily analyses',
        'Image & video analysis',
        'Save analysis history',
        'Email support',
        'Export results'
      ],
      limitations: [
        'No lie detection',
        'No stress analysis',
        'No API access'
      ],
      recommended: true,
      current: user?.plan?.current === 'basic'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 19.99,
      priceDisplay: '$19.99',
      description: 'Perfect for professionals and businesses',
      features: [
        'Everything in Basic',
        'AI lie detector',
        'Stress & anxiety analysis',
        'Advanced body language analysis',
        'Priority support',
        'Detailed reports'
      ],
      limitations: [
        'No API access',
        'No bulk processing'
      ],
      recommended: false,
      current: user?.plan?.current === 'professional'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 49.99,
      priceDisplay: '$49.99',
      description: 'For teams and large-scale applications',
      features: [
        'Everything in Professional',
        'API access',
        'Bulk analysis',
        'Custom integrations',
        'Dedicated support',
        'Team management',
        'Custom models'
      ],
      limitations: [],
      recommended: false,
      current: user?.plan?.current === 'enterprise'
    }
  ];

  const handlePlanSelect = (planId) => {
    if (planId === 'free') {
      // Handle free plan selection
      alert('You are already on the free plan!');
    } else {
      // Handle paid plan selection
      alert(`Upgrading to ${planId} plan coming soon! Please contact support for early access.`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="text-4xl mb-4">💎</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Unlock the full potential of AI-powered emotion analysis with our flexible pricing plans
        </p>
        
        {user && (
          <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <p className="text-blue-800">
              Current plan: <span className="font-semibold capitalize">{user.plan?.name || 'Free'}</span>
            </p>
          </div>
        )}
      </motion.div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
              plan.recommended
                ? 'border-primary-500 scale-105'
                : plan.current
                ? 'border-green-500'
                : 'border-gray-200'
            }`}
          >
            {/* Recommended Badge */}
            {plan.recommended && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              </div>
            )}

            {/* Current Plan Badge */}
            {plan.current && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Current Plan
                </div>
              </div>
            )}

            <div className="p-8">
              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.priceDisplay}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-500 text-lg">/month</span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <div className="mb-6">
                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center">
                      <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation, i) => (
                    <div key={i} className="flex items-center opacity-50">
                      <XMarkIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                      <span className="text-gray-500 text-sm line-through">{limitation}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <div className="text-center">
                {plan.current ? (
                  <button
                    disabled
                    className="w-full bg-green-100 text-green-800 py-3 px-6 rounded-lg font-semibold cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : plan.id === 'free' ? (
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    className="w-full btn-ghost py-3"
                  >
                    Continue Free
                  </button>
                ) : (
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                      plan.recommended
                        ? 'btn-primary'
                        : 'btn-secondary'
                    }`}
                  >
                    {user ? 'Upgrade Now' : 'Get Started'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Feature Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-12"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Feature Comparison
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Features</th>
                {plans.map(plan => (
                  <th key={plan.id} className="text-center py-4 px-6 font-semibold text-gray-900">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Daily Analyses', '5', 'Unlimited', 'Unlimited', 'Unlimited'],
                ['Image Analysis', '✓', '✓', '✓', '✓'],
                ['Video Analysis', '✗', '✓', '✓', '✓'],
                ['Save History', '✗', '✓', '✓', '✓'],
                ['Lie Detection', '✗', '✗', '✓', '✓'],
                ['Stress Analysis', '✗', '✗', '✓', '✓'],
                ['API Access', '✗', '✗', '✗', '✓'],
                ['Priority Support', '✗', '✗', '✓', '✓'],
                ['Custom Models', '✗', '✗', '✗', '✓']
              ].map(([feature, ...values], i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-4 px-6 font-medium text-gray-900">{feature}</td>
                  {values.map((value, j) => (
                    <td key={j} className="text-center py-4 px-6">
                      {value === '✓' ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                      ) : value === '✗' ? (
                        <XMarkIcon className="w-5 h-5 text-gray-300 mx-auto" />
                      ) : (
                        <span className="text-gray-700">{value}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="max-w-3xl mx-auto"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-6">
          {[
            {
              question: 'Can I change plans anytime?',
              answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.'
            },
            {
              question: 'What payment methods do you accept?',
              answer: 'We accept all major credit cards, PayPal, and bank transfers for enterprise customers.'
            },
            {
              question: 'Is there a free trial for paid plans?',
              answer: 'Our Free plan gives you a taste of our capabilities. For paid plans, we offer a 30-day money-back guarantee.'
            },
            {
              question: 'How accurate is the emotion detection?',
              answer: 'Our AI models achieve 92%+ accuracy on standard emotion recognition benchmarks, with continuous improvements through machine learning.'
            }
          ].map((faq, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="text-center mt-16 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-8 text-white"
      >
        <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-xl mb-6 opacity-90">
          Join thousands of users who trust Emoticon for their emotion analysis needs
        </p>
        <div className="space-x-4">
          <button className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Start Free Trial
          </button>
          <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors">
            Contact Sales
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PricingPage;
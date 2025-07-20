"""
Optimized Payment Plans and Usage Tracking System
Enhanced for FastAPI backend with better guest user support
"""
import streamlit as st
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json

class PaymentPlans:
    """Enhanced payment plans with guest user support"""
    
    PLANS = {
        'free': {
            'name': 'Free Trial',
            'price': 0,
            'price_display': 'Free',
            'features': [
                '5 analyses per day',
                'Basic emotion detection',
                'Image analysis only',
                'No history saving'
            ],
            'limits': {
                'daily_analyses': 5,
                'video_analysis': False,
                'save_history': False,
                'lie_detector': False,
                'stress_detector': False,
                'advanced_features': False,
                'api_access': False
            },
            'recommended': False
        },
        'basic': {
            'name': 'Basic',
            'price': 9.99,
            'price_display': '$9.99/month',
            'features': [
                'Unlimited daily analyses',
                'Image & video analysis',
                'Save analysis history',
                'Email support'
            ],
            'limits': {
                'daily_analyses': -1,  # Unlimited
                'video_analysis': True,
                'save_history': True,
                'lie_detector': False,
                'stress_detector': False,
                'advanced_features': False,
                'api_access': False
            },
            'recommended': True
        },
        'professional': {
            'name': 'Professional',
            'price': 19.99,
            'price_display': '$19.99/month',
            'features': [
                'Everything in Basic',
                'AI lie detector',
                'Stress & anxiety analysis',
                'Advanced body language analysis',
                'Priority support'
            ],
            'limits': {
                'daily_analyses': -1,
                'video_analysis': True,
                'save_history': True,
                'lie_detector': True,
                'stress_detector': True,
                'advanced_features': True,
                'api_access': False
            },
            'recommended': False
        },
        'enterprise': {
            'name': 'Enterprise',
            'price': 49.99,
            'price_display': '$49.99/month',
            'features': [
                'Everything in Professional',
                'API access',
                'Bulk analysis',
                'Custom integrations',
                'Dedicated support'
            ],
            'limits': {
                'daily_analyses': -1,
                'video_analysis': True,
                'save_history': True,
                'lie_detector': True,
                'stress_detector': True,
                'advanced_features': True,
                'api_access': True
            },
            'recommended': False
        }
    }
    
    @classmethod
    def get_user_plan(cls, user_id: Optional[str] = None) -> str:
        """Get user's current plan, defaulting to free for guests"""
        if not user_id:
            return 'free'
        
        # In production, this would query the database
        # For now, return free plan
        return 'free'
    
    @classmethod
    def get_plan_info(cls, plan_id: str) -> Dict:
        """Get plan information"""
        return cls.PLANS.get(plan_id, cls.PLANS['free'])
    
    @classmethod
    def get_usage_limits(cls, plan_id: str) -> Dict:
        """Get usage limits for a plan"""
        plan = cls.get_plan_info(plan_id)
        return plan.get('limits', cls.PLANS['free']['limits'])
    
    @classmethod
    def can_access_feature(cls, feature_key: str, plan_id: str = None) -> bool:
        """Check if user can access a specific feature"""
        if not plan_id:
            plan_id = 'free'
        
        limits = cls.get_usage_limits(plan_id)
        return limits.get(feature_key, False)
    
    @classmethod
    def check_daily_limit_guest(cls, user_id: Optional[str] = None) -> bool:
        """Check daily limit with guest user support"""
        if not user_id:
            # Guest user - check session-based limit
            return cls._check_guest_daily_limit()
        
        # Registered user - check database-based limit
        return cls.check_daily_limit(user_id)
    
    @classmethod
    def _check_guest_daily_limit(cls) -> bool:
        """Check daily limit for guest users using session state"""
        try:
            import streamlit as st
            if 'guest_usage' not in st.session_state:
                st.session_state.guest_usage = {
                    'date': datetime.now().strftime('%Y-%m-%d'),
                    'count': 0
                }
            
            today = datetime.now().strftime('%Y-%m-%d')
            if st.session_state.guest_usage['date'] != today:
                # Reset counter for new day
                st.session_state.guest_usage = {
                    'date': today,
                    'count': 0
                }
            
            # Check limit (5 for free tier)
            return st.session_state.guest_usage['count'] < 5
        except:
            # Fallback - allow analysis
            return True
    
    @classmethod
    def check_daily_limit(cls, user_id: str = None) -> bool:
        """Check if user is within daily analysis limit"""
        if not user_id:
            return cls._check_guest_daily_limit()
        
        plan = cls.get_user_plan(user_id)
        limits = cls.get_usage_limits(plan)
        
        daily_limit = limits.get('daily_analyses', 5)
        if daily_limit == -1:  # Unlimited
            return True
        
        # In production, check actual usage from database
        current_usage = UsageTracker.get_today_count(user_id)
        return current_usage < daily_limit
    
    @classmethod
    def get_upgrade_suggestion(cls, current_plan: str) -> Optional[str]:
        """Suggest next plan upgrade"""
        if current_plan == 'free':
            return 'basic'
        elif current_plan == 'basic':
            return 'professional'
        elif current_plan == 'professional':
            return 'enterprise'
        return None

class UsageTracker:
    """Enhanced usage tracking with guest support"""
    
    @classmethod
    def track_analysis(cls, analysis_type: str, user_id: Optional[str] = None):
        """Track analysis usage"""
        if not user_id:
            cls._track_guest_analysis()
            return
        
        # In production, save to database
        # For now, just increment session counter
        try:
            import streamlit as st
            if 'user_usage' not in st.session_state:
                st.session_state.user_usage = {}
            
            today = datetime.now().strftime('%Y-%m-%d')
            if today not in st.session_state.user_usage:
                st.session_state.user_usage[today] = 0
            
            st.session_state.user_usage[today] += 1
        except:
            pass
    
    @classmethod
    def _track_guest_analysis(cls):
        """Track analysis for guest users"""
        try:
            import streamlit as st
            if 'guest_usage' not in st.session_state:
                st.session_state.guest_usage = {
                    'date': datetime.now().strftime('%Y-%m-%d'),
                    'count': 0
                }
            
            today = datetime.now().strftime('%Y-%m-%d')
            if st.session_state.guest_usage['date'] != today:
                st.session_state.guest_usage = {
                    'date': today,
                    'count': 1
                }
            else:
                st.session_state.guest_usage['count'] += 1
        except:
            pass
    
    @classmethod
    def get_usage_stats(cls, user_id: Optional[str] = None) -> Dict:
        """Get usage statistics"""
        if not user_id:
            return cls._get_guest_usage_stats()
        
        # In production, query database
        # For now, return mock data
        try:
            import streamlit as st
            user_usage = st.session_state.get('user_usage', {})
            today = datetime.now().strftime('%Y-%m-%d')
            
            return {
                'today': user_usage.get(today, 0),
                'this_week': sum(user_usage.values()),
                'this_month': sum(user_usage.values()),
                'total': sum(user_usage.values())
            }
        except:
            return {
                'today': 0,
                'this_week': 0,
                'this_month': 0,
                'total': 0
            }
    
    @classmethod
    def _get_guest_usage_stats(cls) -> Dict:
        """Get usage stats for guest users"""
        try:
            import streamlit as st
            guest_usage = st.session_state.get('guest_usage', {'count': 0})
            today_count = guest_usage.get('count', 0)
            
            return {
                'today': today_count,
                'this_week': today_count,
                'this_month': today_count,
                'total': today_count
            }
        except:
            return {
                'today': 0,
                'this_week': 0,
                'this_month': 0,
                'total': 0
            }
    
    @classmethod
    def get_today_count(cls, user_id: Optional[str] = None) -> int:
        """Get today's usage count"""
        stats = cls.get_usage_stats(user_id)
        return stats.get('today', 0)
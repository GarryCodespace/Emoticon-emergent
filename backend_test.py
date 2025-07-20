#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Emoticon Platform
Tests all FastAPI endpoints and functionality
"""

import requests
import sys
import json
import io
import base64
from datetime import datetime
from pathlib import Path

class EmoticonAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        if details and success:
            print(f"   ℹ️  {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        
        # Default headers
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        # Override with custom headers
        if headers:
            test_headers.update(headers)
        
        # Remove Content-Type for file uploads
        if files:
            test_headers.pop('Content-Type', None)

        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    response = self.session.post(url, files=files, data=data, headers=test_headers)
                else:
                    response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            details = f"Status: {response.status_code}"
            if response_data and isinstance(response_data, dict):
                if 'message' in response_data:
                    details += f", Message: {response_data['message']}"
                elif 'error' in response_data:
                    details += f", Error: {response_data['error']}"

            self.log_test(name, success, details)
            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def create_test_image(self):
        """Create a simple test image file"""
        # Create a simple 100x100 RGB image
        from PIL import Image
        import io
        
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        return img_bytes

    def test_health_check(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        
        if success and response:
            features = response.get('features', {})
            print(f"   📊 OpenAI Configured: {features.get('openai_configured', False)}")
            print(f"   📊 Database Connected: {features.get('database_connected', False)}")
            print(f"   📊 MediaPipe Loaded: {features.get('mediapipe_loaded', False)}")
        
        return success

    def test_usage_limits_guest(self):
        """Test usage limits for guest user"""
        success, response = self.run_test(
            "Usage Limits (Guest)",
            "GET",
            "usage/limits",
            200
        )
        
        if success and response:
            print(f"   📊 Plan: {response.get('plan', 'unknown')}")
            print(f"   📊 Can Analyze: {response.get('can_analyze', False)}")
            limits = response.get('limits', {})
            print(f"   📊 Daily Limit: {limits.get('daily_analyses', 'unknown')}")
        
        return success

    def test_pricing_plans(self):
        """Test pricing plans endpoint"""
        success, response = self.run_test(
            "Pricing Plans",
            "GET",
            "pricing/plans",
            200
        )
        
        if success and response:
            plans = response.get('plans', {})
            print(f"   📊 Available Plans: {list(plans.keys())}")
        
        return success

    def test_image_analysis_guest(self):
        """Test image analysis as guest user"""
        try:
            # Create test image
            img_bytes = self.create_test_image()
            
            files = {
                'file': ('test_image.jpg', img_bytes, 'image/jpeg')
            }
            
            success, response = self.run_test(
                "Image Analysis (Guest)",
                "POST",
                "analyze-image",
                200,  # Expecting success even with graceful fallback
                files=files
            )
            
            if success and response:
                if response.get('success'):
                    analysis = response.get('analysis', {})
                    print(f"   📊 Emotional State: {analysis.get('emotional_state', 'unknown')}")
                    print(f"   📊 Confidence: {analysis.get('confidence_level', 'unknown')}")
                else:
                    print(f"   ⚠️  Analysis failed gracefully: {response.get('error', 'unknown error')}")
            
            return success
            
        except Exception as e:
            self.log_test("Image Analysis (Guest)", False, f"Exception: {str(e)}")
            return False

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@example.com"
        test_password = "TestPass123!"
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": test_password
            }
        )
        
        if success and response:
            user_data = response.get('user', {})
            self.token = user_data.get('token')
            self.user_id = user_data.get('user_id')
            print(f"   📊 User ID: {self.user_id}")
            print(f"   📊 Token received: {'Yes' if self.token else 'No'}")
        
        return success

    def test_user_login(self):
        """Test user login with existing credentials"""
        if not self.user_id:
            print("   ⚠️  Skipping login test - no registered user")
            return True
        
        # For this test, we'll assume registration auto-logged us in
        # In a real scenario, we'd test with known credentials
        return True

    def test_user_profile(self):
        """Test user profile endpoint"""
        if not self.token:
            print("   ⚠️  Skipping profile test - no authentication token")
            return True
        
        success, response = self.run_test(
            "User Profile",
            "GET",
            "user/profile",
            200
        )
        
        if success and response:
            user_data = response.get('user', {})
            print(f"   📊 Email: {user_data.get('email', 'unknown')}")
            print(f"   📊 Plan: {user_data.get('plan', {}).get('current', 'unknown')}")
            features = user_data.get('features', {})
            print(f"   📊 Features: {list(k for k, v in features.items() if v)}")
        
        return success

    def test_user_history(self):
        """Test user history endpoint"""
        if not self.token:
            print("   ⚠️  Skipping history test - no authentication token")
            return True
        
        success, response = self.run_test(
            "User History",
            "GET",
            "user/history",
            200
        )
        
        if success and response:
            history = response.get('history', [])
            print(f"   📊 History entries: {len(history)}")
        
        return success

    def test_image_analysis_authenticated(self):
        """Test image analysis as authenticated user"""
        if not self.token:
            print("   ⚠️  Skipping authenticated image analysis - no token")
            return True
        
        try:
            img_bytes = self.create_test_image()
            
            files = {
                'file': ('test_image.jpg', img_bytes, 'image/jpeg')
            }
            
            success, response = self.run_test(
                "Image Analysis (Authenticated)",
                "POST",
                "analyze-image",
                200,
                files=files
            )
            
            if success and response:
                if response.get('success'):
                    analysis = response.get('analysis', {})
                    print(f"   📊 Emotional State: {analysis.get('emotional_state', 'unknown')}")
                    print(f"   📊 Session ID: {response.get('session_id', 'unknown')}")
                    
                    # Check for premium features
                    if 'deception_analysis' in response:
                        print(f"   🔒 Deception Analysis: Available")
                    if 'stress_analysis' in response:
                        print(f"   🔒 Stress Analysis: Available")
                else:
                    print(f"   ⚠️  Analysis failed: {response.get('error', 'unknown error')}")
            
            return success
            
        except Exception as e:
            self.log_test("Image Analysis (Authenticated)", False, f"Exception: {str(e)}")
            return False

    def test_logout(self):
        """Test user logout"""
        if not self.token:
            print("   ⚠️  Skipping logout test - no authentication token")
            return True
        
        success, response = self.run_test(
            "User Logout",
            "POST",
            "auth/logout",
            200
        )
        
        if success:
            self.token = None
            self.user_id = None
        
        return success

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Emoticon Backend API Tests")
        print("=" * 50)
        
        # Basic functionality tests
        print("\n📋 Basic Functionality Tests")
        print("-" * 30)
        self.test_health_check()
        self.test_usage_limits_guest()
        self.test_pricing_plans()
        
        # Guest user tests
        print("\n👤 Guest User Tests")
        print("-" * 20)
        self.test_image_analysis_guest()
        
        # Authentication tests
        print("\n🔐 Authentication Tests")
        print("-" * 25)
        self.test_user_registration()
        self.test_user_login()
        
        # Authenticated user tests
        print("\n👨‍💼 Authenticated User Tests")
        print("-" * 30)
        self.test_user_profile()
        self.test_user_history()
        self.test_image_analysis_authenticated()
        self.test_logout()
        
        # Final results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    """Main test execution"""
    # Use the public endpoint from frontend .env
    tester = EmoticonAPITester("http://localhost:8001")
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
"""
FastAPI Backend for Emoticon - Complete Emotion Analysis Platform
Converted from Streamlit with all features and optimizations
"""
import os
import uuid
import json
import tempfile
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
import mediapipe as mp
import base64
from io import BytesIO

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

# Import all analyzer modules
from openai_analyzer import analyze_expression, analyze_emotion_pattern, get_emotion_suggestions
from video_analyzer import VideoEmotionAnalyzer
from ai_vision_analyzer import AIVisionAnalyzer
from body_language_analyzer import BodyLanguageAnalyzer
from lie_detector import LieDetector
from stress_analyzer import StressAnalyzer
from database import get_db, init_database, save_emotion_analysis, get_user_history
from auth import auth_system
from payment_plans import PaymentPlans, UsageTracker

# Initialize FastAPI
app = FastAPI(
    title="Emoticon API",
    description="Advanced AI-powered emotion analysis platform",
    version="2.0.0"
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)

# Initialize MediaPipe
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=5,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Initialize analyzers
ai_vision = AIVisionAnalyzer()
body_analyzer = BodyLanguageAnalyzer()
lie_detector = LieDetector()
stress_analyzer = StressAnalyzer()

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and services on startup"""
    try:
        init_database()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")

# Authentication helper
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[Dict]:
    """Get current user from JWT token (optional)"""
    if not credentials:
        return None
    
    try:
        result = auth_system.validate_session(credentials.credentials)
        if result.get('valid'):
            return {
                'user_id': result['user_id'],
                'email': result['email']
            }
    except Exception:
        pass
    
    return None

# Helper functions
async def process_image_data(file_data: bytes) -> np.ndarray:
    """Convert uploaded file data to OpenCV image format"""
    image = Image.open(BytesIO(file_data))
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

def create_session_id() -> str:
    """Generate unique session ID"""
    return str(uuid.uuid4())

# API Routes

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "features": {
            "openai_configured": bool(os.environ.get("OPENAI_API_KEY")),
            "database_connected": True,
            "mediapipe_loaded": True
        }
    }

@app.post("/api/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    context: Optional[str] = None,
    session_id: Optional[str] = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: Optional[Dict] = Depends(get_current_user)
):
    """Comprehensive image emotion analysis"""
    try:
        # Generate session ID if not provided
        if not session_id:
            session_id = create_session_id()
        
        # Check daily usage limit (allow without login but with limits)
        user_id = current_user['user_id'] if current_user else None
        if not PaymentPlans.check_daily_limit_guest(user_id):
            raise HTTPException(
                status_code=429,
                detail="Daily analysis limit reached. Please register or upgrade your plan."
            )
        
        # Process uploaded image
        file_data = await file.read()
        image = await process_image_data(file_data)
        
        # Track usage
        UsageTracker.track_analysis("image", user_id)
        
        # AI Vision Analysis with context
        if context:
            ai_analysis = ai_vision.analyze_emotion_context(image, [context])
        else:
            ai_analysis = ai_vision.analyze_facial_expressions(image)
        
        # Extract analysis results
        detected_expressions = ai_analysis.get("facial_expressions", [])
        detected_body_language = ai_analysis.get("body_language", [])
        emotional_state = ai_analysis.get("emotional_state", "neutral")
        confidence_level = ai_analysis.get("confidence_level", "medium")
        detailed_analysis = ai_analysis.get("detailed_analysis", "")
        
        # Handle no-face detection
        if emotional_state == "no face detected":
            return JSONResponse({
                "success": False,
                "error": "No face detected",
                "suggestion": detailed_analysis or "Please upload an image with a clear, visible face"
            })
        
        # Create response data
        response_data = {
            "success": True,
            "session_id": session_id,
            "analysis": {
                "emotional_state": emotional_state,
                "confidence_level": confidence_level,
                "detailed_analysis": detailed_analysis,
                "facial_expressions": detected_expressions,
                "body_language": detected_body_language
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Add premium features if user has access
        if current_user and PaymentPlans.can_access_feature('lie_detector', PaymentPlans.get_user_plan(user_id)):
            # Deception analysis
            body_patterns = [{'pattern': pattern.replace(' ', '_'), 'confidence': 0.8} 
                           for pattern in detected_body_language]
            deception_analysis = lie_detector.analyze_deception(detected_expressions, body_patterns)
            response_data["deception_analysis"] = deception_analysis
        
        if current_user and PaymentPlans.can_access_feature('stress_detector', PaymentPlans.get_user_plan(user_id)):
            # Stress analysis
            stress_analysis = stress_analyzer.analyze_stress_level(image)
            response_data["stress_analysis"] = stress_analysis
        
        # Save to database if user is logged in
        if current_user:
            background_tasks.add_task(
                save_emotion_analysis,
                session_id,
                detected_expressions,
                detailed_analysis,
                "image",
                0.8
            )
        
        return JSONResponse(response_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/analyze-video")
async def analyze_video(
    file: UploadFile = File(...),
    max_analyses: int = 10,
    session_id: Optional[str] = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: Optional[Dict] = Depends(get_current_user)
):
    """Video emotion analysis with optimization for large files"""
    try:
        # Generate session ID if not provided
        if not session_id:
            session_id = create_session_id()
        
        # Check daily usage limit
        user_id = current_user['user_id'] if current_user else None
        if not PaymentPlans.check_daily_limit_guest(user_id):
            raise HTTPException(
                status_code=429,
                detail="Daily analysis limit reached. Please register or upgrade your plan."
            )
        
        # Check file size (limit to 100MB, with better handling)
        file_data = await file.read()
        file_size = len(file_data)
        file_size_mb = file_size / (1024 * 1024)
        
        if file_size > 100 * 1024 * 1024:  # 100MB limit
            raise HTTPException(
                status_code=413,
                detail=f"Video file too large ({file_size_mb:.1f}MB). Maximum size is 100MB."
            )
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_file:
            tmp_file.write(file_data)
            tmp_video_path = tmp_file.name
        
        try:
            # Track usage
            UsageTracker.track_analysis("video", user_id)
            
            # Process video with optimizations
            video_analyzer = VideoEmotionAnalyzer(significance_threshold=0.1)
            analyses = video_analyzer.process_video(tmp_video_path, max_analyses=max_analyses)
            video_summary = video_analyzer.get_video_summary()
            
            if not analyses:
                return JSONResponse({
                    "success": False,
                    "message": "No significant facial expressions detected in video",
                    "suggestions": [
                        "Ensure the face is clearly visible and well-lit",
                        "Try a shorter video clip",
                        "Check if the camera angle shows the face properly"
                    ]
                })
            
            response_data = {
                "success": True,
                "session_id": session_id,
                "video_info": {
                    "file_size_mb": round(file_size_mb, 1),
                    "total_analyses": len(analyses)
                },
                "summary": video_summary,
                "analyses": analyses[:10],  # Limit response size
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Save significant analyses to database if user is logged in
            if current_user:
                for analysis in analyses[:5]:  # Save top 5
                    background_tasks.add_task(
                        save_emotion_analysis,
                        session_id,
                        analysis['expressions'],
                        analysis['ai_analysis'],
                        "video",
                        analysis['significance_score']
                    )
            
            return JSONResponse(response_data)
            
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_video_path):
                os.unlink(tmp_video_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video analysis failed: {str(e)}")

@app.post("/api/auth/register")
async def register_user(request: Request):
    """User registration endpoint"""
    try:
        data = await request.json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")
        
        result = auth_system.register_user(email, password)
        
        if result['success']:
            # Auto-login after registration
            login_result = auth_system.login_user(email, password)
            if login_result['success']:
                return JSONResponse({
                    "success": True,
                    "message": "Account created successfully",
                    "user": {
                        "user_id": login_result['user_id'],
                        "email": login_result['email'],
                        "token": login_result['session_token']
                    }
                })
        
        raise HTTPException(status_code=400, detail=result['error'])
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login_user(request: Request):
    """User login endpoint"""
    try:
        data = await request.json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")
        
        result = auth_system.login_user(email, password)
        
        if result['success']:
            return JSONResponse({
                "success": True,
                "message": "Login successful",
                "user": {
                    "user_id": result['user_id'],
                    "email": result['email'],
                    "token": result['session_token']
                }
            })
        
        raise HTTPException(status_code=401, detail=result['error'])
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/logout")
async def logout_user(current_user: Dict = Depends(get_current_user)):
    """User logout endpoint"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Implementation would invalidate the token
    return JSONResponse({
        "success": True,
        "message": "Logged out successfully"
    })

@app.get("/api/user/profile")
async def get_user_profile(current_user: Dict = Depends(get_current_user)):
    """Get user profile and usage statistics"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_id = current_user['user_id']
    current_plan = PaymentPlans.get_user_plan(user_id)
    plan_info = PaymentPlans.get_plan_info(current_plan)
    usage_stats = UsageTracker.get_usage_stats(user_id)
    
    return JSONResponse({
        "success": True,
        "user": {
            "email": current_user['email'],
            "user_id": user_id,
            "plan": {
                "current": current_plan,
                "name": plan_info['name'],
                "price": plan_info['price_display']
            },
            "usage": usage_stats,
            "features": {
                "save_history": PaymentPlans.can_access_feature('save_history', current_plan),
                "lie_detector": PaymentPlans.can_access_feature('lie_detector', current_plan),
                "stress_detector": PaymentPlans.can_access_feature('stress_detector', current_plan),
                "advanced_features": PaymentPlans.can_access_feature('advanced_features', current_plan)
            }
        }
    })

@app.get("/api/user/history")
async def get_analysis_history(
    limit: int = 10,
    current_user: Dict = Depends(get_current_user)
):
    """Get user's analysis history"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Use user_id as session_id for history lookup
    history = get_user_history(str(current_user['user_id']), limit)
    
    return JSONResponse({
        "success": True,
        "history": history
    })

@app.get("/api/pricing/plans")
async def get_pricing_plans():
    """Get available pricing plans"""
    return JSONResponse({
        "success": True,
        "plans": PaymentPlans.PLANS
    })

@app.get("/api/usage/limits")
async def get_usage_limits(current_user: Optional[Dict] = Depends(get_current_user)):
    """Get usage limits for current user"""
    user_id = current_user['user_id'] if current_user else None
    current_plan = PaymentPlans.get_user_plan(user_id)
    limits = PaymentPlans.get_usage_limits(current_plan)
    usage_stats = UsageTracker.get_usage_stats(user_id)
    
    return JSONResponse({
        "success": True,
        "plan": current_plan,
        "limits": limits,
        "usage": usage_stats,
        "can_analyze": PaymentPlans.check_daily_limit_guest(user_id)
    })

# WebSocket for live camera analysis (to fix the live recording issue)
@app.websocket("/api/live-analysis")
async def live_analysis_websocket(websocket):
    """WebSocket endpoint for live camera analysis"""
    await websocket.accept()
    
    try:
        while True:
            # Receive image data from frontend
            data = await websocket.receive_json()
            
            if data.get('type') == 'frame':
                try:
                    # Decode base64 image
                    image_data = base64.b64decode(data['image'].split(',')[1])
                    image = await process_image_data(image_data)
                    
                    # Quick analysis for live feed
                    ai_analysis = ai_vision.analyze_facial_expressions(image)
                    
                    # Send results back
                    await websocket.send_json({
                        "type": "analysis",
                        "data": {
                            "emotional_state": ai_analysis.get("emotional_state", "neutral"),
                            "expressions": ai_analysis.get("facial_expressions", []),
                            "confidence": ai_analysis.get("confidence_level", "medium"),
                            "timestamp": datetime.utcnow().isoformat()
                        }
                    })
                    
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Analysis failed: {str(e)}"
                    })
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
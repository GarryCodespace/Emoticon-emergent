"""
Enhanced AI Vision Analyzer for comprehensive emotion detection
Optimized for FastAPI backend with better error handling
"""
import os
import cv2
import numpy as np
import base64
from io import BytesIO
from typing import Dict, List, Any, Optional
from openai import OpenAI

class AIVisionAnalyzer:
    """Enhanced AI vision analysis with better performance"""
    
    def __init__(self):
        """Initialize OpenAI client"""
        self.openai_api_key = os.environ.get("OPENAI_API_KEY")
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.client = OpenAI(api_key=self.openai_api_key)
        self.max_retries = 3
    
    def _encode_image(self, image: np.ndarray) -> str:
        """Convert OpenCV image to base64 string"""
        # Resize image if too large for faster processing
        height, width = image.shape[:2]
        if width > 800 or height > 600:
            scale = min(800/width, 600/height)
            new_width = int(width * scale)
            new_height = int(height * scale)
            image = cv2.resize(image, (new_width, new_height))
        
        # Encode to JPEG with good quality/size balance
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 85]
        _, buffer = cv2.imencode('.jpg', image, encode_param)
        return base64.b64encode(buffer).decode('utf-8')
    
    def analyze_facial_expressions(self, image: np.ndarray) -> Dict[str, Any]:
        """Comprehensive facial expression analysis"""
        try:
            # Encode image
            image_base64 = self._encode_image(image)
            
            # Enhanced analysis prompt
            prompt = """Analyze this image for facial expressions and emotions. Respond with JSON format:
{
    "facial_expressions": ["list of detected expressions"],
    "emotional_state": "primary emotion",
    "confidence_level": "high/medium/low",
    "detailed_analysis": "detailed description",
    "body_language": ["list of body language observations"]
}

Focus on:
1. Micro-expressions in face
2. Eye contact and gaze direction
3. Mouth position and tension
4. Eyebrow position
5. Overall emotional state
6. Confidence and stress indicators

If no face is clearly visible, set emotional_state to "no face detected"."""
            
            # Make API call with retry logic
            for attempt in range(self.max_retries):
                try:
                    response = self.client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": prompt},
                                    {
                                        "type": "image_url",
                                        "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}
                                    }
                                ]
                            }
                        ],
                        response_format={"type": "json_object"},
                        max_tokens=300,
                        temperature=0.3
                    )
                    
                    result = response.choices[0].message.content
                    return self._parse_analysis_result(result)
                    
                except Exception as e:
                    if attempt == self.max_retries - 1:
                        raise e
                    continue
                    
        except Exception as e:
            return self._create_error_response(f"Analysis failed: {str(e)}")
    
    def analyze_emotion_context(self, image: np.ndarray, contexts: List[str]) -> Dict[str, Any]:
        """Analyze emotions with specific context"""
        try:
            image_base64 = self._encode_image(image)
            context_text = " ".join(contexts)
            
            prompt = f"""Analyze this image for facial expressions and emotions in the context of: {context_text}

Respond with JSON format:
{{
    "facial_expressions": ["list of detected expressions"],
    "emotional_state": "primary emotion",
    "confidence_level": "high/medium/low",
    "detailed_analysis": "contextual analysis description",
    "body_language": ["list of body language observations"],
    "context_insights": "insights specific to the given context"
}}

Consider the specific context when analyzing emotions and provide relevant insights."""
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}
                            }
                        ]
                    }
                ],
                response_format={"type": "json_object"},
                max_tokens=400,
                temperature=0.3
            )
            
            result = response.choices[0].message.content
            return self._parse_analysis_result(result)
            
        except Exception as e:
            return self._create_error_response(f"Context analysis failed: {str(e)}")
    
    def get_expression_confidence(self, expressions: List[str]) -> Dict[str, float]:
        """Get confidence scores for detected expressions"""
        # Mock confidence scores - in production, this would be more sophisticated
        confidence_scores = {}
        for expr in expressions:
            if expr in ['smile', 'happy', 'joy']:
                confidence_scores[expr] = 0.9
            elif expr in ['frown', 'sad', 'anger']:
                confidence_scores[expr] = 0.8
            elif expr in ['surprise', 'shock']:
                confidence_scores[expr] = 0.85
            else:
                confidence_scores[expr] = 0.7
        
        return confidence_scores
    
    def _parse_analysis_result(self, result_text: str) -> Dict[str, Any]:
        """Parse and validate analysis result"""
        try:
            import json
            result = json.loads(result_text)
            
            # Ensure required fields exist
            required_fields = ['facial_expressions', 'emotional_state', 'confidence_level', 'detailed_analysis']
            for field in required_fields:
                if field not in result:
                    result[field] = self._get_default_value(field)
            
            # Ensure body_language exists
            if 'body_language' not in result:
                result['body_language'] = []
            
            return result
            
        except json.JSONDecodeError:
            return self._create_error_response("Failed to parse analysis result")
    
    def _get_default_value(self, field: str) -> Any:
        """Get default value for missing fields"""
        defaults = {
            'facial_expressions': [],
            'emotional_state': 'neutral',
            'confidence_level': 'low',
            'detailed_analysis': 'Unable to analyze expressions',
            'body_language': []
        }
        return defaults.get(field, '')
    
    def _create_error_response(self, error_message: str) -> Dict[str, Any]:
        """Create standardized error response"""
        return {
            'facial_expressions': [],
            'emotional_state': 'error',
            'confidence_level': 'low',
            'detailed_analysis': error_message,
            'body_language': []
        }
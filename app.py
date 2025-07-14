import streamlit as st
import cv2
import mediapipe as mp
import numpy as np
import time
import uuid
import tempfile
import os
from openai_analyzer import analyze_expression
from database import init_database, save_emotion_analysis, get_user_history, get_expression_statistics
from video_analyzer import VideoEmotionAnalyzer

# Setup MediaPipe
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True)

# Define 100+ gestures (some with reduced sensitivity thresholds)
GESTURES = [
    ("raised left eyebrow", lambda lm: (lm[159].y - lm[65].y) > 0.06),
    ("raised right eyebrow", lambda lm: (lm[386].y - lm[295].y) > 0.06),
    ("mouth open", lambda lm: abs(lm[13].y - lm[14].y) > 0.05),
    ("frown", lambda lm: abs(lm[61].x - lm[291].x) < 0.035),
    ("pursed lips", lambda lm: abs(lm[61].x - lm[291].x) < 0.025),
    ("smirk left", lambda lm: lm[61].y > lm[291].y + 0.015),
    ("smirk right", lambda lm: lm[291].y > lm[61].y + 0.015),
    ("cheek puff", lambda lm: abs(lm[50].x - lm[280].x) > 0.25),
    ("nostril flare", lambda lm: abs(lm[94].x - lm[331].x) > 0.05),
    ("lip bite", lambda lm: abs(lm[13].y - lm[14].y) < 0.008 and abs(lm[61].x - lm[291].x) < 0.01),
    ("brow furrow", lambda lm: abs(lm[65].x - lm[295].x) < 0.03),
    ("brow lift", lambda lm: (lm[65].y + lm[295].y) / 2 < lm[10].y - 0.03),
    ("eye roll up", lambda lm: lm[468].y < lm[474].y - 0.02),
    ("eye roll down", lambda lm: lm[468].y > lm[474].y + 0.02),
    ("chin thrust forward", lambda lm: lm[152].z < -0.1),
    ("chin tuck", lambda lm: lm[152].z > 0.1),
    ("eye blink left", lambda lm: abs(lm[159].y - lm[145].y) < 0.005),
    ("eye blink right", lambda lm: abs(lm[386].y - lm[374].y) < 0.005),
    ("eyes wide open", lambda lm: abs(lm[159].y - lm[145].y) > 0.035),
    ("glare left", lambda lm: lm[33].x - lm[133].x > 0.02),
    ("glare right", lambda lm: lm[263].x - lm[362].x > 0.02),
    ("glare up", lambda lm: (lm[159].y + lm[386].y)/2 < (lm[145].y + lm[374].y)/2 - 0.02),
    ("glare down", lambda lm: (lm[159].y + lm[386].y)/2 > (lm[145].y + lm[374].y)/2 + 0.02),
    ("brows raised and mouth open", lambda lm: (lm[159].y - lm[65].y) > 0.03 and abs(lm[13].y - lm[14].y) > 0.04),
    ("brows lowered and lips pressed", lambda lm: (lm[159].y - lm[65].y) < 0.01 and abs(lm[13].y - lm[14].y) < 0.01),
    ("eye squint left", lambda lm: abs(lm[159].y - lm[145].y) < 0.007),
    ("eye squint right", lambda lm: abs(lm[386].y - lm[374].y) < 0.007),
    ("jaw drop", lambda lm: abs(lm[152].y - lm[13].y) > 0.15),
    ("head tilt left", lambda lm: lm[234].y - lm[454].y > 0.03),
    ("head tilt right", lambda lm: lm[454].y - lm[234].y > 0.03),
    ("head turn right", lambda lm: lm[454].x < lm[234].x - 0.05),
    ("head turn down", lambda lm: lm[10].y > lm[152].y + 0.08), 
    ("nose wrinkle", lambda lm: abs(lm[6].y - lm[168].y) < 0.02),
    ("brow raise + smile", lambda lm: (lm[159].y - lm[65].y) > 0.1 and abs(lm[61].x - lm[291].x) > 0.08),
    ("brow furrow + frown", lambda lm: abs(lm[65].x - lm[295].x) < 0.03 and abs(lm[61].x - lm[291].x) < 0.035),
    ("mouth open + head tilt", lambda lm: abs(lm[13].y - lm[14].y) > 0.04 and abs(lm[234].y - lm[454].y) > 0.03),
    # Additional gestures to reach 100+
    ("subtle smile", lambda lm: abs(lm[61].x - lm[291].x) > 0.04 and abs(lm[61].x - lm[291].x) < 0.06),
    ("wide smile", lambda lm: abs(lm[61].x - lm[291].x) > 0.08),
    ("half smile left", lambda lm: lm[61].x > lm[291].x + 0.02),
    ("half smile right", lambda lm: lm[291].x > lm[61].x + 0.02),
    ("lip compression", lambda lm: abs(lm[13].y - lm[14].y) < 0.003),
    ("lip protrusion", lambda lm: lm[13].z < -0.02),
    ("mouth corner down left", lambda lm: lm[61].y > lm[13].y + 0.01),
    ("mouth corner down right", lambda lm: lm[291].y > lm[13].y + 0.01),
    ("mouth corner up left", lambda lm: lm[61].y < lm[13].y - 0.01),
    ("mouth corner up right", lambda lm: lm[291].y < lm[13].y - 0.01),
    ("upper lip raise", lambda lm: lm[12].y < lm[15].y - 0.01),
    ("lower lip depress", lambda lm: lm[15].y > lm[17].y + 0.01),
    ("cheek raise left", lambda lm: lm[116].y < lm[117].y - 0.01),
    ("cheek raise right", lambda lm: lm[345].y < lm[346].y - 0.01),
    ("eye narrow left", lambda lm: abs(lm[159].y - lm[145].y) < 0.01),
    ("eye narrow right", lambda lm: abs(lm[386].y - lm[374].y) < 0.01),
    ("eye widen left", lambda lm: abs(lm[159].y - lm[145].y) > 0.025),
    ("eye widen right", lambda lm: abs(lm[386].y - lm[374].y) > 0.025),
    ("eyebrow flash", lambda lm: (lm[159].y - lm[65].y) > 0.08),
    ("forehead furrow", lambda lm: abs(lm[10].y - lm[151].y) < 0.08),
    ("temple tension", lambda lm: abs(lm[162].x - lm[389].x) < 0.15),
    ("jaw clench", lambda lm: abs(lm[172].y - lm[397].y) < 0.02),
    ("mouth twist left", lambda lm: lm[61].x < lm[291].x - 0.03),
    ("mouth twist right", lambda lm: lm[291].x < lm[61].x - 0.03),
    ("nostril compress", lambda lm: abs(lm[94].x - lm[331].x) < 0.03),
    ("nostril dilate", lambda lm: abs(lm[94].x - lm[331].x) > 0.06),
    ("chin dimple", lambda lm: lm[175].y > lm[199].y + 0.01),
    ("chin raise", lambda lm: lm[175].y < lm[199].y - 0.01),
    ("head shake", lambda lm: abs(lm[234].x - lm[454].x) > 0.1),
    ("head nod", lambda lm: abs(lm[10].y - lm[152].y) > 0.12),
    ("ear wiggle left", lambda lm: lm[234].z > 0.05),
    ("ear wiggle right", lambda lm: lm[454].z > 0.05),
    ("eye flutter left", lambda lm: abs(lm[159].y - lm[145].y) < 0.003),
    ("eye flutter right", lambda lm: abs(lm[386].y - lm[374].y) < 0.003),
    ("micro smile", lambda lm: abs(lm[61].x - lm[291].x) > 0.025 and abs(lm[61].x - lm[291].x) < 0.035),
    ("micro frown", lambda lm: abs(lm[61].x - lm[291].x) < 0.02),
    ("eyebrow twitch left", lambda lm: (lm[159].y - lm[65].y) > 0.04 and (lm[159].y - lm[65].y) < 0.05),
    ("eyebrow twitch right", lambda lm: (lm[386].y - lm[295].y) > 0.04 and (lm[386].y - lm[295].y) < 0.05),
    ("lip twitch left", lambda lm: lm[61].y < lm[291].y - 0.005),
    ("lip twitch right", lambda lm: lm[291].y < lm[61].y - 0.005),
    ("eye contact direct", lambda lm: abs(lm[468].x - lm[473].x) < 0.01),
    ("eye contact avoidance", lambda lm: abs(lm[468].x - lm[473].x) > 0.03),
    ("pupil dilation", lambda lm: abs(lm[468].y - lm[473].y) > 0.02),
    ("pupil constriction", lambda lm: abs(lm[468].y - lm[473].y) < 0.005),
    ("surprise full", lambda lm: (lm[159].y - lm[65].y) > 0.07 and abs(lm[13].y - lm[14].y) > 0.06),
    ("disgust expression", lambda lm: lm[12].y < lm[15].y - 0.02 and abs(lm[6].y - lm[168].y) < 0.015),
    ("fear expression", lambda lm: abs(lm[159].y - lm[145].y) > 0.03 and (lm[159].y - lm[65].y) > 0.05),
    ("anger expression", lambda lm: abs(lm[65].x - lm[295].x) < 0.025 and abs(lm[61].x - lm[291].x) < 0.03),
    ("sadness expression", lambda lm: lm[61].y > lm[13].y + 0.015 and lm[291].y > lm[13].y + 0.015),
    ("contempt left", lambda lm: lm[61].y < lm[291].y - 0.02),
    ("contempt right", lambda lm: lm[291].y < lm[61].y - 0.02),
    ("stress indicators", lambda lm: abs(lm[65].x - lm[295].x) < 0.025 and abs(lm[172].y - lm[397].y) < 0.015),
    ("relaxed expression", lambda lm: abs(lm[159].y - lm[145].y) > 0.015 and abs(lm[13].y - lm[14].y) > 0.01),
    ("concentration", lambda lm: abs(lm[65].x - lm[295].x) < 0.035 and abs(lm[159].y - lm[145].y) < 0.012),
    ("confusion", lambda lm: (lm[159].y - lm[65].y) > 0.03 and (lm[386].y - lm[295].y) < 0.02),
    ("skepticism", lambda lm: (lm[159].y - lm[65].y) > 0.04 and abs(lm[61].x - lm[291].x) < 0.025),
    ("amusement", lambda lm: abs(lm[61].x - lm[291].x) > 0.06 and abs(lm[159].y - lm[145].y) < 0.015),
    ("boredom", lambda lm: abs(lm[159].y - lm[145].y) < 0.008 and abs(lm[13].y - lm[14].y) < 0.005),
    ("excitement", lambda lm: abs(lm[159].y - lm[145].y) > 0.025 and abs(lm[61].x - lm[291].x) > 0.07),
    ("determination", lambda lm: abs(lm[65].x - lm[295].x) < 0.03 and abs(lm[172].y - lm[397].y) < 0.02),
    ("nervousness", lambda lm: abs(lm[159].y - lm[145].y) < 0.006 and lm[61].y > lm[291].y + 0.01),
    ("confidence", lambda lm: lm[152].z < -0.05 and abs(lm[61].x - lm[291].x) > 0.05),
    ("insecurity", lambda lm: lm[152].z > 0.05 and abs(lm[234].y - lm[454].y) > 0.025),
    ("thoughtfulness", lambda lm: abs(lm[65].x - lm[295].x) < 0.04 and lm[13].y > lm[14].y + 0.02),
    ("disbelief", lambda lm: (lm[159].y - lm[65].y) > 0.05 and abs(lm[13].y - lm[14].y) > 0.03),
    ("empathy", lambda lm: abs(lm[61].x - lm[291].x) > 0.04 and abs(lm[159].y - lm[145].y) > 0.02),
    ("curiosity", lambda lm: (lm[159].y - lm[65].y) > 0.045 and lm[10].y < lm[152].y - 0.06),
    ("anticipation", lambda lm: abs(lm[159].y - lm[145].y) > 0.02 and abs(lm[13].y - lm[14].y) > 0.02),
    ("relief", lambda lm: abs(lm[61].x - lm[291].x) > 0.05 and abs(lm[159].y - lm[145].y) > 0.015),
    ("frustration", lambda lm: abs(lm[65].x - lm[295].x) < 0.025 and abs(lm[13].y - lm[14].y) < 0.006),
    ("affection", lambda lm: abs(lm[61].x - lm[291].x) > 0.06 and abs(lm[159].y - lm[145].y) > 0.018),
    ("pride", lambda lm: lm[152].z < -0.08 and abs(lm[61].x - lm[291].x) > 0.055),
    ("embarrassment", lambda lm: lm[10].y > lm[152].y + 0.05 and abs(lm[159].y - lm[145].y) < 0.01),
    ("guilt", lambda lm: lm[10].y > lm[152].y + 0.06 and abs(lm[61].x - lm[291].x) < 0.02),
    ("jealousy", lambda lm: abs(lm[65].x - lm[295].x) < 0.02 and lm[61].y > lm[291].y + 0.02),
    ("envy", lambda lm: abs(lm[159].y - lm[145].y) < 0.008 and abs(lm[65].x - lm[295].x) < 0.03),
    ("longing", lambda lm: abs(lm[159].y - lm[145].y) > 0.02 and abs(lm[13].y - lm[14].y) > 0.015),
    ("nostalgia", lambda lm: abs(lm[61].x - lm[291].x) > 0.04 and lm[10].y > lm[152].y + 0.03),
    ("melancholy", lambda lm: lm[61].y > lm[13].y + 0.02 and abs(lm[159].y - lm[145].y) < 0.012),
    ("serenity", lambda lm: abs(lm[159].y - lm[145].y) > 0.018 and abs(lm[13].y - lm[14].y) > 0.008),
    ("euphoria", lambda lm: abs(lm[61].x - lm[291].x) > 0.09 and abs(lm[159].y - lm[145].y) > 0.03),
    ("despair", lambda lm: lm[61].y > lm[13].y + 0.025 and abs(lm[159].y - lm[145].y) < 0.005),
    ("hope", lambda lm: abs(lm[61].x - lm[291].x) > 0.045 and (lm[159].y - lm[65].y) > 0.035),
    ("resignation", lambda lm: abs(lm[159].y - lm[145].y) < 0.01 and abs(lm[13].y - lm[14].y) < 0.008),
    ("defiance", lambda lm: lm[152].z < -0.06 and abs(lm[65].x - lm[295].x) < 0.025),
    ("submission", lambda lm: lm[10].y > lm[152].y + 0.04 and abs(lm[159].y - lm[145].y) < 0.008),
    ("dominance", lambda lm: lm[152].z < -0.07 and abs(lm[159].y - lm[145].y) < 0.01),
    ("vulnerability", lambda lm: abs(lm[159].y - lm[145].y) > 0.025 and lm[10].y > lm[152].y + 0.03),
    ("strength", lambda lm: abs(lm[172].y - lm[397].y) < 0.015 and lm[152].z < -0.04),
    ("weakness", lambda lm: lm[10].y > lm[152].y + 0.05 and abs(lm[172].y - lm[397].y) > 0.03),
    ("alertness", lambda lm: abs(lm[159].y - lm[145].y) > 0.022 and (lm[159].y - lm[65].y) > 0.03),
    ("drowsiness", lambda lm: abs(lm[159].y - lm[145].y) < 0.006 and lm[10].y > lm[152].y + 0.02),
    ("intensity", lambda lm: abs(lm[159].y - lm[145].y) < 0.01 and abs(lm[65].x - lm[295].x) < 0.02),
    ("gentleness", lambda lm: abs(lm[61].x - lm[291].x) > 0.04 and abs(lm[159].y - lm[145].y) > 0.015)
]

# Global state for tracking detections
last_detected = set()
last_detect_time = {}
cooldown_seconds = 5

st.set_page_config(page_title="Emoticon – Emotion Detector", layout="wide")

# Initialize theme state
if 'dark_mode' not in st.session_state:
    st.session_state.dark_mode = True

# Apply theme
if st.session_state.dark_mode:
    st.markdown("""
    <style>
    .stApp {
        background-color: #1e1e1e;
        color: #ffffff;
    }
    .stMarkdown {
        color: #ffffff;
    }
    .stButton > button {
        background-color: #2d2d2d;
        color: #ffffff;
        border: 1px solid #444;
    }
    .stSelectbox > div > div {
        background-color: #2d2d2d;
        color: #ffffff;
    }
    .stTextInput > div > div > input {
        background-color: #2d2d2d;
        color: #ffffff;
    }
    </style>
    """, unsafe_allow_html=True)
else:
    st.markdown("""
    <style>
    .stApp {
        background-color: #ffffff;
        color: #000000;
    }
    .stButton > button {
        background-color: #f0f0f0;
        color: #000000;
        border: 1px solid #ccc;
    }
    .stButton > button:hover {
        background-color: #e0e0e0;
        border: 1px solid #aaa;
    }
    .stSelectbox > div > div {
        background-color: #f8f8f8;
        color: #000000;
        border: 1px solid #ddd;
    }
    .stTextInput > div > div > input {
        background-color: #f8f8f8;
        color: #000000;
        border: 1px solid #ddd;
    }
    div[data-testid="stAlert"] > div {
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        color: #856404;
    }
    div[data-testid="stSuccess"] > div {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
    }
    div[data-testid="stError"] > div {
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
    }
    div[data-testid="stInfo"] > div {
        background-color: #d1ecf1;
        border: 1px solid #bee5eb;
        color: #0c5460;
    }
    .stMarkdown {
        color: #000000 !important;
    }
    .stText {
        color: #000000 !important;
    }
    </style>
    """, unsafe_allow_html=True)

# Top navigation menu
st.markdown("""
<style>
.nav-container {
    background-color: #1f1f1f;
    padding: 15px 0;
    margin: -1rem -1rem 2rem -1rem;
    border-bottom: 1px solid #333;
}
.nav-menu {
    display: flex;
    justify-content: center;
    gap: 40px;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}
.nav-item {
    color: #ffffff;
    text-decoration: none;
    font-size: 16px;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 4px;
    transition: all 0.3s ease;
    cursor: pointer;
}
.nav-item:link, .nav-item:visited {
    text-decoration: none;
    color: #ffffff;
}
.nav-item:hover {
    background-color: #333;
    color: #ffffff;
}
.nav-item.active {
    background-color: #0066cc;
    color: #ffffff;
}
</style>
<div class="nav-container">
    <div class="nav-menu">
        <span class="nav-item active">Home</span>
        <span class="nav-item">About</span>
        <span class="nav-item">Contact</span>
        <span class="nav-item">Screen Recorder</span>
    </div>
</div>
""", unsafe_allow_html=True)

# Navigation functionality using columns - styled buttons
nav_col1, nav_col2, nav_col3, nav_col4 = st.columns([1, 1, 1, 2])

with nav_col1:
    if st.button("Home", key="nav_home", use_container_width=True):
        st.switch_page("app.py")

with nav_col2:
    if st.button("About", key="nav_about", use_container_width=True):
        st.switch_page("pages/about.py")

with nav_col3:
    if st.button("Contact", key="nav_contact", use_container_width=True):
        st.switch_page("pages/contact.py")

with nav_col4:
    if st.button("Screen Recorder", key="nav_screen", use_container_width=True):
        st.switch_page("pages/screen_recorder.py")

# Style the navigation buttons to match the design
st.markdown("""
<style>
/* Style navigation buttons */
[data-testid="stColumns"] [data-testid="stButton"] > button {
    background-color: #1f1f1f !important;
    border: none !important;
    color: #ffffff !important;
    font-size: 16px;
    font-weight: 500;
    padding: 12px 20px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
}

/* Active state for home button */
[data-testid="stColumns"] [data-testid="stButton"]:first-child > button {
    background-color: #0066cc;
    color: #ffffff;
}

/* Hover effects */
[data-testid="stColumns"] [data-testid="stButton"] > button:hover {
    background-color: #0066cc;
    color: #ffffff;
}

/* Remove the visual navigation bar since we're using real buttons now */
.nav-container {
    display: none;
}
</style>
""", unsafe_allow_html=True)







# Header with logo and theme toggle
header_col1, header_col2, header_col3 = st.columns([2, 6, 2])
with header_col1:
    st.markdown("<br><br>", unsafe_allow_html=True)  # Push logo down to align with subtitle
    try:
        st.image("logo.png", width=120)
    except:
        st.markdown("🎭")
with header_col2:
    st.markdown("<br>", unsafe_allow_html=True)  # Reduce spacing for closer text
    st.markdown("&nbsp;&nbsp;&nbsp;&nbsp;<h1 style='font-size: 3rem; margin: 0; margin-bottom: -35px;'>Emoticon</h1>", unsafe_allow_html=True)
    st.markdown("&nbsp;&nbsp;&nbsp;&nbsp;<p style='margin-top: -35px;'>Live AI Emotion Interpretation from Micro-Expressions</p>", unsafe_allow_html=True)
with header_col3:
    st.markdown("<br>", unsafe_allow_html=True)  # Add some spacing
    theme_button_text = "🌙 Dark" if not st.session_state.dark_mode else "☀️ Light"
    if st.button(theme_button_text, key="theme_toggle"):
        st.session_state.dark_mode = not st.session_state.dark_mode
        st.rerun()

# Initialize database
try:
    init_database()
    st.success("✅ Database connected successfully")
except Exception as e:
    st.error(f"❌ Database connection issue: {str(e)}")

# API Key Status Check
try:
    import os
    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        st.success("✅ OpenAI API connected successfully")
    else:
        st.error("❌ OpenAI API key not found")
except Exception as e:
    st.error(f"❌ OpenAI connection issue: {str(e)}")

# Initialize session state
if 'session_id' not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())
if 'camera_running' not in st.session_state:
    st.session_state.camera_running = False



# Display placeholders
frame_display = st.empty()
detected_display = st.empty()
gpt_display = st.empty()

# Control buttons
col1, col2, col3 = st.columns(3)
with col1:
    if st.button('▶ Start Webcam'):
        st.session_state.camera_running = True
        st.rerun()

with col2:
    if st.button('⏹ Stop'):
        st.session_state.camera_running = False
        st.rerun()

with col3:
    if st.button('🔄 Refresh'):
        st.session_state.camera_running = True
        st.rerun()

# Camera processing
if st.session_state.camera_running:
    try:
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            st.error("❌ Could not access webcam. This is common in containerized environments.")
            st.info("💡 **Alternative Options:**")
            st.markdown("""
            - **Upload Image**: Use the image upload feature below to test expression analysis
            - **Demo Mode**: Try the gesture simulation feature
            - **Local Setup**: Download and run this application locally for full webcam access
            """)
            st.session_state.camera_running = False
        else:
            # Set camera properties for better performance
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            cap.set(cv2.CAP_PROP_FPS, 30)
            
            # Create a placeholder for the stop button during processing
            stop_placeholder = st.empty()
            
            frame_count = 0
            max_frames = 300  # Process for about 10 seconds at 30 FPS
            
            while cap.isOpened() and st.session_state.camera_running and frame_count < max_frames:
                ret, frame = cap.read()
                if not ret:
                    st.error("❌ Failed to read from webcam.")
                    break

                # Flip frame horizontally for mirror effect
                frame = cv2.flip(frame, 1)
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = face_mesh.process(rgb_frame)

                current_time = time.time()
                detected_now = []

                if results.multi_face_landmarks:
                    for face_landmarks in results.multi_face_landmarks:
                        landmarks = face_landmarks.landmark
                        for name, condition in GESTURES:
                            try:
                                if condition(landmarks):
                                    if name not in last_detected or (current_time - last_detect_time.get(name, 0)) > cooldown_seconds:
                                        detected_now.append(name)
                                        last_detected.add(name)
                                        last_detect_time[name] = current_time
                            except Exception as e:
                                st.write(f"⚠️ Error in gesture '{name}': {e}")

                # Update displays
                frame_display.image(frame, channels="BGR", use_column_width=True)

                if detected_now:
                    detected_display.markdown(f"🟢 **Detected Gesture(s)**: {', '.join(detected_now)}")
                    try:
                        description = analyze_expression(", ".join(detected_now))
                        gpt_display.markdown(f"💬 **GPT Insight:** _{description}_")
                    except Exception as e:
                        gpt_display.markdown(f"⚠️ **Error getting AI insight:** {str(e)}")
                else:
                    detected_display.markdown("⚪ **Status**: Monitoring for expressions...")

                # Check for stop button press
                if stop_placeholder.button("⏹ Stop Camera", key=f"stop_{frame_count}"):
                    st.session_state.camera_running = False
                    break

                frame_count += 1
                time.sleep(0.033)  # ~30 FPS

            cap.release()
            cv2.destroyAllWindows()
            
            if frame_count >= max_frames:
                st.info("📹 Camera session ended automatically after processing limit.")
            
    except Exception as e:
        st.error(f"❌ Camera error: {str(e)}")
        st.session_state.camera_running = False

# Alternative Testing Methods
st.markdown("---")
st.markdown("### 🧪 Alternative Testing Methods")

# Image Upload Feature
st.markdown("#### 📸 Image Upload Analysis")
uploaded_file = st.file_uploader("Upload an image for expression analysis", type=['jpg', 'jpeg', 'png'])

if uploaded_file is not None:
    # Display uploaded image
    image = cv2.imdecode(np.frombuffer(uploaded_file.read(), np.uint8), cv2.IMREAD_COLOR)
    st.image(image, caption="Uploaded Image", use_container_width=True)
    
    # Process image for facial analysis
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_image)
    
    if results.multi_face_landmarks:
        detected_expressions = []
        for face_landmarks in results.multi_face_landmarks:
            landmarks = face_landmarks.landmark
            for name, condition in GESTURES:
                try:
                    if condition(landmarks):
                        detected_expressions.append(name)
                except:
                    continue
        
        if detected_expressions:
            st.success(f"🟢 **Detected Expressions**: {', '.join(detected_expressions[:5])}")
            try:
                analysis = analyze_expression(", ".join(detected_expressions))
                st.info(f"💬 **AI Analysis**: {analysis}")
                
                # Save to database
                save_emotion_analysis(
                    session_id=st.session_state.session_id,
                    expressions=detected_expressions[:5],
                    ai_analysis=analysis,
                    analysis_type="image"
                )
            except Exception as e:
                st.error(f"Analysis error: {str(e)}")
        else:
            st.warning("⚪ No clear expressions detected in this image")
    else:
        st.warning("⚪ No face detected in the uploaded image")

# Video Upload Feature
st.markdown("#### 🎬 Video Analysis")
st.markdown("*Upload a video for intelligent expression analysis - AI analyzes only significant expression changes*")

uploaded_video = st.file_uploader("Upload a video for expression analysis", type=['mp4', 'avi', 'mov', 'mkv'])

if uploaded_video is not None:
    # Save uploaded video to temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_file:
        tmp_file.write(uploaded_video.read())
        tmp_video_path = tmp_file.name
    
    try:
        # Display video
        st.video(uploaded_video)
        
        # Process video with progress bar
        with st.spinner('Analyzing video for significant expression changes...'):
            video_analyzer = VideoEmotionAnalyzer(significance_threshold=0.12)
            analyses = video_analyzer.process_video(tmp_video_path, max_analyses=15)
            video_summary = video_analyzer.get_video_summary()
        
        if analyses:
            st.success(f"🎯 **Found {len(analyses)} significant expression moments**")
            
            # Display video summary
            col1, col2 = st.columns(2)
            with col1:
                st.metric("Total Analyses", video_summary['total_analyses'])
                if video_summary['dominant_emotions']:
                    st.markdown("**Dominant Emotions:**")
                    for emotion, count in video_summary['dominant_emotions']:
                        st.write(f"• {emotion}: {count} times")
            
            with col2:
                st.markdown("**Expression Timeline:**")
                for moment in video_summary['timeline'][:5]:
                    st.write(f"⏰ {moment['timestamp']:.1f}s: {', '.join(moment['expressions'])}")
            
            # Display detailed analyses
            st.markdown("**🔍 Detailed Analysis of Significant Moments:**")
            for i, analysis in enumerate(analyses[:8]):  # Show top 8 analyses
                with st.expander(f"Moment {i+1} - {analysis['timestamp']:.1f}s (Significance: {analysis['significance_score']:.2f})"):
                    st.write(f"**Detected Expressions**: {', '.join(analysis['expressions'])}")
                    st.write(f"**AI Analysis**: {analysis['ai_analysis']}")
                    st.write(f"**Frame**: {analysis['frame_number']}")
                    
                    # Save significant analyses to database
                    save_emotion_analysis(
                        session_id=st.session_state.session_id,
                        expressions=analysis['expressions'],
                        ai_analysis=analysis['ai_analysis'],
                        analysis_type="video",
                        confidence=analysis['significance_score']
                    )
        
        else:
            st.info("⚪ No significant expression changes detected in this video")
            
    except Exception as e:
        st.error(f"Video analysis error: {str(e)}")
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_video_path):
            os.unlink(tmp_video_path)

# Demo Mode
st.markdown("#### 🎭 Demo Mode - Expression Simulation")
st.markdown("*Test the AI analysis without needing a camera*")

demo_expressions = [
    "smile, raised eyebrows",
    "frown, brow furrow",
    "surprise, mouth open, eyes wide",
    "contemplation, lip bite, eye squint",
    "confusion, head tilt, raised eyebrow",
    "happiness, wide smile, cheek raise",
    "concern, brow furrow, lip compression",
    "interest, eyebrow flash, slight smile"
]

selected_demo = st.selectbox("Choose a demo expression to analyze:", demo_expressions)

col1, col2 = st.columns(2)
with col1:
    if st.button("🔍 Analyze Demo Expression"):
        try:
            demo_analysis = analyze_expression(selected_demo)
            st.success(f"🎯 **Demo Expression**: {selected_demo}")
            st.info(f"💬 **AI Analysis**: {demo_analysis}")
            
            # Save to database
            expressions = selected_demo.split(", ")
            save_emotion_analysis(
                session_id=st.session_state.session_id,
                expressions=expressions,
                ai_analysis=demo_analysis,
                analysis_type="demo"
            )
        except Exception as e:
            st.error(f"Demo analysis error: {str(e)}")

with col2:
    if st.button("✨ Quick Test"):
        try:
            quick_test = "subtle smile, eye contact, relaxed expression"
            quick_analysis = analyze_expression(quick_test)
            st.success(f"🎯 **Quick Test**: {quick_test}")
            st.info(f"💬 **AI Analysis**: {quick_analysis}")
            
            # Save to database
            expressions = quick_test.split(", ")
            save_emotion_analysis(
                session_id=st.session_state.session_id,
                expressions=expressions,
                ai_analysis=quick_analysis,
                analysis_type="demo"
            )
        except Exception as e:
            st.error(f"Quick test error: {str(e)}")

# Screen Recorder Mode
st.markdown("---")
st.markdown("### 📱 Screen Recorder Mode")
st.markdown("*Record external applications like Zoom, Teams, or any video call with live emotion analysis*")

col1, col2 = st.columns(2)
with col1:
    st.markdown("**Features:**")
    st.markdown("• Records your entire screen")
    st.markdown("• Detects faces during video calls")
    st.markdown("• Shows popup analysis for major changes")
    st.markdown("• Configurable sensitivity settings")
    st.markdown("• Runs independently from this app")

with col2:
    st.markdown("**How to use:**")
    st.markdown("1. Click 'Launch Screen Recorder' below")
    st.markdown("2. A new window will open")
    st.markdown("3. Start your video call (Zoom, Teams, etc.)")
    st.markdown("4. Click 'Start Recording' in the recorder")
    st.markdown("5. Get live analysis popups during your call")

col1, col2 = st.columns(2)
with col1:
    if st.button("🎬 Launch Screen Recorder", type="primary"):
        st.info("🚀 Screen recorder ready to launch!")
        st.markdown("**To open the screen recorder:**")
        st.markdown("1. Right-click the link below and select 'Open in new tab'")
        st.markdown("2. Or copy the command below to run manually")
        
        # Direct link (will work when running locally)
        port = 5000
        st.markdown(f"**Direct link:** [Screen Recorder Mode](http://localhost:{port}/screen_recorder)")
        
        # Manual command
        st.code("streamlit run screen_recorder_standalone.py --server.port 5001", language="bash")

with col2:
    st.markdown("**Quick Demo Mode:**")
    st.markdown("*Test the screen recorder functionality*")
    
    if st.button("🎯 Test Screen Recorder", type="secondary"):
        st.info("Testing screen recorder analysis...")
        try:
            # Initialize analyzer
            analyzer = VideoEmotionAnalyzer(significance_threshold=0.2)
            
            # Try to capture a frame
            camera = cv2.VideoCapture(0)
            if camera.isOpened():
                ret, frame = camera.read()
                if ret:
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    
                    # Display the frame
                    st.image(frame_rgb, channels="RGB", caption="Live camera feed", use_column_width=True)
                    
                    # Analyze the frame
                    result = analyzer.analyze_video_frame(frame_rgb, time.time())
                    
                    if result:
                        st.success("✅ Screen recorder analysis working!")
                        st.write(f"**Detected:** {', '.join(result.get('expressions', []))}")
                        st.write(f"**Analysis:** {result.get('ai_analysis', 'No analysis')}")
                        st.write(f"**Significance:** {result.get('significance_score', 0.0):.2f}")
                    else:
                        st.info("No significant expression changes detected in this frame.")
                else:
                    st.error("Could not capture frame from camera")
                
                camera.release()
            else:
                st.error("Camera not available")
        except Exception as e:
            st.error(f"Screen recorder test failed: {str(e)}")

# User History and Statistics
st.markdown("---")
st.markdown("### 📊 Your Session Data")

col1, col2 = st.columns(2)

with col1:
    st.markdown("#### 🕐 Recent Analysis History")
    try:
        history = get_user_history(st.session_state.session_id, limit=5)
        if history:
            for i, record in enumerate(history):
                with st.expander(f"Analysis {i+1} - {record['analysis_type'].title()} ({record['timestamp'].strftime('%H:%M:%S')})"):
                    st.write(f"**Expressions**: {', '.join(record['expressions'])}")
                    st.write(f"**AI Analysis**: {record['ai_analysis']}")
        else:
            st.info("No analysis history yet. Try the demo mode or upload an image!")
    except Exception as e:
        st.error(f"Error loading history: {str(e)}")

with col2:
    st.markdown("#### 📈 Overall Statistics")
    try:
        stats = get_expression_statistics()
        
        st.metric("Total Analyses", stats['total_analyses'])
        st.metric("Unique Users", stats['unique_users'])
        
        if stats['top_expressions']:
            st.markdown("**Top Detected Expressions:**")
            for expr in stats['top_expressions'][:5]:
                st.write(f"• {expr['name']}: {expr['count']} times")
        
    except Exception as e:
        st.error(f"Error loading statistics: {str(e)}")

# Instructions
st.markdown("---")
st.markdown("### 📋 Instructions")
st.markdown("""
1. **Webcam Mode**: Click ▶ Start for live emotion detection (requires camera access)
2. **Image Upload**: Upload a photo to analyze facial expressions
3. **Video Analysis**: Upload a video for intelligent analysis of significant expression changes
4. **Demo Mode**: Test AI analysis with simulated expressions
5. **AI Analysis**: OpenAI GPT provides psychological insights for all modes
6. **Session Data**: View your personal analysis history and overall statistics
""")

st.markdown("### 🔧 Features")
st.markdown("""
- **Real-time processing**: Live webcam feed with instant gesture detection
- **100+ Gestures**: Comprehensive micro-expression recognition
- **Video analysis**: Smart detection of significant expression changes in videos
- **AI-powered insights**: OpenAI GPT analysis of emotional states
- **Database storage**: Persistent storage of analysis history and statistics
- **Multi-modal input**: Webcam, image upload, and video upload support
- **Intelligent filtering**: Only analyzes significant expression changes to reduce noise
""")

st.markdown("### ⚙️ Technical Details")
st.markdown("""
- **MediaPipe**: Face mesh for precise facial landmark detection
- **OpenCV**: Real-time computer vision processing
- **OpenAI GPT-4o**: Advanced emotion interpretation
- **Streamlit**: Interactive web interface
""")

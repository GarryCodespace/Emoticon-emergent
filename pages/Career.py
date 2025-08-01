import streamlit as st

def main():
    st.set_page_config(
        page_title="Career - Emoticon",
        page_icon="💼",
        layout="wide"
    )
    

    
    # Styling for navigation buttons
    st.markdown("""
    <style>
    [data-testid="stColumns"] [data-testid="stButton"] > button {
        background-color: #1f1f1f !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        color: #ffffff !important;
        font-size: 16px;
        font-weight: 500;
        padding: 12px 20px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
    }

    [data-testid="stColumns"] [data-testid="stButton"] > button:focus {
        outline: none !important;
        box-shadow: none !important;
        border: none !important;
    }

    [data-testid="stColumns"] [data-testid="stButton"]:nth-child(4) > button {
        background-color: #0066cc;
        color: #ffffff;
    }

    [data-testid="stColumns"] [data-testid="stButton"] > button:hover {
        background-color: #0066cc;
        color: #ffffff;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Navigation functionality using columns - styled buttons
    nav_col1, nav_col2, nav_col3, nav_col4 = st.columns([1, 1, 1, 1])

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
        if st.button("Career", key="nav_career", use_container_width=True):
            st.switch_page("pages/career.py")
    
    # Header
    st.title("💼 Career Opportunities")
    st.markdown("*Join our mission to revolutionize emotional intelligence through AI*")
    
    # Company overview
    st.markdown("---")
    st.markdown("## 🚀 About Emoticon")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("""
        **Emoticon** is at the forefront of AI-powered emotional intelligence technology. We're building the next generation of emotion detection and analysis systems that help people understand themselves and others better.
        
        Our cutting-edge platform combines computer vision, machine learning, and psychological insights to provide real-time emotional analysis, body language interpretation, and deception detection capabilities.
        
        **Our Mission**: To democratize emotional intelligence and help create more empathetic, understanding interactions in both personal and professional contexts.
        """)
    
    with col2:
        st.info("""
        **Company Stats**
        - Founded: 2024
        - Team Size: Growing rapidly
        - Technology: OpenAI GPT-4o, MediaPipe, Python
        - Focus: AI, Computer Vision, Psychology
        """)
    
    # Why join us
    st.markdown("---")
    st.markdown("## 🌟 Why Join Emoticon?")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
        ### 🧠 Cutting-Edge Technology
        - Work with latest AI models (GPT-4o)
        - Computer vision and real-time processing
        - State-of-the-art emotion detection algorithms
        - Innovative lie detection systems
        """)
    
    with col2:
        st.markdown("""
        ### 🎯 Meaningful Impact
        - Help people understand emotions better
        - Improve human communication
        - Applications in therapy, education, security
        - Make technology more emotionally intelligent
        """)
    
    with col3:
        st.markdown("""
        ### 🚀 Growth Opportunities
        - Rapidly expanding team
        - Learn from industry experts
        - Work on diverse AI projects
        - Shape the future of emotional AI
        """)
    
    # Current openings
    st.markdown("---")
    st.markdown("## 🎯 Current Openings")
    
    # Job listings
    jobs = [
        {
            "title": "Senior AI Engineer",
            "department": "Engineering",
            "location": "Remote / San Francisco",
            "type": "Full-time",
            "description": "Lead development of our AI emotion detection algorithms using OpenAI GPT-4o and computer vision technologies.",
            "requirements": [
                "5+ years Python development experience",
                "Experience with OpenAI API and computer vision",
                "Knowledge of MediaPipe, OpenCV, or similar frameworks",
                "Strong background in machine learning",
                "Experience with real-time video processing"
            ]
        },
        {
            "title": "Computer Vision Specialist",
            "department": "Research",
            "location": "Remote / New York",
            "type": "Full-time",
            "description": "Develop and optimize facial landmark detection and body language analysis systems.",
            "requirements": [
                "PhD or Masters in Computer Vision/AI",
                "Experience with MediaPipe, OpenCV, TensorFlow",
                "Knowledge of facial recognition algorithms",
                "Published research in computer vision preferred",
                "Strong mathematical background"
            ]
        },
        {
            "title": "Psychology Researcher",
            "department": "Research",
            "location": "Remote / Boston",
            "type": "Full-time",
            "description": "Research micro-expressions, body language patterns, and deception indicators to improve our AI models.",
            "requirements": [
                "PhD in Psychology, Cognitive Science, or related field",
                "Expertise in facial expressions and body language",
                "Knowledge of deception detection research",
                "Experience with statistical analysis",
                "Published research in emotional psychology"
            ]
        },
        {
            "title": "Frontend Developer",
            "department": "Engineering",
            "location": "Remote",
            "type": "Full-time",
            "description": "Build intuitive user interfaces for our emotion detection platform using modern web technologies.",
            "requirements": [
                "3+ years frontend development experience",
                "Proficiency in React, JavaScript, CSS",
                "Experience with Streamlit or similar frameworks",
                "Knowledge of real-time data visualization",
                "Strong UX/UI design sense"
            ]
        },
        {
            "title": "Machine Learning Intern",
            "department": "Research",
            "location": "Remote",
            "type": "Internship",
            "description": "Support research and development of emotion detection algorithms and contribute to our AI models.",
            "requirements": [
                "Currently pursuing degree in CS, AI, or related field",
                "Strong Python programming skills",
                "Knowledge of machine learning frameworks",
                "Interest in computer vision and NLP",
                "Eager to learn and contribute"
            ]
        }
    ]
    
    # Display job listings
    for job in jobs:
        with st.expander(f"🔍 {job['title']} - {job['department']} ({job['type']})"):
            col1, col2 = st.columns([2, 1])
            
            with col1:
                st.markdown(f"**Description**: {job['description']}")
                st.markdown("**Requirements**:")
                for req in job['requirements']:
                    st.markdown(f"• {req}")
            
            with col2:
                st.markdown(f"**Location**: {job['location']}")
                st.markdown(f"**Type**: {job['type']}")
                st.markdown(f"**Department**: {job['department']}")
                
                if st.button(f"Apply Now", key=f"apply_{job['title']}"):
                    st.success("Application submitted! We'll be in touch soon.")
    

    
    # Application process
    st.markdown("---")
    st.markdown("## 📋 Application Process")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
        ### 1️⃣ Apply
        - Submit your resume and cover letter
        - Complete our technical assessment
        - Tell us about your passion for AI
        """)
    
    with col2:
        st.markdown("""
        ### 2️⃣ Interview
        - Technical interview with our team
        - Cultural fit assessment
        - Meet potential teammates
        """)
    
    with col3:
        st.markdown("""
        ### 3️⃣ Join
        - Receive offer and negotiate terms
        - Complete onboarding process
        - Start building the future of AI
        """)
    
    # Contact information
    st.markdown("---")
    st.markdown("## 📞 Get In Touch")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        **Recruiting Team**
        - Email: emoticon.contact@gmail.com
        - LinkedIn: /company/emoticon-ai
        """)
    
    with col2:
        st.markdown("""
        **Questions About Roles?**
        - Contact our recruiting team at emoticon.contact@gmail.com
        - Follow us on LinkedIn: /company/emoticon-ai
        - Visit our website for more information
        """)
    
    # Footer
    st.markdown("---")
    st.markdown("*Join us in building the future of emotional AI. Together, we can make technology more human.*")

if __name__ == "__main__":
    main()
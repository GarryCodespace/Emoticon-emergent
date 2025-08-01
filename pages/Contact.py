import streamlit as st

st.set_page_config(page_title="Contact - Emoticon", layout="wide")

# Initialize theme state based on time of day


# Apply light theme
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
.stTextArea > div > div > textarea {
    background-color: #f8f8f8;
    color: #000000;
    border: 1px solid #ddd;
}

/* Change yellow alert/warning boxes to blue */
div[data-testid="stAlert"] > div {
    background-color: #e3f2fd;
    border: 1px solid #90caf9;
    color: #1565c0;
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
        <span class="nav-item">Home</span>
        <span class="nav-item">About</span>
        <span class="nav-item active">Contact</span>
    </div>
</div>
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

# Style the navigation buttons to match the design
st.markdown("""
<style>
/* Style navigation buttons */
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

/* Remove focus outline */
[data-testid="stColumns"] [data-testid="stButton"] > button:focus {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

/* Active state for contact button */
[data-testid="stColumns"] [data-testid="stButton"]:nth-child(3) > button {
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
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("&nbsp;&nbsp;&nbsp;&nbsp;<h1 style='font-size: 3rem; margin: 0; margin-bottom: -35px;'>Contact Us</h1>", unsafe_allow_html=True)
    st.markdown("&nbsp;&nbsp;&nbsp;&nbsp;<p style='margin-top: -35px;'>Get in Touch with the Emoticon Team</p>", unsafe_allow_html=True)
with header_col3:
    st.markdown("<br>", unsafe_allow_html=True)


st.markdown("---")

# Contact form and information
col1, col2 = st.columns([3, 2])

with col1:
    st.markdown("## Send us a Message")
    
    # Contact form
    with st.form("contact_form", clear_on_submit=True):
        name = st.text_input("Name *", placeholder="Your full name")
        email = st.text_input("Email *", placeholder="your.email@example.com")
        subject = st.selectbox("Subject *", [
            "General Inquiry",
            "Technical Support",
            "Bug Report",
            "Feature Request",
            "Partnership Opportunity",
            "Press Inquiry",
            "Other"
        ])
        message = st.text_area("Message *", placeholder="Tell us how we can help you...", height=150)
        
        submitted = st.form_submit_button("Send Message")
        
        if submitted:
            if name and email and message:
                # Add timestamp
                from datetime import datetime
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                # Format email content
                email_content = f"""
New Contact Form Submission - Emoticon

Name: {name}
Email: {email}
Subject: {subject}
Message:
{message}

Submitted at: {timestamp}
"""
                
                # Create mailto link
                import urllib.parse
                mailto_subject = f"Emoticon Contact Form - {subject}"
                mailto_body = email_content
                
                mailto_link = f"mailto:emoticon.contact@gmail.com?subject={urllib.parse.quote(mailto_subject)}&body={urllib.parse.quote(mailto_body)}"
                
                st.success("Thank you for your message! Click the link below to send via your email client:")
                st.markdown(f"[📧 Send Email]({mailto_link})", unsafe_allow_html=True)
                
                # Also show the formatted message
                st.info("Message Preview:")
                st.text(email_content)
                
            else:
                st.error("Please fill in all required fields marked with *")

with col2:
    st.markdown("## Get in Touch")
    
    st.markdown("""
    ### Direct Contact
    
    📧 **Email**: emoticon.contact@gmail.com
    
    🕐 **Hours**: Monday - Friday, 9 AM - 6 PM PST
    
    ---
    
    ### FOLLOW US
    
    📸 **INSTAGRAM**: [@EMOTICON.AI](https://www.instagram.com/emoticon.ai)
    
    """)

st.markdown("---")

# FAQ Section
st.markdown("## Frequently Asked Questions")

with st.expander("How accurate is the emotion detection?"):
    st.markdown("""
    Our emotion detection system uses advanced computer vision with MediaPipe for facial landmark detection 
    and OpenAI's GPT-4o for psychological analysis. The accuracy depends on lighting conditions, camera quality, 
    and facial visibility, but typically achieves 85-90% accuracy for basic emotions.
    """)

with st.expander("Is my data secure and private?"):
    st.markdown("""
    Yes, we take privacy seriously. Video processing happens locally on your device, and only anonymized 
    analysis results are stored. We never store or transmit your actual video footage. All data is encrypted 
    and follows industry-standard security practices.
    """)

with st.expander("What devices and browsers are supported?"):
    st.markdown("""
    Emoticon works on most modern web browsers including Chrome, Firefox, Safari, and Edge. 
    You'll need a working webcam and microphone permissions. The app is optimized for desktop 
    and laptop computers with good lighting conditions.
    """)

with st.expander("Can I use this for commercial purposes?"):
    st.markdown("""
    Please contact us for commercial licensing options. We offer enterprise solutions for 
    businesses, researchers, and developers who want to integrate emotion analysis into 
    their products or services.
    """)

with st.expander("How do I report a bug or suggest a feature?"):
    st.markdown("""
    You can report bugs or suggest features by:
    1. Using the contact form above with "Bug Report" or "Feature Request" as the subject
    2. Emailing us directly at emoticon.contact@gmail.com
    """)

# Navigation
st.markdown("---")
nav_col1, nav_col2 = st.columns(2)
with nav_col1:
    if st.button("← Back to Main App"):
        st.switch_page("app.py")
with nav_col2:
    if st.button("About Emoticon →"):
        st.switch_page("pages/about.py")
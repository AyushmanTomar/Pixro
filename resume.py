import streamlit as st
import requests
import os
import base64
import json
import re
from pathlib import Path
import google.generativeai as genai
from github import Github
import pandas as pd
import time

# Page configuration
st.set_page_config(page_title="Resume Job Match Analyzer", layout="wide")

# App title and description
st.title("Resume & GitHub Job Match Analyzer")
st.markdown("""
This app analyzes your GitHub projects and resume against job descriptions to provide:
1. Skills to highlight for better selection chances
2. Projects to mention with ready-to-paste content
3. An updated objective statement for your resume
4. Tips for interview preparation
""")

# Function to fetch repositories from GitHub
def fetch_github_repos(username):
    try:
        # Public access without authentication
        g = Github()
        user = g.get_user(username)
        repos = user.get_repos()
        
        repo_data = []
        for repo in repos:
            if not repo.fork:  # Skip forks
                # Get languages used in the repo
                languages = repo.get_languages()
                language_list = list(languages.keys())
                
                # Get the README content if available
                readme_content = ""
                try:
                    readme = repo.get_readme()
                    readme_content = base64.b64decode(readme.content).decode('utf-8')
                except:
                    pass
                
                repo_info = {
                    "name": repo.name,
                    "description": repo.description,
                    "languages": language_list,
                    "url": repo.html_url,
                    "stars": repo.stargazers_count,
                    "forks": repo.forks_count,
                    "created_at": repo.created_at.strftime("%Y-%m-%d"),
                    "readme": readme_content[:5000] if readme_content else ""  # Limit readme size
                }
                repo_data.append(repo_info)
        
        return repo_data
    except Exception as e:
        st.error(f"Error fetching GitHub repositories: {str(e)}")
        return []

# Function to read resume content
def read_resume():
    try:
        with open("resume.txt", "r") as file:
            return file.read()
    except FileNotFoundError:
        st.error("Resume file (resume.txt) not found.")
        return ""

# Function to analyze with Gemini API
def analyze_with_gemini(github_data, resume_text, job_description, role, company):
    try:
        # Configure the Gemini API
        api_key = st.session_state.gemini_api_key
        genai.configure(api_key=api_key)
        
        # Create model
        model = genai.GenerativeModel('gemini-pro')
        
        # Prepare the prompt for Gemini
        prompt = f"""
        ## Task: Provide detailed job application optimization based on resume, GitHub projects, and job description
        
        ### Resume Content:
        ```
        {resume_text}
        ```
        
        ### GitHub Projects:
        {json.dumps(github_data, indent=2)}
        
        ### Job Details:
        - Position: {role}
        - Company: {company}
        - Job Description:
        ```
        {job_description}
        ```
        
        ### Instructions:
        Provide detailed analysis in the following sections:
        
        1. **Skills to Highlight**:
        - Identify exactly which skills from the resume and GitHub projects align with the job description
        - Include specific technical skills and soft skills
        - Explain why each skill is important for this role
        - Format as a prioritized list with explanations
        
        2. **Projects to Showcase**:
        - Identify the 3-5 most relevant projects from GitHub that align with the job requirements
        - For each project, provide ready-to-use professional descriptions (100-150 words each) that emphasize relevant technologies and achievements
        - Highlight specific aspects of each project that demonstrate skills required in the job description
        
        3. **Resume Objective**:
        - Write a professional, tailored objective statement (3-4 sentences) specifically for this role
        - Incorporate keywords from the job description
        - Highlight candidate's unique value proposition for this specific position
        
        4. **Interview Preparation Tips**:
        - Suggest 5-7 specific topics to review based on job requirements and candidate background
        - Provide 3-5 example questions the candidate might face related to their experience and the job
        - Offer tactical advice on how to position their experience for this specific company and role
        
        Be specific, actionable, and concise. Focus on highlighting the strongest matches between the candidate's experience and the job requirements.
        """
        
        # Call Gemini API
        response = model.generate_content(prompt)
        
        return response.text
    except Exception as e:
        st.error(f"Error analyzing with Gemini: {str(e)}")
        return f"An error occurred: {str(e)}"

# Function to display results in a structured way
def display_results(analysis_text):
    # Helper function to extract sections
    def extract_section(text, section_name):
        pattern = rf"(?<=\#\#\s*{section_name}|\*\*{section_name}\*\*:?)[^\#]+?"
        alternative_pattern = rf"(?<={section_name}:)[^\#\n]+?((?=\n\n)|$)"
        
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if not match:
            match = re.search(alternative_pattern, text, re.DOTALL | re.IGNORECASE)
        
        if match:
            return match.group(0).strip()
        return "Section not found"

    # Extract and display each section
    st.subheader("📊 Analysis Results")
    
    # 1. Skills to Highlight
    skills_section = extract_section(analysis_text, "Skills to Highlight")
    with st.expander("Skills to Highlight", expanded=True):
        st.markdown(skills_section)
    
    # 2. Projects to Showcase
    projects_section = extract_section(analysis_text, "Projects to Showcase")
    with st.expander("Projects to Showcase", expanded=True):
        st.markdown(projects_section)
    
    # 3. Resume Objective
    objective_section = extract_section(analysis_text, "Resume Objective")
    with st.expander("Resume Objective", expanded=True):
        st.markdown(objective_section)
        
        # Add a copy button for convenience
        if objective_section and objective_section != "Section not found":
            st.text_area("Copy-paste ready version", objective_section, height=100)
    
    # 4. Interview Preparation Tips
    interview_section = extract_section(analysis_text, "Interview Preparation Tips")
    with st.expander("Interview Preparation Tips", expanded=True):
        st.markdown(interview_section)

# Sidebar for configuration
with st.sidebar:
    st.header("Settings")
    
    # Gemini API Key
    if 'gemini_api_key' not in st.session_state:
        st.session_state.gemini_api_key = ""
    
    api_key = st.text_input("Gemini API Key", 
                            value=st.session_state.gemini_api_key,
                            type="password",
                            help="Get your API key from https://makersuite.google.com/")
    
    if api_key:
        st.session_state.gemini_api_key = api_key
    
    # GitHub Username
    github_username = st.text_input("GitHub Username", "AyushmanTomar", 
                                  help="Enter your GitHub username to fetch public repositories")
    
    st.divider()
    
    # Toggle to show raw resume
    if st.checkbox("Show Resume Content"):
        resume_content = read_resume()
        if resume_content:
            st.text_area("Resume Content", resume_content, height=300)
        else:
            st.warning("Resume content not available")
    
    # Toggle to show GitHub data
    if st.checkbox("Show GitHub Projects"):
        if github_username:
            with st.spinner("Fetching GitHub data..."):
                repos = fetch_github_repos(github_username)
            
            if repos:
                st.write(f"Found {len(repos)} repositories")
                for repo in repos:
                    st.markdown(f"**{repo['name']}** - {repo['description'] or 'No description'}")
                    st.markdown(f"Languages: {', '.join(repo['languages'])}")
                    st.markdown(f"URL: {repo['url']}")
                    st.markdown("---")
            else:
                st.warning("No repositories found or error occurred")

# Main form for job details
with st.form("job_details_form"):
    st.subheader("Job Details")
    
    col1, col2 = st.columns(2)
    with col1:
        job_role = st.text_input("Job Position/Title", 
                                help="E.g., 'Senior Python Developer', 'Machine Learning Engineer'")
    with col2:
        company_name = st.text_input("Company Name",
                                   help="The company you're applying to")
    
    job_description = st.text_area("Paste Job Description Here", 
                                 height=250,
                                 help="Copy and paste the complete job description from the job posting")
    
    submit_button = st.form_submit_button("Analyze Job Match")

# Process when form is submitted
if submit_button:
    if not st.session_state.gemini_api_key:
        st.error("Please enter your Gemini API Key in the sidebar")
    elif not github_username:
        st.error("Please enter your GitHub username")
    elif not job_description:
        st.error("Please enter a job description")
    else:
        # Read resume
        resume_text = read_resume()
        if not resume_text:
            st.error("Could not read resume content. Please check if resume.txt exists.")
            st.stop()
        
        # Show progress
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        # Step 1: Fetch GitHub data
        status_text.text("Fetching GitHub repositories...")
        progress_bar.progress(25)
        github_data = fetch_github_repos(github_username)
        
        # Step 2: Prepare data for analysis
        status_text.text("Preparing data for analysis...")
        progress_bar.progress(50)
        
        # Step 3: Call Gemini API for analysis
        status_text.text("Analyzing with Gemini API...")
        progress_bar.progress(75)
        analysis_result = analyze_with_gemini(
            github_data, 
            resume_text, 
            job_description, 
            job_role, 
            company_name
        )
        
        # Step 4: Display results
        status_text.text("Preparing results...")
        progress_bar.progress(100)
        time.sleep(0.5)  # Short pause to show completion
        status_text.empty()
        progress_bar.empty()
        
        # Display structured results
        display_results(analysis_result)
        
        # Show raw response in expandable section
        with st.expander("Show Raw Gemini Response", expanded=False):
            st.text_area("Raw Response", analysis_result, height=300)

# Footer
st.divider()
st.markdown("""
### How to Use This App:
1. Enter your Gemini API key in the sidebar
2. Verify your GitHub username is correct
3. Enter the job details and description
4. Click "Analyze Job Match" to get tailored recommendations

This tool helps you optimize your resume and prepare for interviews by matching your experience with job requirements.
""")
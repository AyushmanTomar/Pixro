# 🐲 AI-Powered Workflow Builder  flusso

Flusso is a dynamic, node-based application that empowers users to visually design, construct, and execute complex AI-driven workflows. Leveraging the power of Google's Gemini API, this tool provides an intuitive interface for integrating image and text processing capabilities into custom pipelines.

## ✨ Features

*   **🔐 User Authentication:** Secure login system with session persistence.
*   **🎨 Visual Workflow Editor:** Drag-and-drop interface using ReactFlow to build and manage workflows.
*   **🧱 Node-Based System:**
    *   🖼️ **Image Input Node:** Upload and incorporate images into your workflow.
    *   ✍️ **Text Input Node:** Add and process text data.
    *   🗣️ **Prompt Box Node:** Craft and refine prompts, utilizing Gemini for advanced text generation or modification based on inputs.
    *   🧠 **Generate Image Node:** Leverage Gemini's capabilities to generate images from textual prompts and/or input images.
*   **🚀 Workflow Execution:** Seamlessly execute defined workflows, with processing handled by a robust Python Flask backend.
*   **💅 Modern UI:** Responsive and interactive user interface with a convenient sidebar for node selection and a floating toolbar for quick access.
*   **📊 Real-time Feedback:** View results and generated images directly within the nodes after workflow execution.

## 🛠️ Tech Stack

*   **Frontend:** React, ReactFlow, JavaScript, CSS
*   **Backend:** Python, Flask, Flask-CORS
*   **AI Engine:** Google Gemini API (for text and image generation)
*   **Image Handling:** Pillow (PIL)

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

*   **Node.js and npm:** For the frontend. Download from [nodejs.org](https://nodejs.org/).
*   **Python 3.x and pip:** For the backend. Download from [python.org](https://python.org/).
*   **Google Gemini API Key:** You'll need an API key from Google AI Studio. Get yours at [makersuite.google.com](https://makersuite.google.com/).

### Backend Setup (Python Flask)

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Create and activate a virtual environment:**
    Open your terminal in the project root directory and run:
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```
    *(For macOS/Linux, use `source venv/bin/activate`)*

3.  **Install backend dependencies:**
    Ensure you have `requirements.txt` in your project root (this file should be generated as part of this request). Then run:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up your Gemini API Key:**
    Create a file named `.env` in the project root directory. You can do this from the command line (still in the project root):
    ```bash
    echo GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY > .env
    ```
    Replace `YOUR_ACTUAL_GEMINI_API_KEY` with your actual Google Gemini API key.

### Frontend Setup (React)

1.  **Navigate to the project root directory** (if you're not already there).

2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```
    *(If you use Yarn: `yarn install`)*

## 🔧 Running the Application

### 1. Start the Backend Server

*   Ensure your virtual environment is activated (`.\venv\Scripts\activate`).
*   Make sure your `.env` file with the `GEMINI_API_KEY` is in place.
*   Run the Flask application from the project root:
    ```bash
    python app.py
    ```
    The backend will start, typically on `http://localhost:5000`.

### 2. Start the Frontend Development Server

*   In a **new terminal window or tab**, navigate to the project root directory.
*   Run the React development server:
    ```bash
    npm run dev
    ```
    *(If you use Yarn: `yarn dev`)*
    This will usually open the application in your default web browser at `http://localhost:5173` or `http://localhost:3000`.

### 3. Access the Application

*   Open your web browser and navigate to the frontend URL (e.g., `http://localhost:5173`).
*   You should see the login page. Use the credentials `abc@testmail.com` and password `abc` to log in.

## 🖼️ Project Structure (Simplified)

```
.
├── app.py                 # Flask backend server
├── requirements.txt       # Backend Python dependencies
├── .env                   # Stores API keys (you create this)
├── package.json           # Frontend dependencies and scripts
├── WorkflowApp.jsx        # Main ReactFlow application component
├── App.jsx                # Root React component (handles login, context)
├── App.css                # Global and component-specific styles
├── components/
│   ├── LoginPage.jsx      # Login page component
│   └── nodes/             # Custom ReactFlow node components
│       ├── GenImageNode.jsx
│       ├── ImageInputNode.jsx
│       ├── PromptBoxNode.jsx
│       └── TextInputNode.jsx
├── src/
│   └── assets/            # Image assets used in the UI
│       ├── logo.png
│       └── ...
└── ... (other frontend setup files like index.html, main.jsx, etc.)
```

## 💡 Usage

1.  **Login:** Access the application via your browser and log in.
2.  **Add Nodes:** Use the sidebar (toggle with the menu icon) or the floating toolbar to add different types of nodes to the canvas (Image Input, Text Input, Prompt Box, Generate Image).
3.  **Configure Nodes:** Click on a node to select it. This will expand the node (if not already expanded) and show its detailed view, allowing you to input text, upload images, or write prompts.
4.  **Connect Nodes:** Drag from the handles (small circles) on one node to another to create connections, defining the flow of data.
5.  **Execute Workflow:** Once your workflow is designed, click the "Execute Workflow" button (in the sidebar or the floating play button).
6.  **View Results:** After execution, nodes will update to show their output, such as generated text or images.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue.

## 📜 License

This project is currently unlicensed. (Consider adding an MIT or other open-source license if applicable).

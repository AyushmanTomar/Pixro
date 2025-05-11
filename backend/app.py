from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import uuid
import base64
from io import BytesIO
from PIL import Image
import requests
from google import genai  # You'll need to install this with pip
from google.genai import types  # Import types for configuration
import dotenv

dotenv.load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure Gemini API (you'll need to set this environment variable)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
# print(GEMINI_API_KEY)
genai.Client(api_key=GEMINI_API_KEY)

# Storage for uploaded images and workflow results
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def execute_workflow(workflow_data):
    """Execute a workflow based on its JSON definition"""
    nodes = workflow_data.get('nodes', [])
    edges = workflow_data.get('edges', [])
    print(workflow_data)
    
    # Create a dictionary to store node outputs
    node_outputs = {}
    
    # Process nodes in topological order
    nodes_to_process = []
    for node in nodes:
        if node['type'] == 'imageInput' or node['type'] == 'textInput':
            nodes_to_process.append(node)
    
    processed_nodes = set()
    
    while nodes_to_process:
        node = nodes_to_process.pop(0)
        node_id = node['id']
        
        if node_id in processed_nodes:
            continue
        
        # Process node based on its type
        if node['type'] == 'imageInput':
            # Image input just passes through the image
            node_outputs[node_id] = {
                'image': node['data'].get('imageData'),
                'text': None
            }
            processed_nodes.add(node_id)
            
        elif node['type'] == 'textInput':
            # Text input just passes through the text
            node_outputs[node_id] = {
                'image': None,
                'text': node['data'].get('text', '')
            }
            processed_nodes.add(node_id)
            
        elif node['type'] == 'promptBox':
            # Find all incoming edges
            incoming_data = []
            for edge in edges:
                if edge['target'] == node_id:
                    source_id = edge['source']
                    if source_id in node_outputs:
                        incoming_data.append(node_outputs[source_id])
                    else:
                        # Skip this node for now, we'll come back to it
                        nodes_to_process.append(node)
                        continue
            
            # Get prompt from node data
            prompt = node['data'].get('prompt', '')
            
            # Gather images and text from inputs
            input_images = []
            input_text = ""
            
            for data in incoming_data:
                if data['image']:
                    input_images.append(data['image'])
                if data['text']:
                    input_text += data['text'] + "\n"
            
            # Combine with prompt
            full_prompt = f"{input_text}\n{prompt}" if input_text else prompt
            full_prompt = "Do not introduce or conclude your response(Strict). You are a image generation and prompt modification agent. below is the user query. analyze it and return response accordingly.\n\n"+full_prompt
            
            # Call Gemini API for text generation
            response = call_gemini_text(full_prompt, input_images)
            
            # Store result
            node_outputs[node_id] = {
                'image': input_images[0] if input_images else None,  # Pass through first image
                'text': response
            }
            processed_nodes.add(node_id)
            
        elif node['type'] == 'genImageBlock':
            # Find all incoming edges
            incoming_data = []
            for edge in edges:
                if edge['target'] == node_id:
                    source_id = edge['source']
                    if source_id in node_outputs:
                        incoming_data.append(node_outputs[source_id])
                    else:
                        # Skip this node for now, we'll come back to it
                        nodes_to_process.append(node)
                        continue
            
            # Get prompt from node data
            prompt = node['data'].get('prompt', '')
            
            # Gather images and text from inputs
            input_images = []
            input_text = ""
            # print(input_images)
            
            for data in incoming_data:
                if data['image']:
                    input_images.append(data['image'])
                if data['text']:
                    input_text += data['text'] + "\n"
            
            # Combine with prompt
            full_prompt = f"{input_text}\n{prompt}" if input_text else prompt
            print(full_prompt)
            # Call Gemini API for image generation
            generated_image = call_gemini_image(full_prompt, input_images)
            
            # Store result
            node_outputs[node_id] = {
                'image': generated_image,
                'text': input_text  # Pass through text
            }
            processed_nodes.add(node_id)
        
        # Add downstream nodes to the queue
        for edge in edges:
            if edge['source'] == node_id:
                target_id = edge['target']
                for node in nodes:
                    if node['id'] == target_id and target_id not in processed_nodes:
                        nodes_to_process.append(node)
    
    # Collect final outputs
    final_outputs = {}
    for node_id, output in node_outputs.items():
        # Check if this node is an endpoint (no outgoing edges)
        is_endpoint = True
        for edge in edges:
            if edge['source'] == node_id:
                is_endpoint = False
                break
        
        if is_endpoint:
            final_outputs[node_id] = output
    
    return {
        'all_outputs': node_outputs,
        'final_outputs': final_outputs
    }

def call_gemini_text(prompt, images=None):
    """Call Gemini API for text generation"""
    try:
        # Updated to use gemini-1.5-flash for text generation
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        contents = prompt
        # print(images)
        
        # Add images if available
        if images:
            multi_contents = [prompt]
            for img_data in images:
                if img_data.startswith('data:image'):
                    # Extract base64 data
                    img_format, img_str = img_data.split(';base64,')
                    image_bytes = base64.b64decode(img_str)
                    image = Image.open(BytesIO(image_bytes))
                    multi_contents.append(image)
            contents = multi_contents
        
        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-04-17",
            contents=contents
        )
        return response.text
    except Exception as e:
        print(f"Error calling Gemini Text API: {e}")
        import traceback
        traceback.print_exc()
        return f"Error: {str(e)}"

from PIL import Image
import PIL
import traceback
def call_gemini_image(prompt, images=None):
    """Call Gemini API for image generation and save output as PNG"""
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        contents = [prompt]

        # --- Input image processing (keep as before) ---
        if images:
            print(f"Processing {len(images)} input images for Gemini...")
            for i, img_data in enumerate(images):
                if img_data and img_data.startswith('data:image'):
                    try:
                        header, encoded = img_data.split(';base64,')
                        image_bytes = base64.b64decode(encoded)
                        image = Image.open(BytesIO(image_bytes)).convert("RGB")
                        # image = PIL.Image.open('6841d8c2-947a-4754-9e1f-fd01d75402c4.jpeg')
                        contents.append(image)
                        print(f"  Added input image {i+1} to contents.")
                    except Exception as decode_err:
                        print(f"  Error decoding/processing input image {i+1}: {decode_err}")
                elif img_data:
                     print(f"  Skipping input image {i+1}: Does not appear to be a valid data URI.")

        # --- API Call (keep as before) ---
        print(f"--- Calling Gemini Image Gen ---")
        # ... (model, prompt, contents logging) ...
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp-image-generation",
            contents=contents,
            config=types.GenerateContentConfig(
                response_modalities=['TEXT', 'IMAGE']
            )
        )
        if not response.candidates:
             print("ERROR: No candidates found!")
             return None
        candidate = response.candidates[0]
        if not candidate.content or not candidate.content.parts:
            print("ERROR: First candidate has no content or parts.")
            return None

        print(f"Processing {len(candidate.content.parts)} parts...")
        generated_image_uri = None
        text_response = ""

        for i, part in enumerate(candidate.content.parts):
            if hasattr(part, 'text') and part.text:
                 print(f"  Found text part: '{part.text[:100]}...'")
                 text_response += part.text + "\n"

            elif (hasattr(part, 'inline_data') and
                  part.inline_data and
                  hasattr(part.inline_data, 'data') and
                  isinstance(part.inline_data.data, bytes) and
                  part.inline_data.data):

                image_bytes = base64.b64decode(part.inline_data.data)
                mime_type = part.inline_data.mime_type or "image/png"
                print(f"  Found non-empty inline_data part (Part {i})!")
                print(f"    Mime Type from API: {mime_type}")
                print(f"    Received bytes length: {len(image_bytes)}")
                try:
                    encoded = base64.b64encode(image_bytes).decode('utf-8')
                    # Use the original mime_type provided by the API for the data URI
                    data_uri = f"data:{mime_type};base64,{encoded}"
                    print(f"    Successfully base64 encoded original bytes (mime: {mime_type}). Starts with: {data_uri[:70]}...")
                    generated_image_uri = data_uri
                    # Break after processing the first valid image part
                    break
                except Exception as encode_err:
                     print(f"    Error base64 encoding image bytes: {encode_err}")
                     # Continue loop to check other parts

            else:
                # Logging skipped parts (keep as before)
                 skip_reason = "Unknown structure"
                 # ... (logic to determine skip_reason) ...
                 print(f"  Skipping Part {i}: {skip_reason}.")

        # --- Return Logic ---
        if generated_image_uri:
            return generated_image_uri
        else:
            print("ERROR: No valid image data URI generated.")
            return None

    except Exception as e:
        print(f"!!! FATAL Error in call_gemini_image: {e}")
        traceback.print_exc()
        return None


@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    """Endpoint to upload an image"""
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No image selected'}), 400
    
    # Save the image
    filename = f"{uuid.uuid4()}{os.path.splitext(file.filename)[1]}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    # Convert to base64 for frontend
    with open(filepath, "rb") as img_file:
        img_data = base64.b64encode(img_file.read()).decode('utf-8')
    
    img_format = os.path.splitext(file.filename)[1].lstrip('.')
    img_data_uri = f"data:image/{img_format};base64,{img_data}"
    print(filename)
    return jsonify({
        'filename': filename,
        'imageData': img_data_uri
    })

@app.route('/api/execute-workflow', methods=['POST'])
def execute_workflow_api():
    """Endpoint to execute a workflow"""
    workflow_data = request.json
    if not workflow_data:
        return jsonify({'error': 'No workflow data provided'}), 400
    
    result = execute_workflow(workflow_data)
    return jsonify(result)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
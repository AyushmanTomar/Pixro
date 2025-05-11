import React, { useRef, useContext } from 'react';
import { Handle } from 'reactflow';
import { NodeSelectionContext } from '../../App'; // Path is now correct relative to WorkflowApp

const ImageInputNode = ({ data, isConnectable, id }) => {
  const { selectedNodeId } = useContext(NodeSelectionContext);
  const isSelected = id === selectedNodeId;
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file && data.updateNodeData) {
      const formData = new FormData();
      formData.append('image', file);

      try {
        // Assuming your Flask backend runs on port 5000
        const response = await fetch('http://localhost:5000/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Error uploading image: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.imageData && result.filename) {
          data.updateNodeData(id, {
            imageData: result.imageData, // base64 for preview
            imagePath: result.filename   // server path/filename
          });
        } else {
           console.error("Upload response missing imageData or filename:", result);
           alert('Failed to get complete image details from server.');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert(`Failed to upload image: ${error.message}`);
      }
    } else if (!data.updateNodeData) {
        console.error("updateNodeData function not found in node data", id, data);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className={`node node-image-input ${isSelected ? 'expanded' : ''}`}>
      <Handle
        type="source"
        position="bottom"
        id="output_image"
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />

      {!isSelected ? (
        // Compact View
        <div className="node-content compact">
            <div className="node-header">Image Input</div>
            {data.imageData && (
              <img
                src={data.imageData}
                alt="Uploaded Thumbnail"
                className="node-thumbnail-image"
               />
            )}
            {!data.imageData && <p className="compact-info">No image uploaded</p>}
             <div className="handle-label handle-label-bottom">Image Out</div>
        </div>
      ) : (
        // Expanded View
        <div className="node-content expanded">
            <div className="node-header">Image Input (Details)</div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept="image/*"
              className="nodrag" /* Make sure inputs inside nodes don't trigger drag */
            />
            <button onClick={triggerFileInput} className="nodrag">
              {data.imagePath ? 'Change Image' : 'Upload Image'}
            </button>

            <div className="expanded-section">
                <strong>Preview:</strong>
                {data.imageData ? (
                  <div className="image-preview-container expanded-image-container">
                    <img
                      src={data.imageData}
                      alt="Uploaded Preview"
                      className="image-preview expanded-image"
                    />
                  </div>
                ) : (
                    <p><em>No image uploaded yet.</em></p>
                )}
            </div>
             <div className="expanded-section">
                <strong>Filename/Path:</strong>
                <p style={{fontSize: '11px', wordBreak: 'break-all'}}>{data.imagePath || 'N/A'}</p>
             </div>
             <div className="expanded-section">
                <strong>Node ID:</strong> {id}
             </div>
             <div className="handle-label handle-label-bottom">Image Out</div>
        </div>
      )}
    </div>
  );
};

export default ImageInputNode;

import React, { useEffect, useContext } from 'react';
import { Handle } from 'reactflow';
import { NodeSelectionContext } from '../../App'; // Path is now correct relative to WorkflowApp

const GenImageNode = ({ data, isConnectable, id }) => {
  const { selectedNodeId } = useContext(NodeSelectionContext);
  const isSelected = id === selectedNodeId;

  const handlePromptChange = (event) => {
    const newPrompt = event.target.value;
    if (data.updateNodeData) {
      data.updateNodeData(id, { prompt: newPrompt });
    } else {
        console.error("updateNodeData function not found in node data", id, data);
    }
  };

  // Normalize image source
  const getImageSrc = (imgData) => {
    if (!imgData) return null;
    // Check if it already has the base64 prefix
    return imgData.startsWith('data:image')
      ? imgData
      : `data:image/png;base64,${imgData}`; // Assume PNG if prefix is missing
  };

  const resultImageSrc = getImageSrc(data.resultImage);

  return (
    <div className={`node node-gen-image ${isSelected ? 'expanded' : ''}`}>
      <Handle
        type="target"
        position="top"
        id="input"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position="bottom"
        id="output"
        isConnectable={isConnectable}
      />

      {!isSelected ? (
        // Compact View
        <div className="node-content compact">
          <h3>🧠 Generate Image</h3>
          <p className="compact-info">
            {data.prompt ? `Prompt: ${data.prompt.substring(0, 30)}...` : 'No prompt set'}
          </p>
          {resultImageSrc && (
            <img
              src={resultImageSrc}
              alt="Generated Thumbnail"
              className="node-thumbnail-image"
              onError={(e) => { e.target.style.display = 'none'; console.error('Compact image failed'); }} // Hide on error
            />
          )}
           {!resultImageSrc && <p className="compact-info">No image generated</p>}
        </div>
      ) : (
        // Expanded View
        <div className="node-content expanded">
          <h3>🧠 Generate Image (Details)</h3>
          <div className="expanded-section">
            <strong>Input Prompt:</strong>
            <textarea
              value={data.prompt || ''}
              onChange={handlePromptChange}
              placeholder="Enter prompt for image generation..."
              rows={4}
              className="nodrag"
            />
          </div>

          <div className="expanded-section">
            <strong>🖼️ Generated Image:</strong>
            {resultImageSrc ? (
              <img
                src={resultImageSrc}
                alt="Generated"
                className="node-result-image expanded-image"
                onError={(e) => {
                  e.target.style.display = 'none'; // Hide broken image
                  // Optionally show a placeholder or error message here
                  console.error('❌ Expanded Image failed to load:', e.target.src);
                }}
              />
            ) : (
              <p><em>No image generated yet or generation failed.</em></p>
            )}
          </div>
          <div className="expanded-section">
             <strong>Node ID:</strong> {id}
          </div>
        </div>
      )}
    </div>
  );
};

export default GenImageNode;

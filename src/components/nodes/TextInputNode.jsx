import React, { useContext } from 'react';
import { Handle } from 'reactflow';
import { NodeSelectionContext } from '../../App'; // Path is now correct relative to WorkflowApp

const TextInputNode = ({ data, isConnectable, id }) => {
  const { selectedNodeId } = useContext(NodeSelectionContext);
  const isSelected = id === selectedNodeId;

  const handleTextChange = (event) => {
    const newText = event.target.value;
     if (data.updateNodeData) {
        data.updateNodeData(id, { text: newText });
     } else {
         console.error("updateNodeData function not found in node data", id, data);
     }
  };

  return (
    <div className={`node node-text-input ${isSelected ? 'expanded' : ''}`}>
      <Handle
        type="source"
        position="bottom"
        id="output"
        isConnectable={isConnectable}
      />

      {!isSelected ? (
        // Compact View
         <div className="node-content compact">
           <h3>Text Input</h3>
           <p className="compact-info">
              {data.text ? `Text: ${data.text.substring(0, 30)}...` : 'No text set'}
           </p>
         </div>
      ) : (
        // Expanded View
        <div className="node-content expanded">
          <h3>Text Input (Details)</h3>
          <div className="expanded-section">
              <strong>Input Text:</strong>
              <textarea
                value={data.text || ''}
                onChange={handleTextChange}
                placeholder="Enter your text or prompt here..."
                rows={5} /* Increased rows for expanded view */
                className="nodrag"
              />
          </div>
           <div className="expanded-section">
              <strong>Node ID:</strong> {id}
           </div>
        </div>
      )}
    </div>
  );
};

export default TextInputNode;

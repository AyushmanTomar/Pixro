import React, { useContext } from 'react';
import { Handle } from 'reactflow';
import { NodeSelectionContext } from '../../App'; // Path is now correct relative to WorkflowApp

const PromptBoxNode = ({ data, isConnectable, id }) => {
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

  return (
    <div className={`node node-prompt-box ${isSelected ? 'expanded' : ''}`}>
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
            <h3>Prompt Box</h3>
             <p className="compact-info">
                {data.prompt ? `Prompt: ${data.prompt.substring(0, 30)}...` : 'No prompt set'}
             </p>
             {data.result && <p className="compact-info">Has result</p>}
          </div>
      ) : (
          // Expanded View
          <div className="node-content expanded">
            <h3>Prompt Box (Details)</h3>
            <div className="expanded-section">
                 <strong>Input Prompt:</strong>
                 <textarea
                  value={data.prompt || ''}
                  onChange={handlePromptChange}
                  placeholder="Enter your prompt here..."
                  rows={4}
                  className="nodrag"
                 />
            </div>

            <div className="expanded-section">
                <strong>Result:</strong>
                {data.result ? (
                     <p>{data.result}</p>
                 ) : (
                     <p><em>No result yet. Execute workflow.</em></p>
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

export default PromptBoxNode;

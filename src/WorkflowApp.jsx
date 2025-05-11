import React, { useState, useCallback, useContext, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css'; // Styles are now relative to this file's location
import { FiMenu, FiX, FiPlay, FiImage, FiType, FiMessageSquare, FiCpu } from 'react-icons/fi';

// Import custom nodes (adjust paths if needed)
import ImageInputNode from './components/nodes/ImageInputNode';
import TextInputNode from './components/nodes/TextInputNode';
import PromptBoxNode from './components/nodes/PromptBoxNode';
import GenImageNode from './components/nodes/GenImageNode';

// Import NodeSelectionContext (assuming it's defined in App.jsx or a separate context file)
import { NodeSelectionContext } from './App';

// Node types registration
const nodeTypes = {
  imageInput: ImageInputNode,
  textInput: TextInputNode,
  promptBox: PromptBoxNode,
  genImageBlock: GenImageNode,
};

// Initial nodes for empty canvas
const initialNodes = [];
const initialEdges = [];

// Helper for node labels
const getNodeLabel = (type) => {
  switch (type) {
    case 'imageInput': return 'Image Input';
    case 'textInput': return 'Text Input';
    case 'promptBox': return 'Prompt Box';
    case 'genImageBlock': return 'Generate Image';
    default: return 'Node';
  }
}

// Renamed the main component to WorkflowApp
const WorkflowApp = ( { onLogout } ) => { // Accept onLogout prop if needed
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isExecuting, setIsExecuting] = useState(false);
  const [workflowResults, setWorkflowResults] = useState(null);
  const { selectedNodeId, setSelectedNodeId } = useContext(NodeSelectionContext); // Use context
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedData = { ...node.data, ...newData, updateNodeData };
          return {
            ...node,
            data: updatedData,
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          updateNodeData: updateNodeData,
        },
      }))
    );
  }, [updateNodeData, setNodes]);

  const onAddNode = (nodeType) => {
    const newNode = {
      id: `${nodeType}_${Date.now()}`,
      type: nodeType,
      position: { x: Math.random() * 400 + 150, y: Math.random() * 200 + 100 },
      data: {
        label: getNodeLabel(nodeType),
        prompt: '',
        text: '',
        imageData: null,
        imagePath: '',
        result: '',
        resultImage: null,
        updateNodeData: updateNodeData,
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const executeWorkflow = async () => {
    try {
      setIsExecuting(true);
      setSelectedNodeId(null);

      const workflowData = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          data: {
            prompt: node.data.prompt || '',
            text: node.data.text || '',
            imagePath: node.data.imagePath || "",
            imageData: node.data.imageData || null,
          }
        })),
        edges: edges
      };

      const response = await fetch('http://localhost:5000/api/execute-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorBody}`);
      }

      const results = await response.json();
      setWorkflowResults(results);

      setNodes((nds) =>
        nds.map((node) => {
          const nodeOutput = results.all_outputs?.[node.id];
          const baseData = {
            ...node.data,
            updateNodeData
          };
          if (nodeOutput) {
            return {
              ...node,
              data: {
                ...baseData,
                result: nodeOutput.text !== undefined ? nodeOutput.text : baseData.result,
                resultImage: nodeOutput.image !== undefined ? nodeOutput.image : baseData.resultImage,
              },
            };
          }
          return { ...node, data: baseData };
        })
      );
    } catch (error) {
      console.error('Error executing workflow:', error);
      alert(`Error executing workflow: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const onNodesDelete = useCallback(
    (deletedNodes) => {
      if (deletedNodes.some(node => node.id === selectedNodeId)) {
        setSelectedNodeId(null);
      }
    },
    [selectedNodeId, setSelectedNodeId]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    // Context Provider is now in App.jsx
    <div className="app-container">
      <button onClick={toggleSidebar} className="sidebar-toggle-button">
        {isSidebarOpen ? <FiX /> : <FiMenu />}
      </button>

      <div className={`sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
         {/* Added simple placeholder logo/user info */} 
         <div className="logo_div">
             <img src="src\assets\logo_2.png" alt="Logo" width={"100px"} /> {/* Adjusted path */} 
             <img src="src\assets\logo_3.png" alt="Name Logo" className='logo_name' /> {/* Adjusted path */} 
         </div>

        <h2>Workflow Blocks</h2>
        <div className="node-buttons">
          <button onClick={() => onAddNode('imageInput')}><FiImage /> Image Input</button>
          <button onClick={() => onAddNode('textInput')}><FiType /> Text Input</button>
          <button onClick={() => onAddNode('promptBox')}><FiMessageSquare /> Prompt Box</button>
          <button onClick={() => onAddNode('genImageBlock')}><FiCpu /> Generate Image</button>
        </div>
        <div className="execute-section">
          <button
            onClick={executeWorkflow}
            disabled={isExecuting || nodes.length === 0}
            className="execute-button-sidebar"
          >
            {isExecuting ? 'Executing...' : 'Execute Workflow'}
          </button>
          {/* Add Logout button if needed */}
          <button onClick={onLogout} className="logout-button-sidebar">Logout</button>
        </div>
      </div>

      <div className={`workflow-container ${isSidebarOpen ? '' : 'expanded'}`}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          deleteKeyCode={['Delete', 'Backspace']}
          fitView
        >
          <Controls />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
          <Background variant="dots" gap={16} size={1} />
        </ReactFlow>
      </div>

      {!isSidebarOpen && (
        <button
          onClick={executeWorkflow}
          disabled={isExecuting || nodes.length === 0}
          className="floating-execute-button"
          title="Execute Workflow"
        >
          {isExecuting ? '...' : <FiPlay />}
        </button>
      )}

      {!isSidebarOpen && (
        <div className='topbar'>
          <img src="src\assets\logo.png" alt="User Avatar" /> {/* Adjusted path */} 
          <div className='Username'>Ayushman</div> {/* Consider making this dynamic */} 
        </div>
      )}

      {!isSidebarOpen && (
        <div className="floating-node-toolbar">
          <button onClick={() => onAddNode('imageInput')} title="Add Image Input">
            <FiImage />
          </button>
          <button onClick={() => onAddNode('textInput')} title="Add Text Input">
            <FiType />
          </button>
          <button onClick={() => onAddNode('promptBox')} title="Add Prompt Box">
            <FiMessageSquare />
          </button>
          <button onClick={() => onAddNode('genImageBlock')} title="Add Generate Image">
            <FiCpu />
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkflowApp;

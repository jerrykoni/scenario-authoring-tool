import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Node,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { nodeTypes } from './nodes';
import { initialEdges, initialNodes } from './scenario/sampleGraph';
import type { AuthoringNodeData } from './scenario/authoringTypes';
import { Toolbar } from './ui/Toolbar';
import { InspectorPanel } from './ui/InspectorPanel';

import './App.css';

let createdNodeCounter = 1;

function createNodeId(prefix: string) {
  const id = `${prefix}_${createdNodeCounter}`;
  createdNodeCounter += 1;
  return id;
}

type AuthoringDiagramFile = {
  fileType: 'scenario-authoring-diagram';
  version: string;
  savedAt: string;
  nodes: typeof initialNodes;
  edges: typeof initialEdges;
};

function downloadJson(filename: string, data: unknown) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/_+/g, '_');
}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const selectedNode =
    nodes.find((node) => node.selected) as Node<AuthoringNodeData> | undefined;

  function onConnect(connection: Connection) {
    setEdges((currentEdges) => addEdge(connection, currentEdges));
  }

  function updateNodeData(
    nodeId: string,
    updatedData: Partial<AuthoringNodeData>,
  ) {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id !== nodeId) {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            ...updatedData,
          },
        };
      }),
    );
  }

  function addNode(
    type: string,
    data: AuthoringNodeData,
    position = { x: 120, y: 120 },
  ) {
    const newNode: Node<AuthoringNodeData> = {
      id: createNodeId(data.kind),
      type,
      position,
      data,
    };

    setNodes((currentNodes) => [...currentNodes, newNode]);
  }

  function addActionNode() {
    addNode(
      'actionNode',
      {
        kind: 'action',
        title: 'New action',
        titleKey: '',
        promptKey: '',
        instructionKey: '',
        iconKeys: [],
        eventType: 'ActionPerformed',
        targetId: 'subject.target',
        interactionType: 'action_type',
        minimumDurationSeconds: 0,
        assessmentTags: ['required_action'],
      },
      { x: 420, y: 360 },
    );
  }

  function addYesNoDecisionNode() {
    addNode(
      'yesNoDecisionNode',
      {
        kind: 'yesNoDecision',
        title: 'New yes/no decision',
        titleKey: '',
        promptKey: '',
        instructionKey: '',
        iconKeys: [],
        choicesTitleKey: '',
        choices: [
          {
            choiceId: 'yes',
            labelKey: 'Yes',
            styleKey: 'positive',
            iconKey: '',
          },
          {
            choiceId: 'no',
            labelKey: 'No',
            styleKey: 'negative',
            iconKey: '',
          },
        ],
        assessmentTags: ['clinical_reasoning'],
      },
      { x: 720, y: 360 },
    );
  }

  function addDialogueDecisionNode() {
    addNode(
      'dialogueDecisionNode',
      {
        kind: 'dialogueDecision',
        title: 'New dialogue decision',
        titleKey: '',
        promptKey: '',
        instructionKey: '',
        iconKeys: [],
        choicesTitleKey: '',
        choices: [
          {
            choiceId: 'choice_one',
            labelKey: 'choice_one',
            styleKey: 'dialogue',
            iconKey: '',
          },
          {
            choiceId: 'choice_two',
            labelKey: 'choice_two',
            styleKey: 'dialogue',
            iconKey: '',
          },
        ],
        assessmentTags: ['dialogue_choice'],
      },
      { x: 960, y: 360 },
    );
  }

  function addNotificationNode() {
    addNode(
      'notificationNode',
      {
        kind: 'notification',
        title: 'New notification',
        titleKey: '',
        promptKey: '',
        instructionKey: '',
        iconKeys: [],
        assessmentTags: [],
      },
      { x: 1200, y: 360 },
    );
  }

  function addEndNode() {
    addNode(
      'endNode',
      {
        kind: 'end',
        title: 'New end node',
        titleKey: '',
        promptKey: '',
        instructionKey: '',
        iconKeys: [],
        assessmentTags: [],
      },
      { x: 1440, y: 360 },
    );
  }

  function saveDiagram() {
    const userFileName = window.prompt(
      'Enter diagram file name',
      'start_sop_demo',
    );

    if (!userFileName) {
      return;
    }

    const safeFileName = sanitizeFileName(userFileName);

    if (!safeFileName) {
      alert('Please enter a valid file name.');
      return;
    }

    const diagramFile: AuthoringDiagramFile = {
      fileType: 'scenario-authoring-diagram',
      version: '0.1.0',
      savedAt: new Date().toISOString(),
      nodes,
      edges,
    };

    const finalFileName = safeFileName.endsWith('.json')
      ? safeFileName
      : `${safeFileName}.authoring.json`;

    downloadJson(finalFileName, diagramFile);
  }

  function loadDiagramFromFile(file: File) {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = String(reader.result);
        const parsed = JSON.parse(text) as AuthoringDiagramFile;

        if (parsed.fileType !== 'scenario-authoring-diagram') {
          alert('This is not a valid scenario authoring diagram file.');
          return;
        }

        setNodes(parsed.nodes);
        setEdges(parsed.edges);
      } catch (error) {
        console.error(error);
        alert('Failed to load diagram file.');
      }
    };

    reader.readAsText(file);
  }

  function openLoadDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = () => {
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      loadDiagramFromFile(file);
    };

    input.click();
  }

  function clearDiagram() {
    setNodes([]);
    setEdges([]);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Scenario Authoring Tool</h1>
          <p>Phase 1.7 demo: updated scenario nodes and inspector</p>
        </div>

        <Toolbar
          onAddAction={addActionNode}
          onAddYesNoDecision={addYesNoDecisionNode}
          onAddDialogueDecision={addDialogueDecisionNode}
          onAddNotification={addNotificationNode}
          onAddEnd={addEndNode}
          onSaveDiagram={saveDiagram}
          onLoadDiagramClick={openLoadDialog}
          onClearDiagram={clearDiagram}
        />
      </header>

      <div className="editor-body">
        <main className="flow-wrapper">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            deleteKeyCode={['Backspace', 'Delete']}
            fitView
          >
            <Background />
            <MiniMap />
            <Controls />
          </ReactFlow>
        </main>

        <InspectorPanel
          selectedNode={selectedNode ?? null}
          onUpdateNodeData={updateNodeData}
        />
      </div>
    </div>
  );
}
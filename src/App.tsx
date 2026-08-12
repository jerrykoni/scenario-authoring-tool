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
import { 
  compileScenarioDefinition,
  type ScenarioMetadata,
} from './scenario/compileScenarioDefinition';
import { compilePracticeSlices } from './scenario/compilePracticeSlices';
import { compileLearningSlices } from './scenario/compileLearningSlices';
import { useMemo, useState } from 'react';
import {
  buildSlicePreviewGraph,
  type SlicePackage,
  type SlicePreviewNodeInfo,
} from './scenario/slicePreview';
import { SliceManagerPanel } from './ui/SliceManagerPanel';

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
  scenarioMeta?: ScenarioMetadata;
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

  // State for managing the scenario metadata
  const [scenarioMeta, setScenarioMeta] = useState<ScenarioMetadata>({
    scenarioId: 'transport_sop_demo_v1',
    title: 'Transport SOP Demo',
    version: '0.1.0',
    language: 'en',
    domain: 'transport_training',
    description: 'Transport SOP scenario generated from React Flow authoring graph.',
    startNodeId: initialNodes[0]?.id ?? '',
  });

  // State for managing the slice preview mode and the currently loaded slice package
  const [slicePackage, setSlicePackage] = useState<SlicePackage | null>(null);
  const [isSlicePreviewMode, setIsSlicePreviewMode] = useState(false);
  const [selectedSlicePreviewInfo, setSelectedSlicePreviewInfo] = useState<SlicePreviewNodeInfo | null>(null);
  
  const slicePreviewGraph = useMemo(() => {
    if (!slicePackage) {
      return {
        nodes: [],
        edges: [],
      };
    }
  
    return buildSlicePreviewGraph(slicePackage, nodes);
  }, [slicePackage, nodes]);
  
  const displayedNodes =
    isSlicePreviewMode && slicePackage ? (slicePreviewGraph.nodes as typeof nodes) : nodes;
  
  const displayedEdges =
    isSlicePreviewMode && slicePackage ? (slicePreviewGraph.edges as typeof edges) : edges;
  // End of slice preview state management

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
            stateEffects: {},
          },
          {
            choiceId: 'no',
            labelKey: 'No',
            styleKey: 'negative',
            iconKey: '',
            stateEffects: {},
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
            stateEffects: {},
          },
          {
            choiceId: 'choice_two',
            labelKey: 'choice_two',
            styleKey: 'dialogue',
            iconKey: '',
            stateEffects: {},
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
        contextPatch: {
          branchSelections: {},
        },
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
      scenarioMeta,
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

        // If the loaded file contains scenario metadata, use it; otherwise, set a default startNodeId
        if (parsed.scenarioMeta) {
          setScenarioMeta(parsed.scenarioMeta);
        } else {
          setScenarioMeta((currentMeta) => ({
            ...currentMeta,
            startNodeId: parsed.nodes[0]?.id ?? currentMeta.startNodeId,
          }));
        }
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

  function exportScenarioJson() {
    const validScenarioMeta = getValidScenarioMetaOrAlert();

    if (!validScenarioMeta) {
      return;
    }

    const scenario = compileScenarioDefinition(
      nodes,
      edges,
      validScenarioMeta,
    );

    downloadJson(`${scenario.scenarioId}.scenario.json`, scenario);
  }

  function exportPracticeSlicesJson() {
    const validScenarioMeta = getValidScenarioMetaOrAlert();

    if (!validScenarioMeta) {
      return;
    }

    const practiceSlices = compilePracticeSlices(
      nodes,
      edges,
      validScenarioMeta.scenarioId,
      validScenarioMeta.startNodeId,
    );

    downloadJson(
      `${validScenarioMeta.scenarioId}.practice_slices.json`,
      practiceSlices,
    );
  }

  function exportLearningSlicesJson() {
    const validScenarioMeta = getValidScenarioMetaOrAlert();

    if (!validScenarioMeta) {
      return;
    }

    const learningSlices = compileLearningSlices(
      nodes,
      edges,
      validScenarioMeta.scenarioId,
      validScenarioMeta.startNodeId,
    );

    downloadJson(
      `${validScenarioMeta.scenarioId}.learning_slices.json`,
      learningSlices,
    );
  }

  function loadSlicesFromFile(file: File) {
    const reader = new FileReader();
  
    reader.onload = () => {
      try {
        const text = String(reader.result);
        const parsed = JSON.parse(text) as SlicePackage;
  
        if (
          parsed.mode !== 'practice' &&
          parsed.mode !== 'learning'
        ) {
          alert('This is not a valid practice or learning slices file.');
          return;
        }
  
        if (!Array.isArray(parsed.slices)) {
          alert('Slices file does not contain a valid slices array.');
          return;
        }
  
        setSlicePackage(parsed);
        setIsSlicePreviewMode(true);
        setSelectedSlicePreviewInfo(null);
      } catch (error) {
        console.error(error);
        alert('Failed to load slices JSON file.');
      }
    };
  
    reader.readAsText(file);
  }
  
  function openLoadSlicesDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
  
    input.onchange = () => {
      const file = input.files?.[0];
  
      if (!file) {
        return;
      }
  
      loadSlicesFromFile(file);
    };
  
    input.click();
  }

  // Section: Functions for editing scenario metadata and validating it
  function promptValue(label: string, currentValue: string) {
    const value = window.prompt(label, currentValue);
  
    if (value === null) {
      return currentValue;
    }
  
    return value.trim();
  }
  
  function editScenarioSettings() {
    const nextScenarioId = promptValue(
      'Scenario ID',
      scenarioMeta.scenarioId,
    );
  
    const nextTitle = promptValue(
      'Scenario Title',
      scenarioMeta.title,
    );
  
    const nextVersion = promptValue(
      'Version',
      scenarioMeta.version,
    );
  
    const nextLanguage = promptValue(
      'Language',
      scenarioMeta.language,
    );
  
    const nextDomain = promptValue(
      'Domain',
      scenarioMeta.domain,
    );
  
    const nextDescription = promptValue(
      'Description',
      scenarioMeta.description,
    );
  
    const availableNodeIds = nodes.map((node) => node.id).join(', ');
  
    const nextStartNodeId = promptValue(
      `Start Node ID\nAvailable nodes:\n${availableNodeIds}`,
      scenarioMeta.startNodeId || nodes[0]?.id || '',
    );
  
    setScenarioMeta({
      scenarioId: nextScenarioId || scenarioMeta.scenarioId,
      title: nextTitle || scenarioMeta.title,
      version: nextVersion || scenarioMeta.version,
      language: nextLanguage || scenarioMeta.language,
      domain: nextDomain || scenarioMeta.domain,
      description: nextDescription || scenarioMeta.description,
      startNodeId: nextStartNodeId || scenarioMeta.startNodeId,
    });
  }

  function getValidScenarioMetaOrAlert() {
    const startNodeExists = nodes.some(
      (node) => node.id === scenarioMeta.startNodeId,
    );
  
    if (!startNodeExists) {
      alert(
        `Start node "${scenarioMeta.startNodeId}" does not exist.\n\n` +
          `Open Scenario Settings and choose a valid Start Node ID.`,
      );
  
      return null;
    }
  
    if (!scenarioMeta.scenarioId.trim()) {
      alert('Scenario ID is empty. Open Scenario Settings and set a scenario ID.');
      return null;
    }
  
    return scenarioMeta;
  }
  // End Section: Functions for editing scenario metadata and validating it

  // Section: Functions for updating slice titles and exporting updated slices
  function updateSliceTitle(sliceId: string, title: string) {
    setSlicePackage((currentPackage) => {
      if (!currentPackage) {
        return currentPackage;
      }
  
      return {
        ...currentPackage,
        slices: currentPackage.slices.map((slice) => {
          if (slice.sliceId !== sliceId) {
            return slice;
          }
  
          return {
            ...slice,
            title,
          };
        }),
      } as SlicePackage;
    });
  }
  
  function exportUpdatedSlicesJson() {
    if (!slicePackage) {
      alert('No slice package loaded.');
      return;
    }
  
    const fileName = `${slicePackage.scenarioId}.${slicePackage.mode}_slices.updated.json`;
  
    downloadJson(fileName, slicePackage);
  }
  
  function closeSlicePreview() {
    setIsSlicePreviewMode(false);
    setSelectedSlicePreviewInfo(null);
  }

  function updateSliceId(oldSliceId: string, newSliceId: string) {
    const trimmedNewSliceId = newSliceId.trim();
  
    if (!trimmedNewSliceId) {
      return;
    }
  
    setSlicePackage((currentPackage) => {
      if (!currentPackage) {
        return currentPackage;
      }
  
      const alreadyExists = currentPackage.slices.some(
        (slice) =>
          slice.sliceId === trimmedNewSliceId &&
          slice.sliceId !== oldSliceId,
      );
  
      if (alreadyExists) {
        alert(`Slice ID already exists: ${trimmedNewSliceId}`);
        return currentPackage;
      }
  
      return {
        ...currentPackage,
        slices: currentPackage.slices.map((slice) => {
          if (slice.sliceId !== oldSliceId) {
            return slice;
          }
  
          return {
            ...slice,
            sliceId: trimmedNewSliceId,
          };
        }),
      } as SlicePackage;
    });
  
    setSelectedSlicePreviewInfo((currentInfo) => {
      if (!currentInfo || currentInfo.sliceId !== oldSliceId) {
        return currentInfo;
      }
  
      return {
        ...currentInfo,
        sliceId: trimmedNewSliceId,
      };
    });
  }

  function handleNodeClick(_: React.MouseEvent, clickedNode: Node) {
    if (!isSlicePreviewMode) {
      return;
    }
  
    const previewInfo = clickedNode.data?.previewInfo as
      | SlicePreviewNodeInfo
      | undefined;
  
    setSelectedSlicePreviewInfo(previewInfo ?? null);
  }
  // End Section: Functions for updating slice titles and exporting updated slices

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Scenario Authoring Tool</h1>
          <p>
            {scenarioMeta.title} · {scenarioMeta.scenarioId} · start:{' '}
            {scenarioMeta.startNodeId || 'not set'}
          </p>
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
          onEditScenarioSettings={editScenarioSettings}
          onExportScenarioJson={exportScenarioJson}
          onExportPracticeSlicesJson={exportPracticeSlicesJson}
          onExportLearningSlicesJson={exportLearningSlicesJson}
          onLoadSlicesClick={openLoadSlicesDialog}
          isSlicePreviewMode={isSlicePreviewMode}
        />
      </header>

      <div className="editor-body">
        <main className="flow-wrapper">
          <ReactFlow
            nodes={displayedNodes}
            edges={displayedEdges}
            nodeTypes={nodeTypes}
            onNodesChange={isSlicePreviewMode ? undefined : onNodesChange}
            onEdgesChange={isSlicePreviewMode ? undefined : onEdgesChange}
            onConnect={isSlicePreviewMode ? undefined : onConnect}
            onNodeClick={handleNodeClick}
            nodesDraggable={!isSlicePreviewMode}
            nodesConnectable={!isSlicePreviewMode}
            elementsSelectable
            deleteKeyCode={isSlicePreviewMode ? [] : ['Backspace', 'Delete']}
            fitView
          >
            <Background />
            <MiniMap
              nodeColor={(node) =>
                typeof node.data?.miniMapColor === 'string'
                  ? node.data.miniMapColor
                  : '#94a3b8'
              }
              nodeStrokeWidth={3}
              zoomable
              pannable
            />
            <Controls />
          </ReactFlow>
        </main>

      {isSlicePreviewMode ? (
        <SliceManagerPanel
          slicePackage={slicePackage}
          selectedPreviewInfo={selectedSlicePreviewInfo}
          onUpdateSliceId={updateSliceId}
          onUpdateSliceTitle={updateSliceTitle}
          onExportUpdatedSlices={exportUpdatedSlicesJson}
          onClosePreview={closeSlicePreview}
        />
      ) : (
        <InspectorPanel
          selectedNode={selectedNode ?? null}
          onUpdateNodeData={updateNodeData}
        />
      )}
      </div>
    </div>
  );
}
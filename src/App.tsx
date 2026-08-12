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
  type Edge,
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

//to be retired
// let createdNodeCounter = 1;

// function createNodeId(prefix: string) {
//   const id = `${prefix}_${createdNodeCounter}`;
//   createdNodeCounter += 1;
//   return id;
// }

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

// Section: Functions for generating unique node IDs based on title and kind
function slugifyTitle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

function getNodeIdPrefix(kind: AuthoringNodeData['kind']) {
  switch (kind) {
    case 'action':
      return 'a';

    case 'yesNoDecision':
    case 'dialogueDecision':
      return 'd';

    case 'notification':
      return 'n';

    case 'end':
      return 'e';

    default:
      return 'node';
  }
}

// Creates a node ID based on the kind and title
function createNodeIdFromTitle(kind: AuthoringNodeData['kind'], title: string) {
  const prefix = getNodeIdPrefix(kind);
  const slug = slugifyTitle(title);

  return slug ? `${prefix}_${slug}` : `${prefix}_untitled`;
}

// Function to infer the start node ID based on the graph structure
function inferStartNodeId(
  nodes: Node<AuthoringNodeData>[],
  edges: Edge[],
) {
  const targetNodeIds = new Set(edges.map((edge) => edge.target));

  const nodesWithoutIncomingEdges = nodes.filter(
    (node) => !targetNodeIds.has(node.id),
  );

  if (nodesWithoutIncomingEdges.length !== 1) {
    return {
      startNodeId: null,
      candidates: nodesWithoutIncomingEdges.map((node) => node.id),
    };
  }

  return {
    startNodeId: nodesWithoutIncomingEdges[0].id,
    candidates: nodesWithoutIncomingEdges.map((node) => node.id),
  };
}

function createUniqueNodeId(
  preferredId: string,
  existingIds: string[],
  currentNodeId?: string,
) {
  const unavailableIds = existingIds.filter((id) => id !== currentNodeId);

  if (!unavailableIds.includes(preferredId)) {
    return preferredId;
  }

  let index = 2;
  let candidate = `${preferredId}_${index}`;

  while (unavailableIds.includes(candidate)) {
    index += 1;
    candidate = `${preferredId}_${index}`;
  }

  return candidate;
}
// End Section: Functions for generating unique node IDs based on title and kind

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // State for managing the scenario metadata
  const [scenarioMeta, setScenarioMeta] = useState<ScenarioMetadata>({
    scenarioId: 'demo',
    title: '',
    version: '',
    language: '',
    domain: '',
    description: '',
    startNodeId: '',
  });

  // const inferredStartNode = inferStartNodeId(nodes, edges).startNodeId;

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
    const preferredId = createNodeIdFromTitle(data.kind, data.title);
    const uniqueId = createUniqueNodeId(
      preferredId,
      nodes.map((node) => node.id),
    );

    const newNode: Node<AuthoringNodeData> = {
      id: uniqueId,
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

  // Function for renaming nodes and updating edges when node IDs change
  function renameNodeIdFromTitle(nodeId: string) {
    const nodeToRename = nodes.find((node) => node.id === nodeId);
  
    if (!nodeToRename) {
      return;
    }
  
    const preferredId = createNodeIdFromTitle(
      nodeToRename.data.kind,
      nodeToRename.data.title,
    );
  
    const uniqueId = createUniqueNodeId(
      preferredId,
      nodes.map((node) => node.id),
      nodeId,
    );
  
    if (uniqueId === nodeId) {
      return;
    }
  
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const updatedNode =
          node.id === nodeId
            ? {
                ...node,
                id: uniqueId,
              }
            : node;
  
        const contextPatch = updatedNode.data.contextPatch;
  
        if (!contextPatch?.branchSelections?.[nodeId]) {
          return updatedNode;
        }
  
        const nextBranchSelections = {
          ...contextPatch.branchSelections,
        };
  
        nextBranchSelections[uniqueId] = nextBranchSelections[nodeId];
        delete nextBranchSelections[nodeId];
  
        return {
          ...updatedNode,
          data: {
            ...updatedNode.data,
            contextPatch: {
              ...contextPatch,
              branchSelections: nextBranchSelections,
            },
          },
        };
      }),
    );
  
    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        const nextSource = edge.source === nodeId ? uniqueId : edge.source;
        const nextTarget = edge.target === nodeId ? uniqueId : edge.target;
  
        return {
          ...edge,
          id: `xy-edge__${nextSource}${edge.sourceHandle ?? ''}-${nextTarget}`,
          source: nextSource,
          target: nextTarget,
        };
      }),
    );
  
    setScenarioMeta((currentMeta) => ({
      ...currentMeta,
      startNodeId:
        currentMeta.startNodeId === nodeId ? uniqueId : currentMeta.startNodeId,
    }));
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
  // function promptValue(label: string, currentValue: string) {
  //   const value = window.prompt(label, currentValue);
  
  //   if (value === null) {
  //     return currentValue;
  //   }
  
  //   return value.trim();
  // }
  
  function editScenarioSettings() {
    const nextScenarioId = window.prompt(
      'Scenario ID',
      scenarioMeta.scenarioId,
    );

    if (nextScenarioId === null) {
      return;
    }

    setScenarioMeta((currentMeta) => ({
      ...currentMeta,
      scenarioId: nextScenarioId.trim() || currentMeta.scenarioId,
    }));
  }

  function getValidScenarioMetaOrAlert() {
    if (!scenarioMeta.scenarioId.trim()) {
      alert('Scenario ID is empty. Open Scenario Settings and set a scenario ID.');
      return null;
    }

    const inferredStart = inferStartNodeId(nodes, edges);

    if (!inferredStart.startNodeId) {
      alert(
        'Could not infer a unique start node.\n\n' +
          'The start node is inferred as the only node with no incoming edge.\n\n' +
          `Found ${inferredStart.candidates.length} candidates:\n` +
          `${inferredStart.candidates.join('\n') || '(none)'}`,
      );

      return null;
    }

    return {
      ...scenarioMeta,
      title: scenarioMeta.title || scenarioMeta.scenarioId,
      version: scenarioMeta.version || '0.1.0',
      language: scenarioMeta.language || 'en',
      domain: scenarioMeta.domain || '',
      description:
        scenarioMeta.description ||
        `${scenarioMeta.scenarioId} generated from React Flow authoring graph.`,
      startNodeId: inferredStart.startNodeId,
    };
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
            sliceId: title,
          };
        }),
      } as SlicePackage;
    });

    setSelectedSlicePreviewInfo((currentInfo) => {
      if (!currentInfo || currentInfo.sliceId !== sliceId) {
        return currentInfo;
      }

      return {
        ...currentInfo,
        sliceId: title,
        title,
      };
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

  // to be retired
  // function updateSliceId(oldSliceId: string, newSliceId: string) {
  //   const trimmedNewSliceId = newSliceId.trim();
  
  //   if (!trimmedNewSliceId) {
  //     return;
  //   }
  
  //   setSlicePackage((currentPackage) => {
  //     if (!currentPackage) {
  //       return currentPackage;
  //     }
  
  //     const alreadyExists = currentPackage.slices.some(
  //       (slice) =>
  //         slice.sliceId === trimmedNewSliceId &&
  //         slice.sliceId !== oldSliceId,
  //     );
  
  //     if (alreadyExists) {
  //       alert(`Slice ID already exists: ${trimmedNewSliceId}`);
  //       return currentPackage;
  //     }
  
  //     return {
  //       ...currentPackage,
  //       slices: currentPackage.slices.map((slice) => {
  //         if (slice.sliceId !== oldSliceId) {
  //           return slice;
  //         }
  
  //         return {
  //           ...slice,
  //           sliceId: trimmedNewSliceId,
  //         };
  //       }),
  //     } as SlicePackage;
  //   });
  
  //   setSelectedSlicePreviewInfo((currentInfo) => {
  //     if (!currentInfo || currentInfo.sliceId !== oldSliceId) {
  //       return currentInfo;
  //     }
  
  //     return {
  //       ...currentInfo,
  //       sliceId: trimmedNewSliceId,
  //     };
  //   });
  // }

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
          <h1>{scenarioMeta.scenarioId}</h1>
          {/* <p>
            {scenarioMeta.title} · {scenarioMeta.scenarioId} · start:{' '}
            {inferredStartNode ?? 'not found'}
          </p> */}
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
          onUpdateSliceTitle={updateSliceTitle}
          onExportUpdatedSlices={exportUpdatedSlicesJson}
          onClosePreview={closeSlicePreview}
        />
      ) : (
        <InspectorPanel
          selectedNode={selectedNode ?? null}
          onUpdateNodeData={updateNodeData}
          onRenameNodeIdFromTitle={renameNodeIdFromTitle}
        />
      )}
      </div>
    </div>
  );
}
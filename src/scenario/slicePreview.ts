import type { Edge, Node } from '@xyflow/react';
import { Position } from '@xyflow/react';
import type { AuthoringNodeData } from './authoringTypes';
import type {
  LearningSlice,
  LearningSlicePackage,
  PracticeLoopInfo,
  PracticeSlice,
  PracticeSlicePackage,
  SliceSceneStateEntry,
} from './sliceTypes';

export type SlicePackage = PracticeSlicePackage | LearningSlicePackage;

export type SlicePreviewStateEntry = {
  key: string;
  value: string | number | boolean;
  applyTiming: string;
  sourceNodeId: string;
};

export type SlicePreviewNodeInfo = {
  sliceId: string;
  sliceIndex: number;
  nodeId: string;
  title: string;
  kind: string;

  correctChoiceId?: string;
  loop?: PracticeLoopInfo;

  stateRevealNodeIds: string[];
  revealedStateEntries: SlicePreviewStateEntry[];

  notificationContextPatch?: {
    branchSelections?: Record<string, string>;
    sceneState?: Record<string, string | number | boolean>;
  };
};

type PreviewGraph = {
  nodes: Node[];
  edges: Edge[];
};

function isPracticePackage(
  slicePackage: SlicePackage,
): slicePackage is PracticeSlicePackage {
  return slicePackage.mode === 'practice';
}

function isLearningSlice(
  slice: PracticeSlice | LearningSlice,
): slice is LearningSlice {
  return slice.mode === 'learning';
}

function getAuthoringNode(
  scenarioNodes: Node<AuthoringNodeData>[],
  nodeId: string,
) {
  return scenarioNodes.find((node) => node.id === nodeId);
}

function getNodeLabel(
  scenarioNodes: Node<AuthoringNodeData>[],
  nodeId: string,
) {
  const authoringNode = getAuthoringNode(scenarioNodes, nodeId);

  if (!authoringNode) {
    return nodeId;
  }

  return authoringNode.data.title || nodeId;
}

function getNodeKind(
  scenarioNodes: Node<AuthoringNodeData>[],
  nodeId: string,
) {
  const authoringNode = getAuthoringNode(scenarioNodes, nodeId);

  return authoringNode?.data.kind ?? 'unknown';
}

function getNodeStyle(kind: string) {
  switch (kind) {
    case 'action':
      return {
        background: '#dcfce7',
        border: '2px solid #16a34a',
        color: '#052e16',
      };

    case 'yesNoDecision':
      return {
        background: '#f3e8ff',
        border: '2px solid #9333ea',
        color: '#3b0764',
      };

    case 'dialogueDecision':
      return {
        background: '#fce7f3',
        border: '2px solid #db2777',
        color: '#500724',
      };

    case 'notification':
      return {
        background: '#ffedd5',
        border: '2px solid #f97316',
        color: '#431407',
      };

    case 'end':
      return {
        background: '#e5e7eb',
        border: '2px solid #111827',
        color: '#111827',
      };

    default:
      return {
        background: '#f8fafc',
        border: '2px solid #64748b',
        color: '#0f172a',
      };
  }
}

function getMiniMapColor(kind: string) {
  switch (kind) {
    case 'action':
      return '#22c55e';

    case 'yesNoDecision':
      return '#a855f7';

    case 'dialogueDecision':
      return '#ec4899';

    case 'notification':
      return '#f97316';

    case 'end':
      return '#6b7280';

    default:
      return '#94a3b8';
  }
}

function asPreviewStateEntry(
  key: string,
  entry: SliceSceneStateEntry,
): SlicePreviewStateEntry {
  return {
    key,
    value: entry.value,
    applyTiming: entry.applyTiming,
    sourceNodeId: entry.sourceNodeId,
  };
}

function getSceneStateEntriesForSource(
  slice: PracticeSlice | LearningSlice,
  sourceNodeId: string,
) {
  return Object.entries(slice.sceneState)
    .filter(([, entry]) => entry.sourceNodeId === sourceNodeId)
    .map(([key, entry]) => asPreviewStateEntry(key, entry));
}

function getSceneStateEntriesForSources(
  slice: PracticeSlice | LearningSlice,
  sourceNodeIds: string[],
) {
  return Object.entries(slice.sceneState)
    .filter(([, entry]) => sourceNodeIds.includes(entry.sourceNodeId))
    .map(([key, entry]) => asPreviewStateEntry(key, entry));
}

type PreviewPathStep = {
  nodeId: string;
  stateRevealNodeIds: string[];
  loop?: PracticeLoopInfo;
};

function getPracticePath(
  slicePackage: PracticeSlicePackage,
  sliceIndex: number,
): PreviewPathStep[] {
  return slicePackage.slices[sliceIndex].steps.map((step) => ({
    nodeId: step.nodeId,
    stateRevealNodeIds: step.stateRevealNodeIds ?? [],
    loop: step.loop,
  }));
}

function getLearningPath(
  slicePackage: LearningSlicePackage,
  sliceIndex: number,
): PreviewPathStep[] {
  return slicePackage.slices[sliceIndex].pathNodeIds.map((nodeId) => ({
    nodeId,
    stateRevealNodeIds: [],
  }));
}

function createShortStateLabel(entries: SlicePreviewStateEntry[]) {
  if (entries.length === 0) {
    return '';
  }

  return entries
    .map((entry) => `${entry.key}=${String(entry.value)}`)
    .join(', ');
}

function createNodeDisplayLabel(info: SlicePreviewNodeInfo) {
  const lines = [info.title, info.nodeId];

  if (info.correctChoiceId) {
    lines.push(`correct: ${info.correctChoiceId}`);
  }

  if (info.stateRevealNodeIds.length > 0) {
    lines.push(`reveals: ${info.stateRevealNodeIds.join(', ')}`);
  }

  if (info.loop?.startsLoop) {
    lines.push(
      `loop -> ${info.loop.targetNodeId ?? 'unknown target'}`,
    );
  }

  const stateLabel = createShortStateLabel(info.revealedStateEntries);

  if (stateLabel) {
    lines.push(stateLabel);
  }

  if (info.notificationContextPatch?.branchSelections) {
    const patchLabel = Object.entries(
      info.notificationContextPatch.branchSelections,
    )
      .map(([nodeId, choiceId]) => `${nodeId}=${choiceId}`)
      .join(', ');

    lines.push(`patch: ${patchLabel}`);
  }

  return lines.join('\n');
}

function getCorrectChoiceId(
  slice: PracticeSlice | LearningSlice,
  nodeId: string,
) {
  if (!isLearningSlice(slice)) {
    return undefined;
  }

  return slice.decisionRules[nodeId]?.correctChoiceId;
}

function getNotificationContextPatch(
  slice: PracticeSlice | LearningSlice,
  nodeId: string,
) {
  if (!isLearningSlice(slice)) {
    return undefined;
  }

  return slice.notificationRules[nodeId]?.contextPatch;
}

function buildInfoForPathNode(
  slice: PracticeSlice | LearningSlice,
  sliceIndex: number,
  scenarioNodes: Node<AuthoringNodeData>[],
  nodeId: string,
  stateRevealNodeIds: string[],
  loop?: PracticeLoopInfo,
): SlicePreviewNodeInfo {
  const kind = getNodeKind(scenarioNodes, nodeId);

  const ownStateEntries = getSceneStateEntriesForSource(slice, nodeId);
  const revealedStateEntries = [
    ...ownStateEntries,
    ...getSceneStateEntriesForSources(slice, stateRevealNodeIds),
  ];

  return {
    sliceId: slice.sliceId,
    sliceIndex,
    nodeId,
    title: getNodeLabel(scenarioNodes, nodeId),
    kind,
    correctChoiceId: getCorrectChoiceId(slice, nodeId),
    loop,
    stateRevealNodeIds,
    revealedStateEntries,
    notificationContextPatch: getNotificationContextPatch(slice, nodeId),
  };
}

export function buildSlicePreviewGraph(
  slicePackage: SlicePackage,
  scenarioNodes: Node<AuthoringNodeData>[],
): PreviewGraph {
  const previewNodes: Node[] = [];
  const previewEdges: Edge[] = [];

  const rowHeight = 180;
  const columnWidth = 290;
  const labelColumnWidth = 330;

  slicePackage.slices.forEach((slice, sliceIndex) => {
    const y = sliceIndex * rowHeight;

    const labelNodeId = `slice-label-${slice.sliceId}`;

    previewNodes.push({
      id: labelNodeId,
      type: 'default',
      position: { x: 0, y },
      draggable: false,
      selectable: true,
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {
        label: `${sliceIndex + 1}. ${slice.title}`,
        miniMapColor: slicePackage.mode === 'practice' ? '#facc15' : '#4ade80',
        previewInfo: {
          sliceId: slice.sliceId,
          sliceIndex,
          nodeId: slice.sliceId,
          title: slice.title,
          kind: `${slicePackage.mode} slice`,
          stateRevealNodeIds: [],
          revealedStateEntries: [],
        } satisfies SlicePreviewNodeInfo,
      },
      style: {
        width: 280,
        minHeight: 64,
        borderRadius: 999,
        border: '2px solid #0f172a',
        background: slicePackage.mode === 'practice' ? '#fde68a' : '#bbf7d0',
        color: '#0f172a',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 10,
        whiteSpace: 'pre-line',
      },
    });

    const path = isPracticePackage(slicePackage)
      ? getPracticePath(slicePackage, sliceIndex)
      : getLearningPath(slicePackage, sliceIndex);

    let previousNodeId = labelNodeId;

    path.forEach((pathStep, nodeIndex) => {
      const graphNodeId = `${slice.sliceId}-${nodeIndex}-${pathStep.nodeId}`;
      const info = buildInfoForPathNode(
        slice,
        sliceIndex,
        scenarioNodes,
        pathStep.nodeId,
        pathStep.stateRevealNodeIds,
        pathStep.loop,
      );

      previewNodes.push({
        id: graphNodeId,
        type: 'default',
        position: {
          x: labelColumnWidth + nodeIndex * columnWidth,
          y,
        },
        draggable: false,
        selectable: true,
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        data: {
          label: createNodeDisplayLabel(info),
          previewInfo: info,
          miniMapColor: getMiniMapColor(info.kind),
        },
        style: {
          width: 230,
          minHeight: 90,
          borderRadius:
            info.kind === 'yesNoDecision' ||
            info.kind === 'dialogueDecision'
              ? 18
              : 12,
          whiteSpace: 'pre-line',
          fontSize: 12,
          textAlign: 'center',
          padding: 10,
          ...getNodeStyle(info.kind),
        },
      });

      previewEdges.push({
        id: `edge-${previousNodeId}-${graphNodeId}`,
        source: previousNodeId,
        target: graphNodeId,
        animated: false,
        type: 'smoothstep',
      });

      previousNodeId = graphNodeId;
    });
  });

  return {
    nodes: previewNodes,
    edges: previewEdges,
  };
}
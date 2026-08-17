import type { Edge, Node } from '@xyflow/react';
import type {
  AuthoringChoiceData,
  AuthoringNodeData,
  StateApplyTiming,
  StateEffects,
} from './authoringTypes';
import type {
  PracticeLoopInfo,
  PracticeSlice,
  PracticeSlicePackage,
  PracticeStep,
  SliceSceneState,
} from './sliceTypes';
import { inferStateEffectsFromChoice } from './stateInference';
import { mergeSceneStateEntries } from './sceneStateUtils';

type TraversalContext = {
  branchSelections: Record<string, string>;
  sceneState: PracticeSlice['sceneState'];
  steps: PracticeStep[];
  path: string[];
  visited: Set<string>;
};

function getNodeById(nodes: Node<AuthoringNodeData>[], nodeId: string) {
  return nodes.find((node) => node.id === nodeId);
}

function getNextNodeIdFromHandle(
  nodeId: string,
  handleId: string,
  edges: Edge[],
) {
  return edges.find(
    (edge) => edge.source === nodeId && edge.sourceHandle === handleId,
  )?.target;
}

function createSliceId(branchSelections: Record<string, string>) {
  const branchPart = Object.entries(branchSelections)
    .map(([nodeId, choiceId]) => `${nodeId}_${choiceId}`)
    .join('__');

  if (!branchPart) {
    return 'practice_default';
  }

  return `practice_${branchPart}`;
}

function createSliceTitle(branchSelections: Record<string, string>) {
  const branchPart = Object.entries(branchSelections)
    .map(([nodeId, choiceId]) => `${nodeId}: ${choiceId}`)
    .join(', ');

  if (!branchPart) {
    return 'Practice default path';
  }

  return `Practice: ${branchPart}`;
}

function cloneContext(context: TraversalContext): TraversalContext {
  return {
    branchSelections: { ...context.branchSelections },
    sceneState: { ...context.sceneState },
    steps: context.steps.map((step) => ({
      nodeId: step.nodeId,
      stateRevealNodeIds: [...step.stateRevealNodeIds],
      loop: step.loop
        ? {
            startsLoop: step.loop.startsLoop,
            targetNodeId: step.loop.targetNodeId,
          }
        : undefined,
    })),
    path: [...context.path],
    visited: new Set(context.visited),
  };
}

function createPracticeSlice(context: TraversalContext): PracticeSlice {
  return {
    sliceId: createSliceId(context.branchSelections),
    mode: 'practice',
    title: createSliceTitle(context.branchSelections),
    branchSelections: context.branchSelections,
    sceneState: context.sceneState,
    steps: context.steps,
  };
}

function getDefaultApplyTiming(
  currentSceneState: SliceSceneState,
  stateEffects: StateEffects | undefined,
): StateApplyTiming {
  // If any state key in stateEffects already exists in the current scene state,
  // this is an update → reveal when source node is reached.
  // Otherwise, this is the first time setting these keys → apply at slice start.
  if (stateEffects) {
    for (const key of Object.keys(stateEffects)) {
      if (currentSceneState[key]) {
        return 'OnSourceNodeReached';
      }
    }
  }

  return 'AtSliceStart';
}

function addRevealToLastStep(context: TraversalContext, sourceNodeId: string) {
  const lastStep = context.steps[context.steps.length - 1];

  if (!lastStep) {
    return;
  }

  if (!lastStep.stateRevealNodeIds.includes(sourceNodeId)) {
    lastStep.stateRevealNodeIds.push(sourceNodeId);
  }
}

function markLoopOnLastStep(
  context: TraversalContext,
  targetNodeId: string,
): PracticeLoopInfo | undefined {
  const lastStep = context.steps[context.steps.length - 1];

  if (!lastStep) {
    return undefined;
  }

  const loopInfo: PracticeLoopInfo = {
    startsLoop: true,
    targetNodeId,
  };

  lastStep.loop = loopInfo;
  return loopInfo;
}

function hasBackEdge(path: string[], nextNodeId: string) {
  return path.includes(nextNodeId);
}

function traversePracticePath(
  nodeId: string,
  nodes: Node<AuthoringNodeData>[],
  edges: Edge[],
  context: TraversalContext,
): PracticeSlice[] {
  const node = getNodeById(nodes, nodeId);

  if (!node) {
    return [];
  }

  const visitKey = `${nodeId}|${JSON.stringify(context.branchSelections)}`;

  // Cycle detection remains intentionally conservative: if the same node is seen
  // again with the same branch history, the slice generation should stop so we do
  // not recurse forever. The loop metadata is attached separately to the step that
  // triggers the back-edge so the runtime can still reconstruct the loop.
  if (context.visited.has(visitKey)) {
    console.warn(`Cycle detected while generating practice slices at ${nodeId}`);
    return [];
  }

  context.visited.add(visitKey);
  const nextPath = [...context.path, node.id];

  switch (node.data.kind) {
    case 'action': {
      const nextNodeId = getNextNodeIdFromHandle(node.id, 'next', edges);

      const nextContext = cloneContext(context);
      nextContext.path = nextPath;

      nextContext.steps.push({
        nodeId: node.id,
        stateRevealNodeIds: [],
      });

      if (!nextNodeId) {
        return [createPracticeSlice(nextContext)];
      }

      // A back-edge indicates we are re-entering an earlier node in the current
      // branch. We intentionally stop expanding that path and record loop metadata
      // on the originating action step instead of generating duplicate loop slices.
      if (hasBackEdge(nextContext.path, nextNodeId)) {
        markLoopOnLastStep(nextContext, nextNodeId);
        return [createPracticeSlice(nextContext)];
      }

      return traversePracticePath(nextNodeId, nodes, edges, nextContext);
    }

    case 'yesNoDecision':
    case 'dialogueDecision': {
      const choices = node.data.choices ?? [];

      return choices.flatMap((choice: AuthoringChoiceData) => {
        const nextNodeId = getNextNodeIdFromHandle(
          node.id,
          choice.choiceId,
          edges,
        );

        if (!nextNodeId) {
          console.warn(
            `Choice ${node.id}.${choice.choiceId} has no outgoing edge`,
          );
          return [];
        }

        const nextContext = cloneContext(context);
        nextContext.path = nextPath;

        nextContext.branchSelections[node.id] = choice.choiceId;

        const stateEffects = inferStateEffectsFromChoice(node.id, choice);
        const applyTiming =
          choice.stateApplyTiming ?? getDefaultApplyTiming(context.sceneState, stateEffects);

        nextContext.sceneState = mergeSceneStateEntries(
          nextContext.sceneState,
          stateEffects,
          applyTiming,
          node.id,
        );

        if (stateEffects && applyTiming === 'OnSourceNodeReached') {
          addRevealToLastStep(nextContext, node.id);
        }

        if (hasBackEdge(nextContext.path, nextNodeId)) {
          markLoopOnLastStep(nextContext, nextNodeId);
          return [createPracticeSlice(nextContext)];
        }

        return traversePracticePath(nextNodeId, nodes, edges, nextContext);
      });
    }

    case 'notification': {
      // Practice skips NotificationNodes and continues through their next edge.
      // If the notification routes back to a node already visited on this path,
      // we stop the expansion and keep the loop information on the previous step.
      const nextNodeId = getNextNodeIdFromHandle(node.id, 'next', edges);

      if (!nextNodeId) {
        return [createPracticeSlice(context)];
      }

      const nextContext = cloneContext(context);
      nextContext.path = nextPath;

      if (hasBackEdge(nextContext.path, nextNodeId)) {
        markLoopOnLastStep(nextContext, nextNodeId);
        return [createPracticeSlice(nextContext)];
      }

      return traversePracticePath(nextNodeId, nodes, edges, nextContext);
    }

    case 'end': {
      return [createPracticeSlice(context)];
    }

    default:
      return [];
  }
}

export function compilePracticeSlices(
  nodes: Node<AuthoringNodeData>[],
  edges: Edge[],
  scenarioId: string,
  startNodeId: string,
): PracticeSlicePackage {
  const initialContext: TraversalContext = {
    branchSelections: {},
    sceneState: {},
    steps: [],
    path: [],
    visited: new Set<string>(),
  };

  const slices = traversePracticePath(
    startNodeId,
    nodes,
    edges,
    initialContext,
  );

  return {
    scenarioId,
    mode: 'practice',
    generatedAt: new Date().toISOString(),
    slices,
  };
}
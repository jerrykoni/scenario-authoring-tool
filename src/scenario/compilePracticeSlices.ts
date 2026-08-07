import type { Edge, Node } from '@xyflow/react';
import type {
  AuthoringChoiceData,
  AuthoringNodeData,
  StateApplyTiming,
} from './authoringTypes';
import type { PracticeSlice, PracticeSlicePackage, PracticeStep } from './sliceTypes';
import { inferStateEffectsFromChoice } from './stateInference';
import { mergeSceneStateEntries } from './sceneStateUtils';

type TraversalContext = {
  branchSelections: Record<string, string>;
  sceneState: PracticeSlice['sceneState'];
  steps: PracticeStep[];
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
    })),
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

function getDefaultApplyTiming(context: TraversalContext): StateApplyTiming {
  // First resolved decision defines initial scene setup.
  // Later state-producing decisions are revealed when their source node is reached.
  return Object.keys(context.branchSelections).length === 0
    ? 'AtSliceStart'
    : 'OnSourceNodeReached';
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

  if (context.visited.has(visitKey)) {
    console.warn(`Cycle detected while generating practice slices at ${nodeId}`);
    return [];
  }

  context.visited.add(visitKey);

  switch (node.data.kind) {
    case 'action': {
      const nextNodeId = getNextNodeIdFromHandle(node.id, 'next', edges);

      const nextContext = cloneContext(context);

      nextContext.steps.push({
        nodeId: node.id,
        stateRevealNodeIds: [],
      });

      if (!nextNodeId) {
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

        nextContext.branchSelections[node.id] = choice.choiceId;

        const stateEffects = inferStateEffectsFromChoice(node.id, choice);
        const applyTiming =
          choice.stateApplyTiming ?? getDefaultApplyTiming(context);

        nextContext.sceneState = mergeSceneStateEntries(
          nextContext.sceneState,
          stateEffects,
          applyTiming,
          node.id,
        );

        if (stateEffects && applyTiming === 'OnSourceNodeReached') {
          addRevealToLastStep(nextContext, node.id);
        }

        return traversePracticePath(nextNodeId, nodes, edges, nextContext);
      });
    }

    case 'notification': {
      // Practice skips NotificationNodes and continues through their next edge.
      const nextNodeId = getNextNodeIdFromHandle(node.id, 'next', edges);

      if (!nextNodeId) {
        return [createPracticeSlice(context)];
      }

      return traversePracticePath(nextNodeId, nodes, edges, cloneContext(context));
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
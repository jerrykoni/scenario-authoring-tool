import type { Edge, Node } from '@xyflow/react';
import type {
  AuthoringChoiceData,
  AuthoringNodeData,
  StateEffects,
} from './authoringTypes';
import type { PracticeSlice, PracticeSlicePackage } from './sliceTypes';
import { inferStateEffectsFromChoice } from './stateInference';

type TraversalContext = {
  branchSelections: Record<string, string>;
  sceneState: Record<string, string | number | boolean>;
  steps: Array<{ nodeId: string }>;
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

function mergeStateEffects(
  currentSceneState: Record<string, string | number | boolean>,
  stateEffects?: StateEffects,
) {
  return {
    ...currentSceneState,
    ...(stateEffects ?? {}),
  };
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
    steps: [...context.steps],
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
      nextContext.steps.push({ nodeId: node.id });

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

        nextContext.sceneState = mergeStateEffects(
          nextContext.sceneState,
          stateEffects,
        );

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
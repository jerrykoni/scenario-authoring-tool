import type { Edge, Node } from '@xyflow/react';
import type {
  AuthoringChoiceData,
  AuthoringNodeData,
  BranchSelections,
} from './authoringTypes';
import type {
  LearningDecisionRule,
  LearningNotificationRule,
  LearningSlice,
  LearningSlicePackage,
} from './sliceTypes';
import { inferStateEffectsFromChoice } from './stateInference';
import type { StateApplyTiming } from './authoringTypes';
import { mergeSceneStateEntries } from './sceneStateUtils';

type LearningTraversalContext = {
  branchSelections: Record<string, string>;
  sceneState: LearningSlice['sceneState'];

  decisionRules: Record<string, LearningDecisionRule>;
  notificationRules: Record<string, LearningNotificationRule>;

  pathNodeIds: string[];
  visited: Set<string>;

  // Once a notification patch happens, later choices are still learning rules,
  // but they should not mutate the initial slice setup.
  isAfterContextPatch: boolean;
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

function getDefaultApplyTiming(
  context: LearningTraversalContext,
): StateApplyTiming {
  if (
    !context.isAfterContextPatch &&
    Object.keys(context.branchSelections).length === 0
  ) {
    return 'AtSliceStart';
  }

  return 'OnSourceNodeReached';
}

// function mergeSceneState(
//   currentSceneState: Record<string, string | number | boolean>,
//   patch?: Record<string, string | number | boolean>,
// ) {
//   return {
//     ...currentSceneState,
//     ...(patch ?? {}),
//   };
// }

function cloneContext(
  context: LearningTraversalContext,
): LearningTraversalContext {
  return {
    branchSelections: { ...context.branchSelections },
    sceneState: { ...context.sceneState },
    decisionRules: { ...context.decisionRules },
    notificationRules: { ...context.notificationRules },
    pathNodeIds: [...context.pathNodeIds],
    visited: new Set(context.visited),
    isAfterContextPatch: context.isAfterContextPatch,
  };
}

function createLearningSliceId(
  decisionRules: Record<string, LearningDecisionRule>,
) {
  const rulePart = Object.entries(decisionRules)
    .map(([nodeId, rule]) => `${nodeId}_${rule.correctChoiceId}`)
    .join('__');

  if (rulePart) {
    return `learning_${rulePart}`;
  }

  return 'learning_default';
}

function createLearningSliceTitle(
  decisionRules: Record<string, LearningDecisionRule>,
) {
  const rulePart = Object.entries(decisionRules)
    .map(([nodeId, rule]) => `${nodeId}: ${rule.correctChoiceId}`)
    .join(', ');

  if (rulePart) {
    return `Learning: ${rulePart}`;
  }

  return 'Learning default path';
}

function createLearningSlice(
  context: LearningTraversalContext,
  startNodeId: string,
): LearningSlice {
  return {
    sliceId: createLearningSliceId(context.decisionRules),
    mode: 'learning',
    title: createLearningSliceTitle(context.decisionRules),
    startNodeId,

    branchSelections: context.branchSelections,
    sceneState: context.sceneState,

    decisionRules: context.decisionRules,
    notificationRules: context.notificationRules,

    pathNodeIds: context.pathNodeIds,
  };
}

function compileSceneStateFromBranchSelections(
  branchSelections: BranchSelections | undefined,
  nodes: Node<AuthoringNodeData>[],
) {
  const sceneState: Record<string, string | number | boolean> = {};

  if (!branchSelections) {
    return sceneState;
  }

  for (const [decisionNodeId, choiceId] of Object.entries(branchSelections)) {
    const decisionNode = getNodeById(nodes, decisionNodeId);

    if (!decisionNode) {
      continue;
    }

    const choice = decisionNode.data.choices?.find(
      (candidateChoice) => candidateChoice.choiceId === choiceId,
    );

    if (!choice) {
      continue;
    }

    const stateEffects = inferStateEffectsFromChoice(decisionNodeId, choice);

    Object.assign(sceneState, stateEffects ?? {});
  }

  return sceneState;
}

function getRedirectNodeIdFromContextPatch(
  contextPatchBranchSelections: BranchSelections | undefined,
  nodes: Node<AuthoringNodeData>[],
  edges: Edge[],
) {
  if (!contextPatchBranchSelections) {
    return undefined;
  }

  const firstPatchEntry = Object.entries(contextPatchBranchSelections)[0];

  if (!firstPatchEntry) {
    return undefined;
  }

  const [decisionNodeId, choiceId] = firstPatchEntry;

  const decisionNode = getNodeById(nodes, decisionNodeId);

  if (!decisionNode) {
    return undefined;
  }

  return getNextNodeIdFromHandle(decisionNode.id, choiceId, edges);
}

function traverseLearningPath(
  nodeId: string,
  nodes: Node<AuthoringNodeData>[],
  edges: Edge[],
  context: LearningTraversalContext,
  startNodeId: string,
): LearningSlice[] {
  const node = getNodeById(nodes, nodeId);

  if (!node) {
    return [];
  }

  const visitKey = `${nodeId}|${JSON.stringify(
    context.decisionRules,
  )}|${JSON.stringify(context.notificationRules)}`;

  if (context.visited.has(visitKey)) {
    console.warn(`Cycle detected while generating learning slices at ${nodeId}`);
    return [];
  }

  context.visited.add(visitKey);

  const currentContext = cloneContext(context);
  currentContext.pathNodeIds.push(node.id);

  switch (node.data.kind) {
    case 'action': {
      const nextNodeId = getNextNodeIdFromHandle(node.id, 'next', edges);

      if (!nextNodeId) {
        return [createLearningSlice(currentContext, startNodeId)];
      }

      return traverseLearningPath(
        nextNodeId,
        nodes,
        edges,
        currentContext,
        startNodeId,
      );
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

        const nextContext = cloneContext(currentContext);

        const stateEffects = inferStateEffectsFromChoice(node.id, choice);
        const applyTiming =
          choice.stateApplyTiming ?? getDefaultApplyTiming(nextContext);

        nextContext.decisionRules[node.id] = {
          correctChoiceId: choice.choiceId,
        };

        nextContext.sceneState = mergeSceneStateEntries(
          nextContext.sceneState,
          stateEffects,
          applyTiming,
          node.id,
        );
        
        if (!nextContext.isAfterContextPatch) {
          nextContext.branchSelections[node.id] = choice.choiceId;
        }

        return traverseLearningPath(
          nextNodeId,
          nodes,
          edges,
          nextContext,
          startNodeId,
        );
      });
    }

    case 'notification': {
      const nextContext = cloneContext(currentContext);

      const contextPatchBranchSelections =
        node.data.contextPatch?.branchSelections;

      const contextPatchSceneState = compileSceneStateFromBranchSelections(
        contextPatchBranchSelections,
        nodes,
      );

      const redirectNodeId =
        getRedirectNodeIdFromContextPatch(
          contextPatchBranchSelections,
          nodes,
          edges,
        ) ?? getNextNodeIdFromHandle(node.id, 'next', edges);

      nextContext.notificationRules[node.id] = {
        nextNodeId: redirectNodeId,
        contextPatch: {
          branchSelections: contextPatchBranchSelections,
          sceneState: contextPatchSceneState,
        },
      };

      nextContext.isAfterContextPatch = true;

      if (!redirectNodeId) {
        return [createLearningSlice(nextContext, startNodeId)];
      }

      return traverseLearningPath(
        redirectNodeId,
        nodes,
        edges,
        nextContext,
        startNodeId,
      );
    }

    case 'end': {
      return [createLearningSlice(currentContext, startNodeId)];
    }

    default:
      return [];
  }
}

// Section: Filter out learning slices that are covered by notification rules in other slices.
function createBranchSelectionKey(nodeId: string, choiceId: string) {
  return `${nodeId}=${choiceId}`;
}

function getCoveredBranchSelectionKeys(slices: LearningSlice[]) {
  const coveredKeys = new Set<string>();

  for (const slice of slices) {
    for (const rule of Object.values(slice.notificationRules)) {
      const branchSelections = rule.contextPatch?.branchSelections;

      if (!branchSelections) {
        continue;
      }

      for (const [nodeId, choiceId] of Object.entries(branchSelections)) {
        coveredKeys.add(createBranchSelectionKey(nodeId, choiceId));
      }
    }
  }

  return coveredKeys;
}

function sliceHasCoveredInitialBranchSelection(
  slice: LearningSlice,
  coveredKeys: Set<string>,
) {
  return Object.entries(slice.branchSelections).some(([nodeId, choiceId]) =>
    coveredKeys.has(createBranchSelectionKey(nodeId, choiceId)),
  );
}

function sliceContainsNotificationRule(slice: LearningSlice) {
  return Object.keys(slice.notificationRules).length > 0;
}

function filterLearningSlicesCoveredByNotifications(slices: LearningSlice[]) {
  const coveredKeys = getCoveredBranchSelectionKeys(slices);

  if (coveredKeys.size === 0) {
    return slices;
  }

  return slices.filter((slice) => {
    const isCoveredStandaloneBranch =
      sliceHasCoveredInitialBranchSelection(slice, coveredKeys);

    if (!isCoveredStandaloneBranch) {
      return true;
    }

    // Keep teaching slices that actually contain notification behavior.
    // Remove standalone slices for branches already covered by a notification.
    if (sliceContainsNotificationRule(slice)) {
      return true;
    }

    return false;
  });
}
// End Section: Filter out learning slices that are covered by notification rules in other slices.

export function compileLearningSlices(
  nodes: Node<AuthoringNodeData>[],
  edges: Edge[],
  scenarioId: string,
  startNodeId: string,
): LearningSlicePackage {
  const initialContext: LearningTraversalContext = {
    branchSelections: {},
    sceneState: {},
    decisionRules: {},
    notificationRules: {},
    pathNodeIds: [],
    visited: new Set<string>(),
    isAfterContextPatch: false,
  };

  const rawSlices = traverseLearningPath(
    startNodeId,
    nodes,
    edges,
    initialContext,
    startNodeId,
  );

  const slices = filterLearningSlicesCoveredByNotifications(rawSlices); // Exclude slices that are covered by notification rules in other slices.

  return {
    scenarioId,
    mode: 'learning',
    generatedAt: new Date().toISOString(),
    slices,
  };
}
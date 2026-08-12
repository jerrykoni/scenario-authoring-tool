import type { Edge, Node } from '@xyflow/react';
import type {
  AuthoringChoiceData,
  AuthoringNodeData,
  BranchSelections,
  StateApplyTiming,
} from './authoringTypes';
import type {
  LearningDecisionRule,
  LearningNotificationRule,
  LearningSlice,
  LearningSlicePackage,
  SliceSceneState,
} from './sliceTypes';
import { inferStateEffectsFromChoice } from './stateInference';
import { mergeSceneStateEntries } from './sceneStateUtils';

type LearningTraversalContext = {
  branchSelections: Record<string, string>;
  sceneState: SliceSceneState;

  decisionRules: Record<string, LearningDecisionRule>;
  notificationRules: Record<string, LearningNotificationRule>;

  pathNodeIds: string[];
  visited: Set<string>;

  isAfterContextPatch: boolean;
};

function getNodeById(nodes: Node<AuthoringNodeData>[], nodeId: string) {
  return nodes.find((node) => node.id === nodeId);
}

function getEndNodeId(nodes: Node<AuthoringNodeData>[]) {
  return nodes.find((node) => node.data.kind === 'end')?.id ?? 'end_demo';
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
  titleOverride?: string,
): LearningSlice {
  return {
    sliceId: createLearningSliceId(context.decisionRules),
    mode: 'learning',
    title: titleOverride ?? createLearningSliceTitle(context.decisionRules),
    startNodeId,

    branchSelections: context.branchSelections,
    sceneState: context.sceneState,

    decisionRules: context.decisionRules,
    notificationRules: context.notificationRules,

    pathNodeIds: context.pathNodeIds,
  };
}

function compileRawSceneStateFromBranchSelections(
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

// function compileWrappedSceneStateFromBranchSelections(
//   branchSelections: BranchSelections | undefined,
//   nodes: Node<AuthoringNodeData>[],
//   currentSceneState: SliceSceneState,
// ) {
//   let nextSceneState: SliceSceneState = {
//     ...currentSceneState,
//   };

//   if (!branchSelections) {
//     return nextSceneState;
//   }

//   for (const [decisionNodeId, choiceId] of Object.entries(branchSelections)) {
//     const decisionNode = getNodeById(nodes, decisionNodeId);

//     if (!decisionNode) {
//       continue;
//     }

//     const choice = decisionNode.data.choices?.find(
//       (candidateChoice) => candidateChoice.choiceId === choiceId,
//     );

//     if (!choice) {
//       continue;
//     }

//     const stateEffects = inferStateEffectsFromChoice(decisionNodeId, choice);

//     nextSceneState = mergeSceneStateEntries(
//       nextSceneState,
//       stateEffects,
//       'AtSliceStart',
//       decisionNodeId,
//     );
//   }

//   return nextSceneState;
// }

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

// function applyBranchSelectionsToContext(
//   context: LearningTraversalContext,
//   branchSelections: BranchSelections | undefined,
//   nodes: Node<AuthoringNodeData>[],
// ) {
//   const nextContext = cloneContext(context);

//   if (!branchSelections) {
//     return nextContext;
//   }

//   nextContext.branchSelections = {
//     ...nextContext.branchSelections,
//     ...branchSelections,
//   };

//   nextContext.sceneState = compileWrappedSceneStateFromBranchSelections(
//     branchSelections,
//     nodes,
//     nextContext.sceneState,
//   );

//   return nextContext;
// }

function appendEndNodeIfNeeded(
  pathNodeIds: string[],
  endNodeId: string,
) {
  if (pathNodeIds[pathNodeIds.length - 1] === endNodeId) {
    return pathNodeIds;
  }

  return [...pathNodeIds, endNodeId];
}

function resetForContinuation(): LearningTraversalContext {
  return {
    // Important:
    // A new learning slice/chapter starts fresh.
    // Previous chapter branch selections should not affect the next chapter.
    branchSelections: {},

    // Important:
    // A new learning slice should describe its own scene setup.
    // Do not carry previous chapter scene state into the next generated slice.
    sceneState: {},

    decisionRules: {},
    notificationRules: {},

    pathNodeIds: [],
    visited: new Set<string>(),

    isAfterContextPatch: false,
  };
}

// function createBranchSelectionKey(nodeId: string, choiceId: string) {
//   return `${nodeId}=${choiceId}`;
// }

// function getCoveredBranchSelectionKeys(slices: LearningSlice[]) {
//   const coveredKeys = new Set<string>();

//   for (const slice of slices) {
//     for (const rule of Object.values(slice.notificationRules)) {
//       const branchSelections = rule.contextPatch?.branchSelections;

//       if (!branchSelections) {
//         continue;
//       }

//       for (const [nodeId, choiceId] of Object.entries(branchSelections)) {
//         coveredKeys.add(createBranchSelectionKey(nodeId, choiceId));
//       }
//     }
//   }

//   return coveredKeys;
// }

// function sliceHasCoveredInitialBranchSelection(
//   slice: LearningSlice,
//   coveredKeys: Set<string>,
// ) {
//   return Object.entries(slice.branchSelections).some(([nodeId, choiceId]) =>
//     coveredKeys.has(createBranchSelectionKey(nodeId, choiceId)),
//   );
// }

// function notificationRuleCoversKey(
//   ruleBranchSelections: Record<string, string> | undefined,
//   coveredKey: string,
// ) {
//   if (!ruleBranchSelections) {
//     return false;
//   }

//   return Object.entries(ruleBranchSelections).some(
//     ([nodeId, choiceId]) =>
//       createBranchSelectionKey(nodeId, choiceId) === coveredKey,
//   );
// }

// function sliceContainsCoveringNotificationRule(
//   slice: LearningSlice,
//   coveredKeys: Set<string>,
// ) {
//   for (const rule of Object.values(slice.notificationRules)) {
//     const ruleBranchSelections = rule.contextPatch?.branchSelections;

//     for (const coveredKey of coveredKeys) {
//       if (notificationRuleCoversKey(ruleBranchSelections, coveredKey)) {
//         return true;
//       }
//     }
//   }

//   return false;
// }

// TO BE RETIRED
// function filterLearningSlicesCoveredByNotifications(slices: LearningSlice[]) {
//   const coveredKeys = getCoveredBranchSelectionKeys(slices);

//   if (coveredKeys.size === 0) {
//     return slices;
//   }

//   return slices.filter((slice) => {
//     const isCoveredStandaloneBranch =
//       sliceHasCoveredInitialBranchSelection(slice, coveredKeys);

//     if (!isCoveredStandaloneBranch) {
//       return true;
//     }

//     // Keep the teaching slice that actually contains the contextPatch
//     // covering this branch.
//     if (sliceContainsCoveringNotificationRule(slice, coveredKeys)) {
//       return true;
//     }

//     // Remove standalone branch slices already taught via a notification patch.
//     return false;
//   });
// }

function getNotificationNodeForChoice(
  decisionNode: Node<AuthoringNodeData>,
  choice: AuthoringChoiceData,
  nodes: Node<AuthoringNodeData>[],
  edges: Edge[],
) {
  const nextNodeId = getNextNodeIdFromHandle(
    decisionNode.id,
    choice.choiceId,
    edges,
  );

  if (!nextNodeId) {
    return undefined;
  }

  const nextNode = getNodeById(nodes, nextNodeId);

  if (nextNode?.data.kind !== 'notification') {
    return undefined;
  }

  return nextNode;
}

function getCoveredChoiceIdsForDecision(
  decisionNode: Node<AuthoringNodeData>,
  nodes: Node<AuthoringNodeData>[],
  edges: Edge[],
) {
  const coveredChoiceIds = new Set<string>();
  const choices = decisionNode.data.choices ?? [];

  for (const choice of choices) {
    const notificationNode = getNotificationNodeForChoice(
      decisionNode,
      choice,
      nodes,
      edges,
    );

    const patchedChoiceId =
      notificationNode?.data.contextPatch?.branchSelections?.[decisionNode.id];

    if (!patchedChoiceId) {
      continue;
    }

    if (patchedChoiceId === choice.choiceId) {
      continue;
    }

    coveredChoiceIds.add(patchedChoiceId);
  }

  return coveredChoiceIds;
}

function getLearningChoicesForDecision(
  decisionNode: Node<AuthoringNodeData>,
  nodes: Node<AuthoringNodeData>[],
  edges: Edge[],
) {
  const choices = decisionNode.data.choices ?? [];
  const coveredChoiceIds = getCoveredChoiceIdsForDecision(
    decisionNode,
    nodes,
    edges,
  );

  if (coveredChoiceIds.size === 0) {
    return choices;
  }

  const filteredChoices = choices.filter(
    (choice) => !coveredChoiceIds.has(choice.choiceId),
  );

  if (filteredChoices.length === 0) {
    console.warn(
      `All choices were filtered for ${decisionNode.id}. Falling back to all choices.`,
    );

    return choices;
  }

  return filteredChoices;
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
      const choices = getLearningChoicesForDecision(node, nodes, edges);

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
      const endNodeId = getEndNodeId(nodes);
      const contextPatchBranchSelections =
        node.data.contextPatch?.branchSelections;

      const contextPatchSceneState = compileRawSceneStateFromBranchSelections(
        contextPatchBranchSelections,
        nodes,
      );

      const redirectNodeId =
        getRedirectNodeIdFromContextPatch(
          contextPatchBranchSelections,
          nodes,
          edges,
        ) ?? getNextNodeIdFromHandle(node.id, 'next', edges);

      const hasContextPatch =
        Boolean(contextPatchBranchSelections) &&
        Object.keys(contextPatchBranchSelections ?? {}).length > 0;

      const isLearningBreakPoint =
        Boolean(node.data.learningBreakTitle?.trim());

      const nextContext = cloneContext(currentContext);

      nextContext.notificationRules[node.id] = {
        nextNodeId: isLearningBreakPoint ? endNodeId : redirectNodeId,
        contextPatch: hasContextPatch
          ? {
              branchSelections: contextPatchBranchSelections,
              sceneState: contextPatchSceneState,
            }
          : undefined,
      };

      if (isLearningBreakPoint) {
        const endingContext = cloneContext(nextContext);

        endingContext.pathNodeIds = appendEndNodeIfNeeded(
          endingContext.pathNodeIds,
          endNodeId,
        );

        const endingSlice = createLearningSlice(
          endingContext,
          startNodeId,
          node.data.learningBreakTitle,
        );

        if (!redirectNodeId) {
          return [endingSlice];
        }

        const continuationContext = resetForContinuation();
        
        const continuationSlices = traverseLearningPath(
          redirectNodeId,
          nodes,
          edges,
          continuationContext,
          redirectNodeId,
        );

        return [endingSlice, ...continuationSlices];
      }

      nextContext.isAfterContextPatch =
        nextContext.isAfterContextPatch || hasContextPatch;

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

  const slices = traverseLearningPath(
    startNodeId,
    nodes,
    edges,
    initialContext,
    startNodeId,
  );

  return {
    scenarioId,
    mode: 'learning',
    generatedAt: new Date().toISOString(),
    slices,
  };
}
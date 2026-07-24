import type { Edge, Node } from '@xyflow/react';
import type { AuthoringNodeData } from './authoringTypes';
import type {
  RuntimeScenarioChoiceDef,
  RuntimeScenarioDefinition,
  RuntimeScenarioNodeDef,
} from './runtimeTypes';
import { inferStateEffectsFromChoice } from './stateInference';

export type ScenarioMetadata = {
  scenarioId: string;
  title: string;
  version: string;
  language: string;
  domain: string;
  description: string;
  startNodeId: string;
};

// function getOutgoingEdges(nodeId: string, edges: Edge[]) {
//   return edges.filter((edge) => edge.source === nodeId);
// }

function getNextNodeIdFromHandle(
  nodeId: string,
  handleId: string,
  edges: Edge[],
) {
  return edges.find(
    (edge) => edge.source === nodeId && edge.sourceHandle === handleId,
  )?.target;
}

// function getSingleNextNodeId(nodeId: string, edges: Edge[]) {
//   const outgoingEdges = getOutgoingEdges(nodeId, edges);

//   if (outgoingEdges.length === 0) {
//     return undefined;
//   }

//   return outgoingEdges[0].target;
// }

function compileActionNode(
  node: Node<AuthoringNodeData>,
  edges: Edge[],
): RuntimeScenarioNodeDef {
  const data = node.data;

  return {
    id: node.id,
    type: 'ActionNode',

    titleKey: data.titleKey || undefined,
    promptKey: data.promptKey || undefined,
    instructionKey: data.instructionKey || undefined,

    iconKeys: data.iconKeys ?? [],

    requiredInput: {
      eventType: data.eventType ?? '',
      targetId: data.targetId ?? '',
      interactionType: data.interactionType ?? '',
      minimumDurationSeconds: data.minimumDurationSeconds ?? 0,
    },

    nextNodeId: getNextNodeIdFromHandle(node.id, 'next', edges),

    assessmentTags: data.assessmentTags ?? [],
  };
}

function compileDecisionNode(
  node: Node<AuthoringNodeData>,
  edges: Edge[],
): RuntimeScenarioNodeDef {
  const data = node.data;

  const choices: RuntimeScenarioChoiceDef[] = (data.choices ?? []).map(
  (choice) => {
      const stateEffects = inferStateEffectsFromChoice(node.id, choice);

      return {
      choiceId: choice.choiceId,
      labelKey: choice.labelKey || undefined,
      styleKey: choice.styleKey || undefined,
      iconKey: choice.iconKey || undefined,
      nextNodeId: getNextNodeIdFromHandle(node.id, choice.choiceId, edges),
      stateEffects,
      };
  },
  );

  return {
    id: node.id,
    type: 'DecisionNode',

    titleKey: data.titleKey || undefined,
    promptKey: data.promptKey || undefined,
    instructionKey: data.instructionKey || undefined,

    iconKeys: data.iconKeys ?? [],

    choices,
    choicesTitleKey: data.choicesTitleKey || undefined,

    assessmentTags: data.assessmentTags ?? [],
  };
}

function compileNotificationNode(
  node: Node<AuthoringNodeData>,
  edges: Edge[],
): RuntimeScenarioNodeDef {
  const data = node.data;

  return {
    id: node.id,
    type: 'NotificationNode',

    titleKey: data.titleKey || undefined,
    promptKey: data.promptKey || undefined,
    instructionKey: data.instructionKey || undefined,

    iconKeys: data.iconKeys ?? [],

    nextNodeId: getNextNodeIdFromHandle(node.id, 'next', edges),

    contextPatch: data.contextPatch,

    assessmentTags: data.assessmentTags ?? [],
  };
}

function compileEndNode(node: Node<AuthoringNodeData>): RuntimeScenarioNodeDef {
  const data = node.data;

  return {
    id: node.id,
    type: 'EndNode',

    titleKey: data.titleKey || undefined,
    promptKey: data.promptKey || undefined,
    instructionKey: data.instructionKey || undefined,

    iconKeys: data.iconKeys ?? [],

    assessmentTags: data.assessmentTags ?? [],
  };
}

function compileNode(
  node: Node<AuthoringNodeData>,
  edges: Edge[],
): RuntimeScenarioNodeDef {
  switch (node.data.kind) {
    case 'action':
      return compileActionNode(node, edges);

    case 'yesNoDecision':
    case 'dialogueDecision':
      return compileDecisionNode(node, edges);

    case 'notification':
      return compileNotificationNode(node, edges);

    case 'end':
      return compileEndNode(node);

    default:
      throw new Error(`Unsupported node kind: ${String(node.data.kind)}`);
  }
}

export function compileScenarioDefinition(
  nodes: Node<AuthoringNodeData>[],
  edges: Edge[],
  metadata: ScenarioMetadata,
): RuntimeScenarioDefinition {
  const runtimeNodes = nodes.map((node) => compileNode(node, edges));

  return {
    scenarioId: metadata.scenarioId,
    title: metadata.title,
    version: metadata.version,
    language: metadata.language,
    domain: metadata.domain,
    description: metadata.description,
    startNodeId: metadata.startNodeId,
    nodes: runtimeNodes,
  };
}
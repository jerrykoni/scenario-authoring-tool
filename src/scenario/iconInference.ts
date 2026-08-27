import type { AuthoringChoiceData } from './authoringTypes';

const DECISION_NODE_PREFIX_PATTERN = /^(?:d|q|question|decision)_/;

function stripDecisionNodePrefix(nodeId: string) {
  return nodeId.replace(DECISION_NODE_PREFIX_PATTERN, '');
}

export function inferChoiceIconKey(
  nodeId: string,
  choice: AuthoringChoiceData,
  choiceIndex: number,
) {
  const stem = stripDecisionNodePrefix(nodeId);

  if (choice.choiceId === 'yes') {
    return `icon.${stem}`;
  }

  if (choice.choiceId === 'no') {
    return `icon.not_${stem}`;
  }

  return `icon.${choiceIndex + 1}.${stem}`;
}
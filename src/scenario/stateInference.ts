import type {
  AuthoringChoiceData,
  StateEffects,
} from './authoringTypes';

// Adjust these keys to match your Unity runtime state names.
const STATE_KEY_OVERRIDES: Record<string, string> = {
  q_is_standing_or_walking: 'isStandingOrWalking',
  q_does_casualty_respond: 'responds',
};

function hasStateEffects(stateEffects?: StateEffects) {
  return Boolean(stateEffects && Object.keys(stateEffects).length > 0);
}

function toPascalCaseFromSnake(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function toCamelCaseFromSnake(value: string) {
  const pascal = toPascalCaseFromSnake(value);

  if (!pascal) {
    return value;
  }

  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function inferStateKeyFromDecisionNodeId(nodeId: string) {
  if (STATE_KEY_OVERRIDES[nodeId]) {
    return STATE_KEY_OVERRIDES[nodeId];
  }

  const withoutPrefix = nodeId
    .replace(/^q_/, '')
    .replace(/^question_/, '')
    .replace(/^decision_/, '');

  return toCamelCaseFromSnake(withoutPrefix);
}

export function inferStateEffectsFromChoice(
  nodeId: string,
  choice: AuthoringChoiceData,
): StateEffects | undefined {
  if (hasStateEffects(choice.stateEffects)) {
    return choice.stateEffects;
  }

  if (choice.choiceId !== 'yes' && choice.choiceId !== 'no') {
    return undefined;
  }

  const stateKey = inferStateKeyFromDecisionNodeId(nodeId);

  return {
    [stateKey]: choice.choiceId === 'yes',
  };
}
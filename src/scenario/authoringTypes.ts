export type AuthoringNodeKind =
  | 'action'
  | 'yesNoDecision'
  | 'dialogueDecision'
  | 'notification'
  | 'end';

export type AuthoringChoiceData = {
  choiceId: string;
  labelKey?: string;
  styleKey?: string;
  iconKey?: string;
};

export type AuthoringNodeData = {
  kind: AuthoringNodeKind;

  // Editor display label. This is mainly for the graph card.
  title: string;

  // These map to your ScenarioNodeDef keys.
  titleKey?: string;
  promptKey?: string;
  instructionKey?: string;

  iconKeys?: string[];

  // ActionNode only.
  eventType?: string;
  targetId?: string;
  interactionType?: string;
  minimumDurationSeconds?: number;

  // DecisionNode only.
  choicesTitleKey?: string;
  choices?: AuthoringChoiceData[];

  // Future nodes, optional.
  outcomeId?: string;
  endScenario?: boolean;
  durationSeconds?: number;

  assessmentTags?: string[];
};

export type ScenarioNodeType =
  | 'actionNode'
  | 'yesNoDecisionNode'
  | 'dialogueDecisionNode'
  | 'notificationNode'
  | 'endNode';
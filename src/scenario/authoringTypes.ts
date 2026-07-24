export type AuthoringNodeKind =
  | 'action'
  | 'yesNoDecision'
  | 'dialogueDecision'
  | 'notification'
  | 'end';

export type PrimitiveStateValue = string | number | boolean;

export type StateEffects = Record<string, PrimitiveStateValue>;

export type BranchSelections = Record<string, string>;

export type ContextPatch = {
  branchSelections?: BranchSelections;
};

export type AuthoringChoiceData = {
  choiceId: string;
  labelKey?: string;
  styleKey?: string;
  iconKey?: string;

  // Optional. If empty, the generator will try naming convention inference.
  stateEffects?: StateEffects;
};

export type AuthoringNodeData = {
  kind: AuthoringNodeKind;

  // Editor display title for the card.
  title: string;

  // Maps to ScenarioNodeDef localization keys.
  titleKey?: string;
  promptKey?: string;
  instructionKey?: string;

  iconKeys?: string[];

  // ActionNode.
  eventType?: string;
  targetId?: string;
  interactionType?: string;
  minimumDurationSeconds?: number;

  // DecisionNode.
  choicesTitleKey?: string;
  choices?: AuthoringChoiceData[];

  // NotificationNode.
  contextPatch?: ContextPatch;

  // Future optional fields.
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
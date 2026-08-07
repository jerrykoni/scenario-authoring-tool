export type AuthoringNodeKind =
  | 'action'
  | 'yesNoDecision'
  | 'dialogueDecision'
  | 'notification'
  | 'end';

export type PrimitiveStateValue = string | number | boolean;

export type StateEffects = Record<string, PrimitiveStateValue>;

export type BranchSelections = Record<string, string>;

export type StateApplyTiming = 'AtSliceStart' | 'OnSourceNodeReached';

export type ContextPatch = {
  branchSelections?: BranchSelections;
};

export type AuthoringChoiceData = {
  choiceId: string;
  labelKey?: string;
  styleKey?: string;
  iconKey?: string;

  // Optional. If empty, generator tries naming convention inference.
  stateEffects?: StateEffects;

  // Optional. If empty, generator chooses a default.
  stateApplyTiming?: StateApplyTiming;
};

export type AuthoringNodeData = {
  kind: AuthoringNodeKind;

  title: string;

  titleKey?: string;
  promptKey?: string;
  instructionKey?: string;

  iconKeys?: string[];

  eventType?: string;
  targetId?: string;
  interactionType?: string;
  minimumDurationSeconds?: number;

  choicesTitleKey?: string;
  choices?: AuthoringChoiceData[];

  contextPatch?: ContextPatch;

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
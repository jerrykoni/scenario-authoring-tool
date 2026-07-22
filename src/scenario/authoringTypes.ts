export type AuthoringNodeKind =
  | 'observe'
  | 'action'
  | 'yesNoDecision'
  | 'assignOutcome'
  | 'timer'
  | 'end';

export type AuthoringNodeData = {
  kind: AuthoringNodeKind;

  title: string;
  text?: string;

  targetId?: string;
  interactionType?: string;

  outcomeId?: string;
  durationSeconds?: number;

  assessmentTags?: string[];

  presentationTemplate?: string;
};

export type ScenarioNodeType =
  | 'observeNode'
  | 'actionNode'
  | 'yesNoDecisionNode'
  | 'endNode';

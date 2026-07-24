export type RuntimeNodeType =
  | 'ActionNode'
  | 'DecisionNode'
  | 'NotificationNode'
  | 'EndNode';

export type RuntimeScenarioDefinition = {
  scenarioId: string;
  title: string;
  version: string;
  language: string;
  domain: string;
  description: string;
  startNodeId: string;
  nodes: RuntimeScenarioNodeDef[];
};

export type RuntimeScenarioNodeDef = {
  id: string;
  type: RuntimeNodeType;

  titleKey?: string;
  promptKey?: string;
  instructionKey?: string;

  iconKeys?: string[];

  requiredInput?: RuntimeRequiredInputDef;

  choices?: RuntimeScenarioChoiceDef[];
  choicesTitleKey?: string;

  nextNodeId?: string;

  assessmentTags?: string[];

  contextPatch?: RuntimeContextPatch;
};

export type RuntimeScenarioChoiceDef = {
  choiceId: string;
  labelKey?: string;
  styleKey?: string;
  iconKey?: string;
  nextNodeId?: string;
  stateEffects?: Record<string, string | number | boolean>;
};

export type RuntimeRequiredInputDef = {
  eventType: string;
  targetId: string;
  interactionType: string;
  minimumDurationSeconds?: number;
};

export type RuntimeContextPatch = {
  branchSelections?: Record<string, string>;
};
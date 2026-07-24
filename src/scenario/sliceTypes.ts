export type PracticeSlicePackage = {
  scenarioId: string;
  mode: 'practice';
  generatedAt: string;
  slices: PracticeSlice[];
};

export type PracticeSlice = {
  sliceId: string;
  mode: 'practice';
  title: string;
  branchSelections: Record<string, string>;
  sceneState: Record<string, string | number | boolean>;
  steps: PracticeStep[];
};

export type PracticeStep = {
  nodeId: string;
};

export type LearningSlicePackage = {
  scenarioId: string;
  mode: 'learning';
  generatedAt: string;
  slices: LearningSlice[];
};

export type LearningSlice = {
  sliceId: string;
  mode: 'learning';
  title: string;
  startNodeId: string;

  branchSelections: Record<string, string>;
  sceneState: Record<string, string | number | boolean>;

  decisionRules: Record<string, LearningDecisionRule>;
  notificationRules: Record<string, LearningNotificationRule>;

  pathNodeIds: string[];
};

export type LearningDecisionRule = {
  correctChoiceId: string;
  stateEffects?: Record<string, string | number | boolean>;
};

export type LearningNotificationRule = {
  nextNodeId?: string;
  contextPatch?: {
    branchSelections?: Record<string, string>;
    sceneState?: Record<string, string | number | boolean>;
  };
};
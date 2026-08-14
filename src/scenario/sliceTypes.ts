export type PrimitiveSliceStateValue = string | number | boolean;

export type SliceStateApplyTiming =
  | 'AtSliceStart'
  | 'OnSourceNodeReached';

export type SliceSceneStateEntry = {
  value: PrimitiveSliceStateValue;
  applyTiming: SliceStateApplyTiming;
  sourceNodeId: string;
};

export type SliceSceneState = Record<string, SliceSceneStateEntry>;

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
  sceneState: SliceSceneState;
  steps: PracticeStep[];
};

export type PracticeLoopInfo = {
  /**
   * Indicates that the step is the point where the path re-enters an earlier node.
   * The runtime can use this to reconstruct a loop without generating a new slice.
   */
  startsLoop: boolean;
  /**
   * Node that this step loops back to. This is the step that the loop points at.
   */
  targetNodeId?: string;
};

export type PracticeStep = {
  nodeId: string;
  stateRevealNodeIds: string[];
  /**
   * Optional loop metadata for steps that trigger a backward-edge traversal.
   * This preserves loop intent without creating redundant practice slices.
   */
  loop?: PracticeLoopInfo;
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
  sceneState: SliceSceneState;

  decisionRules: Record<string, LearningDecisionRule>;
  notificationRules: Record<string, LearningNotificationRule>;

  pathNodeIds: string[];
};

export type LearningDecisionRule = {
  correctChoiceId: string;
};

export type LearningNotificationRule = {
  nextNodeId?: string;
  contextPatch?: {
    branchSelections?: Record<string, string>;

    // raw/simple inside notification contextPatch for now
    sceneState?: Record<string, PrimitiveSliceStateValue>;
  };
};
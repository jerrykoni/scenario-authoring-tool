import type {
  StateApplyTiming,
  StateEffects,
} from './authoringTypes';
import type {
  SliceSceneState,
  SliceStateApplyTiming,
} from './sliceTypes';

export function mergeSceneStateEntries(
  currentSceneState: SliceSceneState,
  stateEffects: StateEffects | undefined,
  applyTiming: StateApplyTiming,
  sourceNodeId: string,
): SliceSceneState {
  if (!stateEffects || Object.keys(stateEffects).length === 0) {
    return currentSceneState;
  }

  const nextSceneState: SliceSceneState = {
    ...currentSceneState,
  };

  for (const [key, value] of Object.entries(stateEffects)) {
    nextSceneState[key] = {
      value,
      applyTiming: applyTiming as SliceStateApplyTiming,
      sourceNodeId,
    };
  }

  return nextSceneState;
}

export function unwrapSceneStateValues(
  sceneState: SliceSceneState,
): Record<string, string | number | boolean> {
  const rawSceneState: Record<string, string | number | boolean> = {};

  for (const [key, entry] of Object.entries(sceneState)) {
    rawSceneState[key] = entry.value;
  }

  return rawSceneState;
}
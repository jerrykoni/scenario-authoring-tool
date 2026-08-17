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
    const previousEntry = currentSceneState[key];
    
    // If this key already exists, preserve its history
    const history = previousEntry?.history ?? [];
    if (previousEntry) {
      history.push({
        value: previousEntry.value,
        applyTiming: previousEntry.applyTiming,
        sourceNodeId: previousEntry.sourceNodeId,
      });
    }

    nextSceneState[key] = {
      value,
      applyTiming: applyTiming as SliceStateApplyTiming,
      sourceNodeId,
      history: history.length > 0 ? history : undefined,
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
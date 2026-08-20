import { useEffect, useState } from 'react';
import type { Node } from '@xyflow/react';
import type {
  AuthoringChoiceData,
  AuthoringNodeData,
  BranchSelections,
  StateEffects,
} from '../scenario/authoringTypes';
import { getBaseNodeId } from '../scenario/nodeIdUtils';

type InspectorPanelProps = {
  selectedNode: Node<AuthoringNodeData> | null;
  onUpdateNodeData: (
    nodeId: string,
    updatedData: Partial<AuthoringNodeData>,
  ) => void;
  onRenameNodeIdFromTitle: (nodeId: string) => void;
};

function listToText(values?: string[]) {
  return values?.join('; ') ?? '';
}

function textToList(value: string) {
  return value
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePrimitiveValue(value: string) {
  const trimmed = value.trim();

  if (trimmed.toLowerCase() === 'true') {
    return true;
  }

  if (trimmed.toLowerCase() === 'false') {
    return false;
  }

  const numericValue = Number(trimmed);

  if (!Number.isNaN(numericValue) && trimmed !== '') {
    return numericValue;
  }

  return trimmed;
}

function stateEffectsToText(stateEffects?: StateEffects) {
  if (!stateEffects) {
    return '';
  }

  return Object.entries(stateEffects)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(', ');
}

function textToStateEffects(value: string): StateEffects | undefined {
  const entries = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [key, rawValue] = entry.split('=').map((part) => part.trim());

      if (!key || rawValue === undefined) {
        return null;
      }

      return [key, parsePrimitiveValue(rawValue)] as const;
    })
    .filter(Boolean) as Array<readonly [string, string | number | boolean]>;

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

function choicesToText(choices?: AuthoringChoiceData[]) {
  return (
    choices
      ?.map((choice) =>
        [
          choice.choiceId,
          choice.labelKey ?? '',
          choice.styleKey ?? '',
          choice.iconKey ?? '',
          stateEffectsToText(choice.stateEffects),
          choice.stateApplyTiming ?? '',
        ].join('; '),
      )
      .join('\n') ?? ''
  );
}

function textToChoices(value: string): AuthoringChoiceData[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [
        choiceId,
        labelKey,
        styleKey,
        iconKey,
        stateEffectsText,
        stateApplyTiming,
      ] = line.split(';').map((part) => part.trim());

      return {
        choiceId,
        labelKey,
        styleKey,
        iconKey,
        stateEffects: textToStateEffects(stateEffectsText ?? ''),
        // Narrow to the expected typed literal union
        stateApplyTiming:
          stateApplyTiming === 'AtSliceStart' ||
          stateApplyTiming === 'OnSourceNodeReached'
            ? (stateApplyTiming as AuthoringChoiceData['stateApplyTiming'])
            : undefined,
      };
    })
    .filter((choice) => Boolean(choice.choiceId));
}

function branchSelectionsToText(branchSelections?: BranchSelections) {
  if (!branchSelections) {
    return '';
  }

  return Object.entries(branchSelections)
    .map(([nodeId, choiceId]) => `${nodeId} = ${choiceId}`)
    .join('\n');
}

function textToBranchSelections(value: string): BranchSelections | undefined {
  const entries = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [nodeId, choiceId] = line.split('=').map((part) => part.trim());

      if (!nodeId || !choiceId) {
        return null;
      }

      return [nodeId, choiceId] as const;
    })
    .filter(Boolean) as Array<readonly [string, string]>;

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

export function InspectorPanel({
  selectedNode,
  onUpdateNodeData,
  onRenameNodeIdFromTitle,
}: InspectorPanelProps) {
  const [assessmentTagsText, setAssessmentTagsText] = useState('');
  const [iconKeysText, setIconKeysText] = useState('');
  const [choicesText, setChoicesText] = useState('');
  const [contextPatchText, setContextPatchText] = useState('');

  useEffect(() => {
    if (!selectedNode) {
      setAssessmentTagsText('');
      setIconKeysText('');
      setChoicesText('');
      setContextPatchText('');
      return;
    }

    setAssessmentTagsText(listToText(selectedNode.data.assessmentTags));
    setIconKeysText(listToText(selectedNode.data.iconKeys));
    setChoicesText(choicesToText(selectedNode.data.choices));
    setContextPatchText(
      branchSelectionsToText(selectedNode.data.contextPatch?.branchSelections),
    );
  }, [selectedNode?.id]);

  if (!selectedNode) {
    return (
      <aside className="inspector-panel">
        <h2>Inspector</h2>
        <p className="inspector-empty">Select a node to edit its properties.</p>
      </aside>
    );
  }

  const selectedNodeId = selectedNode.id;
  const data = selectedNode.data;

  function updateField<K extends keyof AuthoringNodeData>(
    field: K,
    value: AuthoringNodeData[K],
  ) {
    onUpdateNodeData(selectedNodeId, {
      [field]: value,
    });
  }

  function updateAssessmentTags(value: string) {
    setAssessmentTagsText(value);
    updateField('assessmentTags', textToList(value));
  }

  function updateIconKeys(value: string) {
    setIconKeysText(value);
    updateField('iconKeys', textToList(value));
  }

  function updateChoices(value: string) {
    setChoicesText(value);
    updateField('choices', textToChoices(value));
  }

  function updateContextPatch(value: string) {
    setContextPatchText(value);

    const branchSelections = textToBranchSelections(value);

    updateField('contextPatch', {
      branchSelections,
    });
  }

  return (
    <aside className="inspector-panel">
      <h2>Inspector</h2>

      <div className="inspector-section">
        <label>
          Node ID
          <input value={selectedNode.id} disabled />
        </label>

        <label>
          Kind
          <input value={data.kind} disabled />
        </label>

        <label>
          Editor Title
          <input
            value={data.title}
            onChange={(event) => updateField('title', event.target.value)}
            onBlur={() => onRenameNodeIdFromTitle(selectedNodeId)}
          />
        </label>
      </div>

      <div className="inspector-section">
        <h3>Localization Keys</h3>

        <label>
          Title Key
          <input
            value={data.titleKey ?? ''}
            onChange={(event) => updateField('titleKey', event.target.value)}
            placeholder={`${getBaseNodeId(selectedNode.id)}_title`}
          />
        </label>

        <label>
          Prompt Key
          <input
            value={data.promptKey ?? ''}
            onChange={(event) => updateField('promptKey', event.target.value)}
            placeholder={`${getBaseNodeId(selectedNode.id)}_prompt`}
          />
        </label>

        <label>
          Instruction Key
          <input
            value={data.instructionKey ?? ''}
            onChange={(event) =>
              updateField('instructionKey', event.target.value)
            }
            placeholder={`${getBaseNodeId(selectedNode.id)}_instruction`}
          />
        </label>
      </div>

      <div className="inspector-section">
        <h3>Icons</h3>

        <label>
          Icon Keys, separated by semicolons
          <textarea
            value={iconKeysText}
            onChange={(event) => updateIconKeys(event.target.value)}
            rows={2}
            placeholder="icon.walking; icon.responding"
          />
        </label>
      </div>

      {data.kind === 'action' && (
        <div className="inspector-section">
          <h3>Required Input</h3>

          <label>
            Event Type
            <input
              value={data.eventType ?? ''}
              onChange={(event) => updateField('eventType', event.target.value)}
              placeholder="ObjectInspected or ActionPerformed"
            />
          </label>

          <label>
            Target ID
            <input
              value={data.targetId ?? ''}
              onChange={(event) => updateField('targetId', event.target.value)}
              placeholder="subject.casualty"
            />
          </label>

          <label>
            Interaction Type
            <input
              value={data.interactionType ?? ''}
              onChange={(event) =>
                updateField('interactionType', event.target.value)
              }
              placeholder="look"
            />
          </label>

          <label>
            Minimum Duration Seconds
            <input
              type="number"
              value={data.minimumDurationSeconds ?? 0}
              onChange={(event) =>
                updateField(
                  'minimumDurationSeconds',
                  Number(event.target.value),
                )
              }
            />
          </label>
        </div>
      )}

      {(data.kind === 'yesNoDecision' ||
        data.kind === 'dialogueDecision') && (
        <div className="inspector-section">
          <h3>Choices</h3>

          <label>
            Choices Title Key
            <input
              value={data.choicesTitleKey ?? ''}
              onChange={(event) =>
                updateField('choicesTitleKey', event.target.value)
              }
              placeholder="optional"
            />
          </label>

          <label>
            Choices
            <textarea
              value={choicesText}
              onChange={(event) => updateChoices(event.target.value)}
              rows={7}
              placeholder={
              'choiceId; labelKey; styleKey; iconKey; stateEffects; applyTiming\n' +
              'yes; Yes; positive; icon.walking; isStandingOrWalking=true; AtSliceStart\n' +
              'no; No; negative; icon.not_walking; isStandingOrWalking=false; AtSliceStart'
              }
            />
          </label>

        <p className="inspector-help">
          Each line is: choiceId; labelKey; styleKey; iconKey; stateEffects;
          applyTiming. State effects are optional. Apply timing is optional and can be
          AtSliceStart or OnSourceNodeReached.
        </p>
        </div>
      )}

      {data.kind === 'notification' && (
        <div className="inspector-section">
          <h3>Learning Breakpoint</h3>

          <label>
            Learning Break Title
            <input
              value={data.learningBreakTitle ?? ''}
              onChange={(event) =>
                updateField('learningBreakTitle', event.target.value)
              }
              placeholder="Example: Defibrillator Placement"
            />
          </label>

          <p className="inspector-help">
            If this field is filled, learning slice generation ends the current slice
            at this notification and starts a new learning slice from the continuation.
          </p>

          <h3>Context Patch</h3>

          <label>
            Branch selections to apply after this notification
            <textarea
              value={contextPatchText}
              onChange={(event) => updateContextPatch(event.target.value)}
              rows={4}
              placeholder={'q_is_standing_or_walking = no'}
            />
          </label>

          <p className="inspector-help">
            Each line is: decisionNodeId = choiceId. The exporter will infer sceneState
            from these branch selections.
          </p>
        </div>
      )}

      <div className="inspector-section">
        <h3>Assessment Tags</h3>

        <label>
          Tags, separated by semicolons
          <textarea
            value={assessmentTagsText}
            onChange={(event) => updateAssessmentTags(event.target.value)}
            rows={3}
            placeholder="required_action; sequence_critical"
          />
        </label>
      </div>
    </aside>
  );
}
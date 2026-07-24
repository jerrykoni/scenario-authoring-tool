import { useEffect, useState } from 'react';
import type { Node } from '@xyflow/react';
import type {
  AuthoringChoiceData,
  AuthoringNodeData,
} from '../scenario/authoringTypes';

type InspectorPanelProps = {
  selectedNode: Node<AuthoringNodeData> | null;
  onUpdateNodeData: (
    nodeId: string,
    updatedData: Partial<AuthoringNodeData>,
  ) => void;
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

function choicesToText(choices?: AuthoringChoiceData[]) {
  return (
    choices
      ?.map((choice) =>
        [
          choice.choiceId,
          choice.labelKey ?? '',
          choice.styleKey ?? '',
          choice.iconKey ?? '',
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
      const [choiceId, labelKey, styleKey, iconKey] = line
        .split(';')
        .map((part) => part.trim());

      return {
        choiceId,
        labelKey,
        styleKey,
        iconKey,
      };
    })
    .filter((choice) => Boolean(choice.choiceId));
}

export function InspectorPanel({
  selectedNode,
  onUpdateNodeData,
}: InspectorPanelProps) {
  const [assessmentTagsText, setAssessmentTagsText] = useState('');
  const [iconKeysText, setIconKeysText] = useState('');
  const [choicesText, setChoicesText] = useState('');

  useEffect(() => {
    if (!selectedNode) {
      setAssessmentTagsText('');
      setIconKeysText('');
      setChoicesText('');
      return;
    }

    setAssessmentTagsText(listToText(selectedNode.data.assessmentTags));
    setIconKeysText(listToText(selectedNode.data.iconKeys));
    setChoicesText(choicesToText(selectedNode.data.choices));
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
            placeholder={`${selectedNode.id}_title`}
          />
        </label>

        <label>
          Prompt Key
          <input
            value={data.promptKey ?? ''}
            onChange={(event) => updateField('promptKey', event.target.value)}
            placeholder={`${selectedNode.id}_prompt`}
          />
        </label>

        <label>
          Instruction Key
          <input
            value={data.instructionKey ?? ''}
            onChange={(event) =>
              updateField('instructionKey', event.target.value)
            }
            placeholder={`${selectedNode.id}_instruction`}
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
              rows={6}
              placeholder={
                'choiceId; labelKey; styleKey; iconKey\nyes; Yes; positive; icon.yes\nno; No; negative; icon.no'
              }
            />
          </label>

          <p className="inspector-help">
            Each line is: choiceId; labelKey; styleKey; iconKey. The choiceId
            becomes the output handle ID.
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
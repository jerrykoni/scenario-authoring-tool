import { useEffect, useState } from 'react';
import type { Node } from '@xyflow/react';
import type { AuthoringNodeData } from '../scenario/authoringTypes';

type InspectorPanelProps = {
  selectedNode: Node<AuthoringNodeData> | null;
  onUpdateNodeData: (
    nodeId: string,
    updatedData: Partial<AuthoringNodeData>,
  ) => void;
};

function tagsToText(tags?: string[]) {
  return tags?.join('; ') ?? '';
}

function textToTags(value: string) {
  return value
    .split(';')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function InspectorPanel({
  selectedNode,
  onUpdateNodeData,
}: InspectorPanelProps) {
  const [tagsText, setTagsText] = useState('');

  useEffect(() => {
    if (!selectedNode) {
      setTagsText('');
      return;
    }

    setTagsText(tagsToText(selectedNode.data.assessmentTags));
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

  function updateTags(value: string) {
    setTagsText(value);
    updateField('assessmentTags', textToTags(value));
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
          Title
          <input
            value={data.title}
            onChange={(event) => updateField('title', event.target.value)}
          />
        </label>

        <label>
          Text / Prompt / Instruction
          <textarea
            value={data.text ?? ''}
            onChange={(event) => updateField('text', event.target.value)}
            rows={4}
          />
        </label>
      </div>

      {(data.kind === 'observe' || data.kind === 'action') && (
        <div className="inspector-section">
          <h3>Required Input</h3>

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
        </div>
      )}

      {data.kind === 'yesNoDecision' && (
        <div className="inspector-section">
          <h3>Decision Presentation</h3>

          <label>
            Presentation Template
            <input
              value={data.presentationTemplate ?? 'yes_no'}
              onChange={(event) =>
                updateField('presentationTemplate', event.target.value)
              }
            />
          </label>

          <p className="inspector-help">
            The yes/no choices will be generated automatically from the yes and
            no output handles.
          </p>
        </div>
      )}

      {data.kind === 'assignOutcome' && (
        <div className="inspector-section">
          <h3>Outcome</h3>

          <label>
            Outcome ID
            <input
              value={data.outcomeId ?? ''}
              onChange={(event) => updateField('outcomeId', event.target.value)}
              placeholder="green_card"
            />
          </label>
        </div>
      )}

      {data.kind === 'timer' && (
        <div className="inspector-section">
          <h3>Timer</h3>

          <label>
            Duration Seconds
            <input
              type="number"
              value={data.durationSeconds ?? 0}
              onChange={(event) =>
                updateField('durationSeconds', Number(event.target.value))
              }
            />
          </label>
        </div>
      )}

      <div className="inspector-section">
        <h3>Assessment Tags</h3>

        <label>
          Tags, separated by semicolons
          <textarea
            value={tagsText}
            onChange={(event) => updateTags(event.target.value)}
            rows={3}
            placeholder="required_action; sequence_critical"
          />
        </label>
      </div>
    </aside>
  );
}
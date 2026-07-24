import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { AuthoringNodeData } from '../scenario/authoringTypes';
import './nodeStyles.css';

export function DialogueDecisionNode({ data }: NodeProps) {
  const nodeData = data as AuthoringNodeData;
  const choices = nodeData.choices ?? [];

  return (
    <div className="scenario-node">
      <div className="scenario-node__header scenario-node__header--dialogue">
        Dialogue Decision
      </div>

      <div className="scenario-node__body">
        <div className="scenario-node__title">{nodeData.title}</div>

        <div className="scenario-node__meta">
          <div>
            <strong>runtime:</strong> DecisionNode
          </div>
          <div>
            <strong>choices:</strong> {choices.length}
          </div>
        </div>

        <div className="scenario-node__choice-list">
          {choices.map((choice, index) => (
            <div key={choice.choiceId} className="scenario-node__choice-row">
              {choice.choiceId}

              <Handle
                id={choice.choiceId}
                type="source"
                position={Position.Right}
                style={{
                  top: `${42 + index * 18}%`,
                }}
              />
            </div>
          ))}
        </div>

        {nodeData.assessmentTags && nodeData.assessmentTags.length > 0 && (
          <div className="scenario-node__tag-list">
            {nodeData.assessmentTags.map((tag) => (
              <span key={tag} className="scenario-node__tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Left} />
    </div>
  );
}
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { AuthoringNodeData } from '../scenario/authoringTypes';
import './nodeStyles.css';

export function ActionNode({ data }: NodeProps) {
  const nodeData = data as AuthoringNodeData;

  return (
    <div className="scenario-node">
      <div className="scenario-node__header scenario-node__header--action">
        Action
      </div>

      <div className="scenario-node__body">
        <div className="scenario-node__title">{nodeData.title}</div>

        {nodeData.text && (
          <div className="scenario-node__text">{nodeData.text}</div>
        )}

        <div className="scenario-node__meta">
          <div>
            <strong>target:</strong> {nodeData.targetId || 'missing'}
          </div>
          <div>
            <strong>interaction:</strong>{' '}
            {nodeData.interactionType || 'missing'}
          </div>
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
      <Handle id="next" type="source" position={Position.Right} />
    </div>
  );
}
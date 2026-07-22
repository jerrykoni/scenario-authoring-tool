import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { AuthoringNodeData } from '../scenario/authoringTypes';
import './nodeStyles.css';

export function YesNoDecisionNode({ data }: NodeProps) {
  const nodeData = data as AuthoringNodeData;

  return (
    <div className="scenario-node">
      <div className="scenario-node__header scenario-node__header--decision">
        Yes / No Decision
      </div>

      <div className="scenario-node__body">
        <div className="scenario-node__title">{nodeData.title}</div>

        {nodeData.text && (
          <div className="scenario-node__text">{nodeData.text}</div>
        )}

        <div className="scenario-node__meta">
          <div>
            <strong>template:</strong>{' '}
            {nodeData.presentationTemplate || 'yes_no'}
          </div>
          <div>
            <strong>outputs:</strong> yes / no
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

      <Handle
        id="yes"
        type="source"
        position={Position.Right}
        style={{ top: '38%' }}
      />

      <Handle
        id="no"
        type="source"
        position={Position.Right}
        style={{ top: '68%' }}
      />
    </div>
  );
}
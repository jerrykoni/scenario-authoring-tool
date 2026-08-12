import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { AuthoringNodeData } from '../scenario/authoringTypes';
import './nodeStyles.css';

export function NotificationNode({ data }: NodeProps) {
  const nodeData = data as AuthoringNodeData;

  return (
    <div className="scenario-node">
      <div className="scenario-node__header scenario-node__header--notification">
        Notification
      </div>

      <div className="scenario-node__body">
        <div className="scenario-node__title">{nodeData.title}</div>

        <div className="scenario-node__meta">
          <div>
            <strong>runtime:</strong> NotificationNode
          </div>

          {nodeData.titleKey && (
            <div>
              <strong>title:</strong> {nodeData.titleKey}
            </div>
          )}

          {nodeData.promptKey && (
            <div>
              <strong>prompt:</strong> {nodeData.promptKey}
            </div>
          )}

          {nodeData.instructionKey && (
            <div>
              <strong>instruction:</strong> {nodeData.instructionKey}
            </div>
          )}

          {nodeData.learningBreakTitle && (
            <div>
              <strong>break:</strong> {nodeData.learningBreakTitle}
            </div>
          )}
        </div>

        {nodeData.iconKeys && nodeData.iconKeys.length > 0 && (
          <div className="scenario-node__tag-list">
            {nodeData.iconKeys.map((icon) => (
              <span key={icon} className="scenario-node__tag">
                {icon}
              </span>
            ))}
          </div>
        )}

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
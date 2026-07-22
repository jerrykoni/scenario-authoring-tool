import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { AuthoringNodeData } from '../scenario/authoringTypes';
import './nodeStyles.css';

export function EndNode({ data }: NodeProps) {
  const nodeData = data as AuthoringNodeData;

  return (
    <div className="scenario-node">
      <div className="scenario-node__header scenario-node__header--end">
        End
      </div>

      <div className="scenario-node__body">
        <div className="scenario-node__title">{nodeData.title}</div>
      </div>

      <Handle type="target" position={Position.Left} />
    </div>
  );
}
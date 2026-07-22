import type { NodeTypes } from '@xyflow/react';

import { ObserveNode } from './ObserveNode';
import { ActionNode } from './ActionNode';
import { YesNoDecisionNode } from './YesNoDecisionNode';
import { EndNode } from './EndNode';

export const nodeTypes = {
  observeNode: ObserveNode,
  actionNode: ActionNode,
  yesNoDecisionNode: YesNoDecisionNode,
  endNode: EndNode,
} satisfies NodeTypes;
import type { NodeTypes } from '@xyflow/react';

import { ActionNode } from './ActionNode';
import { YesNoDecisionNode } from './YesNoDecisionNode';
import { DialogueDecisionNode } from './DialogueDecisionNode';
import { NotificationNode } from './NotificationNode';
import { EndNode } from './EndNode';

export const nodeTypes = {
  actionNode: ActionNode,
  yesNoDecisionNode: YesNoDecisionNode,
  dialogueDecisionNode: DialogueDecisionNode,
  notificationNode: NotificationNode,
  endNode: EndNode,
} satisfies NodeTypes;
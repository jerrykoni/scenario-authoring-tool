import type { Edge, Node } from '@xyflow/react';
import type { AuthoringNodeData } from './authoringTypes';

export const initialNodes: Node<AuthoringNodeData>[] = [
  {
    id: 'observe_initial',
    type: 'observeNode',
    position: { x: 100, y: 100 },
    data: {
      kind: 'observe',
      title: 'Observe initial casualty',
      text: 'Look at the casualty.',
      targetId: 'subject.casualty',
      interactionType: 'look',
      assessmentTags: [
        'initial_observation',
        'required_observation',
        'sequence_critical',
      ],
    },
  },
  {
    id: 'standing_or_walking',
    type: 'yesNoDecisionNode',
    position: { x: 420, y: 80 },
    data: {
      kind: 'yesNoDecision',
      title: 'Standing or walking?',
      text: 'Is the casualty standing or walking?',
      presentationTemplate: 'yes_no',
      assessmentTags: ['initial_observation', 'walking_assessment'],
    },
  },
  {
    id: 'assign_green',
    type: 'actionNode',
    position: { x: 760, y: 0 },
    data: {
      kind: 'action',
      title: 'Assign green card',
      text: 'Assign a Green Card using the equipment.',
      targetId: 'equipment.triage_card',
      interactionType: 'assign_green_card',
      assessmentTags: [
        'green_card_assignment_action',
        'equipment_use',
        'triage_card_assignment',
      ],
    },
  },
  {
    id: 'ask_can_walk',
    type: 'actionNode',
    position: { x: 760, y: 180 },
    data: {
      kind: 'action',
      title: 'Ask: Can you walk?',
      text: 'Ask the casualty: Can you walk?',
      targetId: 'subject.casualty',
      interactionType: 'ask_can_walk',
      assessmentTags: [
        'responsiveness_assessment',
        'required_action',
        'sequence_critical',
      ],
    },
  },
  {
    id: 'end_demo',
    type: 'endNode',
    position: { x: 1100, y: 90 },
    data: {
      kind: 'end',
      title: 'End demo',
    },
  },
];

export const initialEdges: Edge[] = [
  {
    id: 'e_observe_initial_to_standing',
    source: 'observe_initial',
    sourceHandle: 'next',
    target: 'standing_or_walking',
  },
  {
    id: 'e_standing_yes_to_green',
    source: 'standing_or_walking',
    sourceHandle: 'yes',
    target: 'assign_green',
    label: 'yes',
  },
  {
    id: 'e_standing_no_to_ask',
    source: 'standing_or_walking',
    sourceHandle: 'no',
    target: 'ask_can_walk',
    label: 'no',
  },
  {
    id: 'e_green_to_end',
    source: 'assign_green',
    sourceHandle: 'next',
    target: 'end_demo',
  },
  {
    id: 'e_ask_to_end',
    source: 'ask_can_walk',
    sourceHandle: 'next',
    target: 'end_demo',
  },
];
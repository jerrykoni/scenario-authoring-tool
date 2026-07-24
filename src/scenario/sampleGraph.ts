import type { Edge, Node } from '@xyflow/react';
import type { AuthoringNodeData } from './authoringTypes';

export type ScenarioAuthoringNode = Node<AuthoringNodeData>;

export const initialNodes: ScenarioAuthoringNode[] = [
  {
    id: 'observe_initial_casualty',
    type: 'actionNode',
    position: { x: 100, y: 100 },
    data: {
      kind: 'action',
      title: 'Observe initial casualty',
      eventType: 'ObjectInspected',
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
    id: 'q_is_standing_or_walking',
    type: 'yesNoDecisionNode',
    position: { x: 440, y: 80 },
    data: {
      kind: 'yesNoDecision',
      title: 'Is standing or walking?',
      choicesTitleKey: '',
      choices: [
        {
          choiceId: 'yes',
          labelKey: 'Yes',
          styleKey: 'positive',
          iconKey: 'icon.walking',
        },
        {
          choiceId: 'no',
          labelKey: 'No',
          styleKey: 'negative',
          iconKey: 'icon.not_walking',
        },
      ],
      assessmentTags: ['initial_observation', 'walking_assessment'],
    },
  },
  {
    id: 'n_is_standing_or_walking',
    type: 'notificationNode',
    position: { x: 780, y: 0 },
    data: {
      kind: 'notification',
      title: 'Standing / walking notification',
      titleKey: 'n_is_standing_or_walking_title',
      instructionKey: 'n_is_standing_or_walking_instruction',
      iconKeys: ['icon.walking'],
      assessmentTags: [],
    },
  },
  {
    id: 'action_ask_can_you_walk',
    type: 'actionNode',
    position: { x: 780, y: 190 },
    data: {
      kind: 'action',
      title: 'Ask: Can you walk?',
      eventType: 'ActionPerformed',
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
    id: 'q_can_walk',
    type: 'dialogueDecisionNode',
    position: { x: 1120, y: 150 },
    data: {
      kind: 'dialogueDecision',
      title: 'Dialogue: Can walk?',
      choices: [
        {
          choiceId: 'please_move_to_safe_area',
          labelKey: 'please_move_to_safe_area',
          styleKey: 'dialogue',
        },
        {
          choiceId: 'can_you_walk',
          labelKey: 'can_you_walk',
          styleKey: 'dialogue',
        },
        {
          choiceId: 'what_is_your_name',
          labelKey: 'what_is_your_name',
          styleKey: 'dialogue',
        },
      ],
      assessmentTags: ['initial_observation', 'walking_assessment'],
    },
  },
  {
    id: 'q_does_casualty_respond',
    type: 'yesNoDecisionNode',
    position: { x: 1480, y: 150 },
    data: {
      kind: 'yesNoDecision',
      title: 'Does casualty respond?',
      choices: [
        {
          choiceId: 'yes',
          labelKey: 'Yes',
          styleKey: 'positive',
          iconKey: 'icon.responding',
        },
        {
          choiceId: 'no',
          labelKey: 'No',
          styleKey: 'negative',
          iconKey: 'icon.not_responding',
        },
      ],
      assessmentTags: ['responsiveness_assessment'],
    },
  },
  {
    id: 'end_demo',
    type: 'endNode',
    position: { x: 1820, y: 150 },
    data: {
      kind: 'end',
      title: 'End demo',
    },
  },
];

export const initialEdges: Edge[] = [
  {
    id: 'e_observe_to_q_standing',
    source: 'observe_initial_casualty',
    sourceHandle: 'next',
    target: 'q_is_standing_or_walking',
  },
  {
    id: 'e_standing_yes_to_notification',
    source: 'q_is_standing_or_walking',
    sourceHandle: 'yes',
    target: 'n_is_standing_or_walking',
    label: 'yes',
  },
  {
    id: 'e_standing_no_to_ask',
    source: 'q_is_standing_or_walking',
    sourceHandle: 'no',
    target: 'action_ask_can_you_walk',
    label: 'no',
  },
  {
    id: 'e_notification_to_ask',
    source: 'n_is_standing_or_walking',
    sourceHandle: 'next',
    target: 'action_ask_can_you_walk',
  },
  {
    id: 'e_ask_to_q_can_walk',
    source: 'action_ask_can_you_walk',
    sourceHandle: 'next',
    target: 'q_can_walk',
  },
  {
    id: 'e_dialogue_please_move',
    source: 'q_can_walk',
    sourceHandle: 'please_move_to_safe_area',
    target: 'q_does_casualty_respond',
    label: 'please_move_to_safe_area',
  },
  {
    id: 'e_dialogue_can_walk',
    source: 'q_can_walk',
    sourceHandle: 'can_you_walk',
    target: 'q_does_casualty_respond',
    label: 'can_you_walk',
  },
  {
    id: 'e_dialogue_name',
    source: 'q_can_walk',
    sourceHandle: 'what_is_your_name',
    target: 'q_does_casualty_respond',
    label: 'what_is_your_name',
  },
  {
    id: 'e_respond_yes_to_end',
    source: 'q_does_casualty_respond',
    sourceHandle: 'yes',
    target: 'end_demo',
    label: 'yes',
  },
  {
    id: 'e_respond_no_to_end',
    source: 'q_does_casualty_respond',
    sourceHandle: 'no',
    target: 'end_demo',
    label: 'no',
  },
];
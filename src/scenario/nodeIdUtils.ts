import type { AuthoringNodeData } from './authoringTypes';

export function slugifyTitle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

export function getNodeIdPrefix(kind: AuthoringNodeData['kind']) {
  switch (kind) {
    case 'action':
      return 'a';
    case 'yesNoDecision':
    case 'dialogueDecision':
      return 'd';
    case 'notification':
      return 'n';
    case 'end':
      return 'e';
    default:
      return 'node';
  }
}

// Creates a base node ID from kind and title without uniqueness suffix.
export function createNodeIdFromTitle(
  kind: AuthoringNodeData['kind'],
  title: string,
) {
  const prefix = getNodeIdPrefix(kind);
  const slug = slugifyTitle(title);

  return slug ? `${prefix}_${slug}` : `${prefix}_untitled`;
}

// Strips the duplicate numeric suffix (e.g. a_do_something_2 -> a_do_something)
// so localization keys stay shared across nodes with the same title.
export function getBaseNodeId(nodeId: string) {
  return nodeId.replace(/_\d+$/, '');
}

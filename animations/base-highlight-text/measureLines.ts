import type { Text } from 'react-native';
export type TextLine = { x: number; y: number; width: number; height: number };
/** Native line rectangles arrive through onTextLayout. */
export function observeTextLines(
  _node: Text | null,
  _onLines: (lines: TextLine[]) => void,
): () => void {
  return () => {};
}

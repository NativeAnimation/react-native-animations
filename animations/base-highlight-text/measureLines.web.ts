import type { Text } from 'react-native';
export type TextLine = { x: number; y: number; width: number; height: number };
/** Range rectangles preserve the actual wrapping, font metrics, and text alignment. */
export function observeTextLines(
  node: Text | null,
  onLines: (lines: TextLine[]) => void,
): () => void {
  const element = node as unknown as HTMLElement | null;
  if (!element) return () => {};
  let active = true;
  const measure = () => {
    if (!active) return;
    const origin = element.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(element);
    const lines: TextLine[] = [];
    for (const rect of Array.from(range.getClientRects())) {
      if (!rect.width || !rect.height) continue;
      const line = {
        x: rect.left - origin.left,
        y: rect.top - origin.top,
        width: rect.width,
        height: rect.height,
      };
      if (
        !lines.some(
          (previous) =>
            Math.abs(previous.y - line.y) < 0.5 &&
            Math.abs(previous.x - line.x) < 0.5 &&
            Math.abs(previous.width - line.width) < 0.5,
        )
      )
        lines.push(line);
    }
    onLines(lines);
  };
  const observer = new ResizeObserver(measure);
  observer.observe(element);
  measure();
  void document.fonts.ready.then(measure);
  return () => {
    active = false;
    observer.disconnect();
  };
}

import Animated, {
  ReduceMotion,
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import {
  useBaseReducedMotion,
  alpha,
  useBaseTheme,
  type BaseTheme,
} from '../base-theme';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Text, View, type StyleProp, type TextStyle } from 'react-native';

import { observeTextLines, type TextLine } from './measureLines';

export type BaseHighlightTextProps = {
  text: string;
  highlightColor?: string;
  duration?: number;
  delay?: number;
  /** Set false to reset, then true when the text enters the viewport. */
  trigger?: boolean;
  style?: StyleProp<TextStyle>;
  theme?: BaseTheme;
  testID?: string;
};
function HighlightLine({
  line,
  progress,
  color,
}: {
  line: TextLine;
  progress: SharedValue<number>;
  color: string;
}) {
  const animated = useAnimatedStyle(() => ({
    width: Math.max(0, line.width * progress.get()),
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: line.x,
          top: line.y,
          height: line.height,
          borderRadius: 4,
          backgroundColor: color,
        },
        animated,
      ]}
    />
  );
}
export function BaseHighlightText({
  text,
  highlightColor,
  duration = 2000,
  delay = 0,
  trigger = true,
  style,
  theme: override,
  testID,
}: BaseHighlightTextProps) {
  const theme = useBaseTheme(override);
  const reduced = useBaseReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  const [lines, setLines] = useState<TextLine[]>([]);
  const label = useRef<React.ComponentRef<typeof Text>>(null);
  const updateLines = useCallback((next: TextLine[]) => {
    setLines((previous) =>
      JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
    );
  }, []);
  useLayoutEffect(
    () =>
      observeTextLines(
        label.current as unknown as Parameters<typeof observeTextLines>[0],
        updateLines,
      ),
    [text, style, updateLines],
  );
  useEffect(() => {
    cancelAnimation(progress);
    progress.set(reduced ? 1 : 0);
    if (!reduced && trigger)
      progress.set(
        withDelay(
          Math.max(0, delay),
          withTiming(1, {
            reduceMotion: ReduceMotion.Never,
            duration: Math.max(0, duration),
            easing: Easing.inOut(Easing.ease),
          }),
          ReduceMotion.Never,
        ),
      );
    return () => cancelAnimation(progress);
  }, [text, trigger, reduced, duration, delay, progress]);
  const color =
    highlightColor ??
    alpha(theme.colors.primary, theme.scheme === 'dark' ? 0.3 : 0.18);
  return (
    <View testID={testID} style={{ alignSelf: 'stretch' }}>
      <View
        pointerEvents="none"
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {lines.map((line, index) => (
          <HighlightLine
            key={index}
            line={line}
            progress={progress}
            color={color}
          />
        ))}
      </View>
      <Text
        ref={label}
        accessible
        accessibilityLabel={text}
        onTextLayout={(event) =>
          updateLines(
            event.nativeEvent.lines.map(({ x, y, width, height }) => ({
              x,
              y,
              width,
              height,
            })),
          )
        }
        style={[
          {
            fontFamily: theme.fonts.regular,
            fontSize: 16,
            lineHeight: 26,
            color: theme.colors.foreground,
          },
          style,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

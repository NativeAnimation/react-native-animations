import Animated, {
  ReduceMotion,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  useBaseReducedMotion,
  useBaseTheme,
  type BaseTheme,
} from '../base-theme';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

export type BaseTypingTextProps = {
  text: string | string[];
  /** Milliseconds per character, for typing and deletion. */
  duration?: number;
  delay?: number;
  loop?: boolean;
  holdDelay?: number;
  cursor?: boolean;
  style?: StyleProp<TextStyle>;
  /** Called after each phrase finishes typing. */
  onComplete?: () => void;
  theme?: BaseTheme;
  testID?: string;
};

function TypingRun({
  text,
  duration = 100,
  delay = 0,
  loop = false,
  holdDelay = 1000,
  cursor = true,
  style,
  onComplete,
  theme: override,
  testID,
}: BaseTypingTextProps) {
  const theme = useBaseTheme(override);
  const reduced = useBaseReducedMotion();
  const phrases = typeof text === 'string' ? [text] : text;
  const textKey = JSON.stringify(phrases);
  const [visible, setVisible] = useState(reduced ? (phrases[0] ?? '') : '');
  const [writing, setWriting] = useState(false);
  const complete = useRef(onComplete);
  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);
  const blink = useSharedValue(0);
  useEffect(() => {
    const words: string[] = JSON.parse(textKey);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let phrase = 0;
    let count = 0;
    let deleting = false;
    const wait = (fn: () => void, ms: number) => {
      timer = setTimeout(
        () => {
          if (!stopped) fn();
        },
        Math.max(0, ms),
      );
    };
    if (!words.length) return;
    if (reduced) {
      complete.current?.();
      return;
    }
    const step = () => {
      const characters = Array.from(words[phrase]);
      if (deleting) {
        count = Math.max(0, count - 1);
        setVisible(characters.slice(0, count).join(''));
        setWriting(count > 0);
        if (count > 0) wait(step, Math.max(1, duration));
        else {
          deleting = false;
          phrase = (phrase + 1) % words.length;
          wait(step, Math.max(1, duration));
        }
        return;
      }
      count = Math.min(characters.length, count + 1);
      setVisible(characters.slice(0, count).join(''));
      if (count < characters.length) {
        setWriting(true);
        wait(step, Math.max(1, duration));
      } else {
        setWriting(false);
        complete.current?.();
        if (loop || phrase < words.length - 1)
          wait(() => {
            deleting = true;
            setWriting(true);
            step();
          }, holdDelay);
      }
    };
    wait(step, delay);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [textKey, duration, delay, loop, holdDelay, reduced]);
  useEffect(() => {
    cancelAnimation(blink);
    blink.set(0);
    if (!reduced && cursor && !writing)
      blink.set(
        withRepeat(
          withSequence(
            ReduceMotion.Never,
            withDelay(
              500,
              withTiming(1, { reduceMotion: ReduceMotion.Never, duration: 0 }),
              ReduceMotion.Never,
            ),
            withDelay(
              500,
              withTiming(0, { reduceMotion: ReduceMotion.Never, duration: 0 }),
              ReduceMotion.Never,
            ),
          ),
          -1,
          undefined,
          undefined,
          ReduceMotion.Never,
        ),
      );
    return () => cancelAnimation(blink);
  }, [blink, writing, reduced, cursor]);
  const cursorStyle = useAnimatedStyle(() => ({
    opacity: writing ? 1 : blink.get(),
  }));
  const fontSize = Math.max(12, StyleSheet.flatten(style)?.fontSize ?? 16);
  return (
    <Text
      testID={testID}
      accessible
      accessibilityLabel={phrases.join(' ')}
      style={[
        {
          color: theme.colors.foreground,
          fontFamily: theme.fonts.regular,
          fontSize: 16,
          lineHeight: 24,
        },
        style,
      ]}
    >
      {reduced ? (phrases[0] ?? '') : visible}
      {cursor && !reduced ? (
        <Animated.View
          accessible={false}
          importantForAccessibility="no"
          style={[
            {
              width: 2,
              height: fontSize,
              marginLeft: 2,
              backgroundColor: theme.colors.foreground,
            },
            cursorStyle,
          ]}
        />
      ) : null}
    </Text>
  );
}

export function BaseTypingText(props: BaseTypingTextProps) {
  const reduced = useBaseReducedMotion();
  const resetKey = JSON.stringify([
    props.text,
    props.duration,
    props.delay,
    props.loop,
    props.holdDelay,
    reduced,
  ]);
  return <TypingRun key={resetKey} {...props} />;
}

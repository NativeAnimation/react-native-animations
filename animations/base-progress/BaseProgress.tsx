import Animated, {
  ReduceMotion,
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  useBaseReducedMotion,
  alpha,
  useBaseTheme,
  type BaseTheme,
} from '../base-theme';
import React, { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

// Reanimated 4 uses relative energy rather than restDisplacementThreshold.
const PROGRESS_SPRING = {
  stiffness: 300,
  damping: 35,
  mass: 1,
  energyThreshold: 1e-9,
  overshootClamping: true,
};
export type BaseProgressProps = {
  /** Current controlled value. */
  value?: number;
  /** Shows a looping segment instead of a known percentage. */
  indeterminate?: boolean;
  /** Track height in points. */
  height?: number;
  /** Accessible name for this control or task. */
  accessibilityLabel?: string;
  /** Style applied to the container. */
  style?: StyleProp<ViewStyle>;
  /** Overrides the nearest BaseThemeProvider. */
  theme?: BaseTheme;
  /** Stable identifier for the root or trigger. */
  testID?: string;
};
export function BaseProgress({
  value = 0,
  indeterminate = false,
  height = 8,
  accessibilityLabel,
  style,
  theme: override,
  testID,
}: BaseProgressProps) {
  const theme = useBaseTheme(override);
  const reduced = useBaseReducedMotion();
  const amount = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  const fill = useSharedValue(amount);
  const travel = useSharedValue(-0.4);
  const width = useSharedValue(0);
  useEffect(() => {
    fill.set(
      reduced
        ? amount
        : withSpring(amount, {
            ...PROGRESS_SPRING,
            reduceMotion: ReduceMotion.Never,
          }),
    );
    return () => cancelAnimation(fill);
  }, [amount, reduced, fill]);
  useEffect(() => {
    travel.set(reduced ? 0.3 : -0.4);
    if (indeterminate && !reduced)
      travel.set(
        withRepeat(
          withTiming(1, {
            reduceMotion: ReduceMotion.Never,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          undefined,
          undefined,
          ReduceMotion.Never,
        ),
      );
    return () => cancelAnimation(travel);
  }, [indeterminate, reduced, travel]);
  const animated = useAnimatedStyle(() => ({
    width: indeterminate ? width.get() * 0.4 : (width.get() * fill.get()) / 100,
    transform: [{ translateX: indeterminate ? travel.get() * width.get() : 0 }],
  }));
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: indeterminate }}
      aria-busy={indeterminate}
      aria-valuemin={indeterminate ? undefined : 0}
      aria-valuemax={indeterminate ? undefined : 100}
      aria-valuenow={indeterminate ? undefined : amount}
      accessibilityValue={
        indeterminate
          ? { text: 'In progress' }
          : { min: 0, max: 100, now: amount }
      }
      onLayout={(event) => width.set(event.nativeEvent.layout.width)}
      style={[
        {
          height,
          overflow: 'hidden',
          borderRadius: theme.radius.full,
          backgroundColor: alpha(theme.colors.primary, 0.2),
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.primary,
          },
          animated,
        ]}
      />
    </View>
  );
}
export default BaseProgress;

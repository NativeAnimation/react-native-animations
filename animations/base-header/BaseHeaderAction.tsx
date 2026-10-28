import {
  baseActivationProps,
  useBaseReducedMotion,
  spring,
  useBaseTheme,
  type BaseTheme,
} from '../base-theme';
import React from 'react';
import { Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const NO_WEB_OUTLINE =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

export type BaseHeaderActionProps = {
  children: React.ReactNode;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
  theme?: BaseTheme;
  testID?: string;
};

export function BaseHeaderAction({
  children,
  accessibilityLabel: label,
  onPress,
  disabled = false,
  theme: override,
  testID,
}: BaseHeaderActionProps) {
  const theme = useBaseTheme(override);
  const reduced = useBaseReducedMotion();
  const pressed = useSharedValue(1);
  const tap = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      pressed.set(
        reduced
          ? 1
          : withSpring(theme.motion.scales.press, spring(theme, 'press')),
      );
    })
    .onFinalize(() => {
      pressed.set(reduced ? 1 : withSpring(1, spring(theme, 'press')));
    })
    .onEnd((_event, success) => {
      if (success) scheduleOnRN(onPress);
    });
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.get() }],
  }));
  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        testID={testID}
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        aria-disabled={disabled}

        {
          /* RN Web forwards DOM events rather than native event objects. */
          ...((Platform.OS === 'web'
            ? {
                tabIndex: disabled ? -1 : 0,
                // Gesture Handler activates on key-up; prevent browser scrolling without firing twice.
                onKeyDown: (event: React.KeyboardEvent) => {
                  if (
                    !disabled &&
                    (event.key === 'Enter' || event.key === ' ')
                  ) {
                    event.preventDefault();
                  }
                },
              }
            : {}) as object)
        }
        {
          /* RN Web forwards DOM events rather than native event objects. */
          ...(baseActivationProps(onPress, disabled) as object)
        }
        style={[
          {
            width: Platform.OS === 'android' ? 48 : 44,
            height: Platform.OS === 'android' ? 48 : 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.radius.md,
          },
          NO_WEB_OUTLINE,
          animated,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

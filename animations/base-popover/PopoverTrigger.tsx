import {
  baseActivationProps,
  useBaseReducedMotion,
  spring,
  type BaseTheme,
} from '../base-theme';
import React, { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const NO_WEB_OUTLINE =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;
export function PopoverTrigger({
  anchorRef,
  children,
  theme,
  label,
  hint,
  expanded,
  tooltip = false,
  delayMs = 500,
  onActivate,
  onRelease,
  onHover,
  onLeave,
  testID,
}: {
  anchorRef: React.RefObject<View | null>;
  children: React.ReactNode;
  theme: BaseTheme;
  label?: string;
  hint?: string;
  expanded: boolean;
  tooltip?: boolean;
  delayMs?: number;
  onActivate: () => void;
  onRelease?: () => void;
  onHover?: () => void;
  onLeave?: () => void;
  testID?: string;
}) {
  const reduced = useBaseReducedMotion();
  const press = useSharedValue(1);
  const [focused, setFocused] = useState(false);
  const down = () => {
    'worklet';
    press.set(
      reduced
        ? 1
        : withSpring(theme.motion.scales.press, spring(theme, 'press')),
    );
  };
  const up = () => {
    'worklet';
    press.set(reduced ? 1 : withSpring(1, spring(theme, 'press')));
  };
  const tap = Gesture.Tap()
    .onBegin(down)
    .onFinalize(up)
    .onEnd((_event, success) => {
      if (success) scheduleOnRN(onActivate);
    });
  const hold = Gesture.LongPress()
    .minDuration(Math.max(0, delayMs))
    .onBegin(down)
    .onStart(() => scheduleOnRN(onActivate))
    .onFinalize(() => {
      up();
      if (onRelease) scheduleOnRN(onRelease);
    });
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: press.get() }],
  }));
  return (
    <GestureDetector gesture={tooltip ? hold : tap}>
      <Animated.View
        ref={anchorRef}
        collapsable={false}
        testID={testID}
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityState={tooltip ? undefined : { expanded }}

        {...(Platform.OS === 'web'
          ? {
              tabIndex: 0,
              'aria-expanded': tooltip ? undefined : expanded,
              'aria-description': hint,
              'aria-haspopup': tooltip ? undefined : ('dialog' as const),
              onMouseEnter: onHover,
              onMouseLeave: onLeave,
              onFocus: () => {
                setFocused(true);
                if (tooltip) onHover?.();
              },
              onBlur: () => {
                setFocused(false);
                if (tooltip) onLeave?.();
              },
              onKeyDown: (event: React.KeyboardEvent) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onActivate();
                  if (tooltip) onRelease?.();
                } else if (event.key === 'Escape') onLeave?.();
              },
            }
          : {})}
        {...baseActivationProps(() => {
          onActivate();
          if (tooltip) onRelease?.();
        })}
        style={[
          {
            alignSelf: 'flex-start',
            minHeight: Platform.OS === 'android' ? 48 : 44,
            minWidth: Platform.OS === 'android' ? 48 : 44,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: theme.radius.md,
            boxShadow: focused
              ? `0px 0px 0px 3px ${theme.colors.ringSoft}`
              : undefined,
          },
          NO_WEB_OUTLINE,
          animated,
        ]}
      >
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
        >
          {typeof children === 'string' || typeof children === 'number' ? (
            <Text
              style={{
                color: theme.colors.foreground,
                fontFamily: theme.fonts.medium,
                fontSize: 14,
                lineHeight: 20,
              }}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

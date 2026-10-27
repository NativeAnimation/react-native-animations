import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  baseActivationProps,
  useBaseReducedMotion,
  BaseThemeProvider,
  spring,
  useBaseTheme,
  type BaseTheme,
} from '../base-theme';
import React, { Children, isValidElement } from 'react';
import {
  Platform,
  Text,
  View,
  type TextProps,
  type ViewProps,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

export type BaseCardProps = ViewProps & {
  onPress?: () => void;
  theme?: BaseTheme;
};
export type BaseCardPartProps = ViewProps & { theme?: BaseTheme };
export type BaseCardTextProps = TextProps & { theme?: BaseTheme };

export function BaseCard({
  children,
  onPress,
  theme: override,
  style,
  ...props
}: BaseCardProps) {
  const theme = useBaseTheme(override);
  const reduced = useBaseReducedMotion();
  const pressScale = useSharedValue(1);
  const pressSpring = spring(theme, 'press');
  const choiceScale = theme.motion.scales.choice;
  const tap = Gesture.Tap()
    .enabled(
      !!onPress &&
        !props.accessibilityState?.disabled &&
        !props['aria-disabled'],
    )
    .onBegin(() => {
      pressScale.set(
        reduced
          ? 1
          : withSpring(choiceScale, {
              ...pressSpring,
              reduceMotion: ReduceMotion.Never,
            }),
      );
    })
    .onFinalize(() => {
      pressScale.set(
        reduced
          ? 1
          : withSpring(1, { ...pressSpring, reduceMotion: ReduceMotion.Never }),
      );
    })
    .onEnd((_event, success) => {
      if (success && onPress) scheduleOnRN(onPress);
    });
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.get() }],
  }));
  const card = (
    <Animated.View
      {...props}
      aria-checked={props['aria-checked'] ?? props.accessibilityState?.checked}
      aria-selected={
        props['aria-selected'] ?? props.accessibilityState?.selected
      }
      aria-expanded={
        props['aria-expanded'] ?? props.accessibilityState?.expanded
      }
      aria-disabled={
        props['aria-disabled'] ?? props.accessibilityState?.disabled
      }
      aria-busy={props['aria-busy'] ?? props.accessibilityState?.busy}
      accessible={onPress ? true : props.accessible}
      accessibilityRole={onPress ? 'button' : props.accessibilityRole}
      onAccessibilityTap={onPress ?? props.onAccessibilityTap}
      accessibilityActions={
        onPress ? [{ name: 'activate' }] : props.accessibilityActions
      }
      onAccessibilityAction={(event) => {
        if (onPress && event.nativeEvent.actionName === 'activate') onPress();
        else props.onAccessibilityAction?.(event);
      }}
      {
        /* RN Web forwards DOM events rather than native event objects. */
        ...((onPress && Platform.OS === 'web'
          ? {
              tabIndex: 0,
              onKeyDown: (event: React.KeyboardEvent) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onPress();
                }
              },
            }
          : {}) as object)
      }
      {
        /* RN Web forwards DOM events rather than native event objects. */
        ...((onPress
          ? baseActivationProps(onPress, props.accessibilityState?.disabled)
          : {}) as object)
      }
      style={[
        {
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          boxShadow: theme.shadow.sm,
          paddingVertical: 24,
          gap: 24,
          minHeight: onPress ? 44 : undefined,
          minWidth: onPress ? 44 : undefined,
        },
        style,
        animated,
      ]}
    >
      <BaseThemeProvider theme={theme}>{children}</BaseThemeProvider>
    </Animated.View>
  );
  return onPress ? (
    <GestureDetector gesture={tap}>{card}</GestureDetector>
  ) : (
    card
  );
}

export function BaseCardHeader({
  children,
  theme: override,
  style,
  ...props
}: BaseCardPartProps) {
  const theme = useBaseTheme(override);
  const items = Children.toArray(children);
  const actions = items.filter(
    (child) => isValidElement(child) && child.type === BaseCardAction,
  );
  const body = items.filter(
    (child) => !isValidElement(child) || child.type !== BaseCardAction,
  );
  return (
    <BaseThemeProvider theme={theme}>
      <View
        {...props}
        style={[
          {
            paddingHorizontal: 24,
            gap: 8,
            flexDirection: actions.length ? 'row' : 'column',
            alignItems: 'flex-start',
          },
          style,
        ]}
      >
        {actions.length ? (
          <View style={{ flex: 1, minWidth: 0, gap: 8 }}>{body}</View>
        ) : (
          body
        )}
        {actions}
      </View>
    </BaseThemeProvider>
  );
}

export function BaseCardTitle({
  theme: override,
  style,
  ...props
}: BaseCardTextProps) {
  const theme = useBaseTheme(override);
  return (
    <Text
      accessibilityRole="header"
      {...props}
      style={[
        {
          fontFamily: theme.fonts.semibold,
          fontSize: 16,
          lineHeight: 16,
          color: theme.colors.cardForeground,
        },
        style,
      ]}
    />
  );
}

export function BaseCardDescription({
  theme: override,
  style,
  ...props
}: BaseCardTextProps) {
  const theme = useBaseTheme(override);
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: theme.fonts.regular,
          fontSize: 14,
          lineHeight: 20,
          color: theme.colors.mutedForeground,
        },
        style,
      ]}
    />
  );
}

export function BaseCardAction({
  theme: override,
  style,
  ...props
}: BaseCardPartProps) {
  const theme = useBaseTheme(override);
  return (
    <BaseThemeProvider theme={theme}>
      <View {...props} style={[{ alignSelf: 'flex-start' }, style]} />
    </BaseThemeProvider>
  );
}

export function BaseCardContent({
  theme: override,
  style,
  ...props
}: BaseCardPartProps) {
  const theme = useBaseTheme(override);
  return (
    <BaseThemeProvider theme={theme}>
      <View {...props} style={[{ paddingHorizontal: 24 }, style]} />
    </BaseThemeProvider>
  );
}

export function BaseCardFooter({
  theme: override,
  style,
  ...props
}: BaseCardPartProps) {
  const theme = useBaseTheme(override);
  return (
    <BaseThemeProvider theme={theme}>
      <View
        {...props}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 24,
            gap: 8,
          },
          style,
        ]}
      />
    </BaseThemeProvider>
  );
}

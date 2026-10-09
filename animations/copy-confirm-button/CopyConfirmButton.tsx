import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Imperative controls for the copy button. */
export type CopyConfirmButtonRef = {
  /** Calls `onCopy` and starts confirmation feedback. */
  copy: () => void;
  /** Returns the button to its copy icon. */
  reset: () => void;
};

export type CopyConfirmButtonProps = {
  /** Controlled feedback state. */
  copied?: boolean;
  /** Initial feedback state when uncontrolled. @default false */
  defaultCopied?: boolean;
  /** Called instead of using a clipboard API. */
  onCopy: () => void;
  /** Called when the requested feedback state changes. */
  onChange?: (copied: boolean) => void;
  /** Time before uncontrolled feedback resets. @default 1600 */
  resetMs?: number;
  /** Button size. @default 40 */
  size?: number;
  /** Button background color. Defaults to a scheme-aware neutral. */
  backgroundColor?: string;
  /** Bottom surface color. Defaults to a nearby scheme-aware tone. */
  surfaceEndColor?: string;
  /** Copy icon color. @default '#3D3D46' */
  iconColor?: string;
  /** Check color. @default '#169B62' */
  successColor?: string;
  /** Bubble text. @default 'Copied' */
  copiedLabel?: string;
  /** Font family for the bubble. */
  fontFamily?: string;
  /** Color treatment, or the device setting when set to auto. @default 'auto' */
  colorScheme?: 'light' | 'dark' | 'auto';
  /** Screen-reader label. @default 'Copy' */
  accessibilityLabel?: string;
  /** Style for the button. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier for the button. */
  testID?: string;
};

/** A compact copy button with rotating icon feedback and a rising confirmation bubble. */
export const CopyConfirmButton = forwardRef<
  CopyConfirmButtonRef,
  CopyConfirmButtonProps
>(function CopyConfirmButton(
  {
    copied,
    defaultCopied = false,
    onCopy,
    onChange,
    resetMs = 1600,
    size = 40,
    backgroundColor,
    surfaceEndColor,
    iconColor = '#3D3D46',
    successColor = '#169B62',
    copiedLabel = 'Copied',
    fontFamily,
    colorScheme = 'auto',
    accessibilityLabel = 'Copy',
    style,
    testID,
  },
  ref,
) {
  const reducedMotion = useReducedMotion();
  const systemScheme = useColorScheme();
  const dark =
    colorScheme === 'dark' ||
    (colorScheme === 'auto' && systemScheme === 'dark');
  const resolvedBackground = backgroundColor ?? (dark ? '#25242C' : '#FFFFFF');
  const resolvedSurfaceEnd = surfaceEndColor ?? (dark ? '#18171D' : '#F2F0F5');
  const controlled = copied !== undefined;
  const [internalCopied, setInternalCopied] = useState(defaultCopied);
  const currentCopied = controlled ? copied : internalCopied;
  const transition = useSharedValue(currentCopied ? 1 : 0);
  const bubble = useSharedValue(currentCopied ? 0.15 : 1);
  const pressScale = useSharedValue(1);
  const celebration = useSharedValue(currentCopied ? 1 : 0);

  const requestCopied = useCallback(
    (next: boolean) => {
      if (!controlled) setInternalCopied(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );

  const reset = useCallback(() => requestCopied(false), [requestCopied]);
  const triggerCopy = useCallback(() => {
    if (currentCopied) return;
    onCopy();
    requestCopied(true);
  }, [currentCopied, onCopy, requestCopied]);

  useImperativeHandle(ref, () => ({ copy: triggerCopy, reset }), [
    reset,
    triggerCopy,
  ]);

  useEffect(() => {
    transition.set(
      reducedMotion
        ? currentCopied
          ? 1
          : 0
        : withTiming(currentCopied ? 1 : 0, {
            duration: 260,
            easing: Easing.out(Easing.cubic),
          }),
    );
    if (currentCopied) {
      bubble.set(0);
      bubble.set(
        withTiming(1, {
          duration: reducedMotion
            ? Math.max(1, resetMs)
            : Math.max(500, resetMs),
          easing: Easing.linear,
        }),
      );
      celebration.set(0);
      celebration.set(
        reducedMotion
          ? 1
          : withTiming(1, {
              duration: 520,
              easing: Easing.out(Easing.cubic),
            }),
      );
    } else {
      bubble.set(1);
      celebration.set(0);
    }
  }, [bubble, celebration, currentCopied, reducedMotion, resetMs, transition]);

  useEffect(() => {
    if (controlled || !currentCopied) return;
    const timer = setTimeout(() => requestCopied(false), Math.max(0, resetMs));
    return () => clearTimeout(timer);
  }, [controlled, currentCopied, requestCopied, resetMs]);

  const iconContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: reducedMotion ? '0deg' : `${transition.value * 90}deg` },
      { scale: interpolate(transition.value, [0, 0.5, 1], [1, 0.82, 1]) },
    ],
  }));
  const copyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(transition.value, [0, 0.42, 1], [1, 0, 0]),
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: interpolate(transition.value, [0, 0.58, 1], [0, 0, 1]),
    transform: [
      { rotate: reducedMotion ? '0deg' : `${-90 + transition.value * 90}deg` },
    ],
  }));
  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion
      ? currentCopied
        ? 1
        : 0
      : interpolate(bubble.value, [0, 0.14, 0.72, 1], [0, 1, 1, 0]),
    transform: [
      {
        translateY: reducedMotion
          ? -size * 0.9
          : interpolate(bubble.value, [0, 1], [-size * 0.65, -size * 1.15]),
      },
      {
        scale: reducedMotion
          ? 1
          : interpolate(bubble.value, [0, 0.15], [0.9, 1]),
      },
    ],
  }));
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reducedMotion ? 1 : pressScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion
      ? currentCopied
        ? 0.24
        : 0
      : interpolate(celebration.value, [0, 0.18, 1], [0, 0.34, 0]),
    transform: [
      { scale: interpolate(celebration.value, [0, 1], [0.55, 1.48]) },
    ],
  }));
  const sheenStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion
      ? 0
      : interpolate(celebration.value, [0, 0.12, 0.88, 1], [0, 0.76, 0.42, 0]),
    transform: [
      {
        translateX: interpolate(
          celebration.value,
          [0, 1],
          [-size * 0.9, size * 0.9],
        ),
      },
      { rotate: '-18deg' },
    ],
  }));

  const iconSize = size * 0.46;

  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: currentCopied }}
      onPressIn={() => {
        pressScale.set(
          reducedMotion ? 1 : withSpring(0.96, { damping: 15, stiffness: 240 }),
        );
      }}
      onPressOut={() => {
        pressScale.set(
          reducedMotion ? 1 : withSpring(1, { damping: 13, stiffness: 220 }),
        );
      }}
      onPress={triggerCopy}
      style={[
        styles.button,
        {
          backgroundColor: resolvedBackground,
          borderColor: dark
            ? 'rgba(255,255,255,0.13)'
            : 'rgba(255,255,255,0.72)',
          borderRadius: size * 0.28,
          boxShadow: dark
            ? '0px 1px 2px rgba(0,0,0,0.35), 0px 12px 32px rgba(0,0,0,0.28)'
            : '0px 1px 2px rgba(0,0,0,0.08), 0px 12px 32px rgba(20,20,40,0.14)',
          height: size,
          width: size,
        },
        style,
        pressStyle,
      ]}
      testID={testID}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            backgroundColor: successColor,
            borderRadius: size,
            height: size * 1.35,
            left: -size * 0.175,
            top: -size * 0.175,
            width: size * 1.35,
          },
          glowStyle,
        ]}
      />
      <View
        pointerEvents="none"
        style={[styles.surface, { borderRadius: size * 0.28 }]}
      >
        <LinearGradient
          colors={[resolvedBackground, resolvedSurfaceEnd]}
          end={{ x: 0.5, y: 1 }}
          start={{ x: 0.5, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 8 }]}
        />
        <Animated.View
          style={[
            styles.sheen,
            { height: size * 1.5, width: Math.max(12, size * 0.24) },
            sheenStyle,
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255,255,255,0)',
              'rgba(255,255,255,0.82)',
              'rgba(255,255,255,0)',
            ]}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.iconContainer,
          { height: iconSize, width: iconSize },
          iconContainerStyle,
        ]}
      >
        <Animated.View style={[styles.copyIcon, copyStyle]}>
          <View
            style={[
              styles.copyBack,
              {
                borderColor: iconColor,
                borderRadius: size * 0.055,
                height: iconSize * 0.68,
                width: iconSize * 0.62,
              },
            ]}
          />
          <View
            style={[
              styles.copyFront,
              {
                borderColor: iconColor,
                borderRadius: size * 0.055,
                height: iconSize * 0.68,
                width: iconSize * 0.62,
              },
            ]}
          />
        </Animated.View>
        <Animated.View style={[styles.checkIcon, checkStyle]}>
          <View
            style={[
              styles.checkFirst,
              { backgroundColor: successColor, width: iconSize * 0.42 },
            ]}
          />
          <View
            style={[
              styles.checkSecond,
              { backgroundColor: successColor, width: iconSize * 0.75 },
            ]}
          />
        </Animated.View>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bubble,
          {
            backgroundColor: iconColor,
            borderColor: dark
              ? 'rgba(255,255,255,0.14)'
              : 'rgba(255,255,255,0.32)',
          },
          bubbleStyle,
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.bubbleText, { fontFamily }]}>{copiedLabel}</Text>
        <View style={[styles.caret, { borderTopColor: iconColor }]} />
      </Animated.View>
    </AnimatedPressable>
  );
});

export default CopyConfirmButton;

const styles = StyleSheet.create({
  bubble: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    position: 'absolute',
  },
  bubbleText: { color: '#FFFFFF', fontSize: 12, lineHeight: 14 },
  button: { alignItems: 'center', justifyContent: 'center' },
  caret: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 5,
    borderRightColor: 'transparent',
    borderRightWidth: 5,
    borderTopWidth: 5,
    bottom: -5,
    left: '50%',
    marginLeft: -5,
    position: 'absolute',
  },
  checkFirst: {
    borderRadius: 2,
    height: 2.5,
    left: 1,
    position: 'absolute',
    top: '55%',
    transform: [{ rotate: '45deg' }],
  },
  checkIcon: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  checkSecond: {
    borderRadius: 2,
    height: 2.5,
    left: '27%',
    position: 'absolute',
    top: '45%',
    transform: [{ rotate: '-48deg' }],
  },
  copyBack: { borderWidth: 1.7, left: 0, position: 'absolute', top: 0 },
  copyFront: { borderWidth: 1.7, bottom: 0, position: 'absolute', right: 0 },
  copyIcon: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  iconContainer: { position: 'relative' },
  glow: { position: 'absolute' },
  sheen: { left: '50%', position: 'absolute', top: '-25%' },
  surface: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

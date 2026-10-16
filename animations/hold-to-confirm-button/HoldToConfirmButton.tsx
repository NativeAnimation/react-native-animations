import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const RING_SEGMENTS = 28;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Imperative controls for the hold button. */
export type HoldToConfirmButtonRef = {
  /** Completes the confirmation immediately. */
  confirm: () => void;
  /** Resets the button to its initial state. */
  reset: () => void;
  /** Starts a programmatic hold. */
  start: () => void;
};

export type HoldToConfirmButtonProps = {
  /** Post-confirmation success wave duration in milliseconds; holdMs is separate. Spring physics and reduced-motion timing are unchanged. @default 520 */
  duration?: number;

  /** Controlled completion state. */
  confirmed?: boolean;
  /** Initial completion state when uncontrolled. @default false */
  defaultConfirmed?: boolean;
  /** Called when the completion state changes. */
  onChange?: (confirmed: boolean) => void;
  /** Called once a hold completes. */
  onConfirm?: () => void;
  /** Hold duration in milliseconds. @default 1200 */
  holdMs?: number;
  /** Progress presentation. @default 'bar' */
  variant?: 'bar' | 'ring';
  /** Idle instruction. @default 'Hold to confirm' */
  label?: string;
  /** Completion text. @default 'Confirmed' */
  doneLabel?: string;
  /** Button width for the bar variant. @default 240 */
  width?: number;
  /** Button height, and ring diameter. @default 56 */
  height?: number;
  /** Base button color. Defaults to a scheme-aware near-black. */
  backgroundColor?: string;
  /** Nearby end color for the material gradient. */
  backgroundEndColor?: string;
  /** Progress color. @default '#6D5DFB' */
  progressColor?: string;
  /** Text and check color. @default '#FFFFFF' */
  textColor?: string;
  /** Font family for the label. */
  fontFamily?: string;
  /** Color treatment, or the device setting when set to auto. @default 'auto' */
  colorScheme?: 'light' | 'dark' | 'auto';
  /** Screen-reader label. @default Uses label */
  accessibilityLabel?: string;
  /** Style for the outer container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier for the interactive control. */
  testID?: string;
};

type RingSegmentProps = {
  index: number;
  progress: SharedValue<number>;
  color: string;
  diameter: number;
};

type CheckMarkProps = {
  color: string;
  progress: SharedValue<number>;
  size: 'compact' | 'large';
};

function CheckMark({ color, progress, size }: CheckMarkProps) {
  const scale = size === 'large' ? 1.18 : 1;
  const shortStrokeStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: '43deg' },
      {
        scaleX: interpolate(
          progress.get(),
          [0.42, 0.66],
          [0, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const longStrokeStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: '-43deg' },
      {
        scaleX: interpolate(
          progress.get(),
          [0.62, 1],
          [0, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View
      style={[
        styles.check,
        {
          height: 18 * scale,
          width: 23 * scale,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.checkStroke,
          {
            backgroundColor: color,
            left: 2.6 * scale,
            top: 8.1 * scale,
            width: 8.25 * scale,
          },
          shortStrokeStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.checkStroke,
          {
            backgroundColor: color,
            left: 8.25 * scale,
            top: 13.4 * scale,
            width: 16.5 * scale,
          },
          longStrokeStyle,
        ]}
      />
    </View>
  );
}

function RingSegment({ index, progress, color, diameter }: RingSegmentProps) {
  const angle = (index / RING_SEGMENTS) * Math.PI * 2 - Math.PI / 2;
  const dotSize = Math.max(3, diameter * 0.055);
  const radius = diameter * 0.43;
  const style = useAnimatedStyle(() => ({
    opacity: progress.get() >= (index + 1) / RING_SEGMENTS ? 1 : 0.16,
    transform: [
      { translateX: Math.cos(angle) * radius },
      { translateY: Math.sin(angle) * radius },
      { scale: progress.get() >= (index + 1) / RING_SEGMENTS ? 1 : 0.72 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ringSegment,
        {
          backgroundColor: color,
          borderRadius: dotSize / 2,
          height: dotSize,
          left: (diameter - dotSize) / 2,
          top: (diameter - dotSize) / 2,
          width: dotSize,
        },
        style,
      ]}
    />
  );
}

/** A press-and-hold confirmation control with bar and circular variants. */
export const HoldToConfirmButton = forwardRef<
  HoldToConfirmButtonRef,
  HoldToConfirmButtonProps
>(function HoldToConfirmButton(
  {
    duration = 520,

    confirmed,
    defaultConfirmed = false,
    onChange,
    onConfirm,
    holdMs = 1200,
    variant = 'bar',
    label = 'Hold to confirm',
    doneLabel = 'Confirmed',
    width = 240,
    height = 56,
    backgroundColor,
    backgroundEndColor,
    progressColor = '#6D5DFB',
    textColor = '#FFFFFF',
    fontFamily,
    colorScheme = 'auto',
    accessibilityLabel = label,
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
  const resolvedBackground = backgroundColor ?? (dark ? '#17171C' : '#25242B');
  const resolvedBackgroundEnd =
    backgroundEndColor ?? (dark ? '#0D0D11' : '#17171C');
  const controlled = confirmed !== undefined;
  const [internalConfirmed, setInternalConfirmed] = useState(defaultConfirmed);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const currentConfirmed = controlled ? confirmed : internalConfirmed;
  const progress = useSharedValue(currentConfirmed ? 1 : 0);
  const holdClock = useSharedValue(currentConfirmed ? 1 : 0);
  const completedOnGesture = useSharedValue(currentConfirmed);
  const checkProgress = useSharedValue(currentConfirmed ? 1 : 0);
  const pressScale = useSharedValue(1);
  const celebration = useSharedValue(currentConfirmed ? 1 : 0);

  const setConfirmed = useCallback(
    (next: boolean, emitConfirm: boolean) => {
      if (!controlled) {
        setInternalConfirmed(next);
      }
      progress.set(next ? 1 : 0);
      holdClock.set(next ? 1 : 0);
      completedOnGesture.set(next);
      checkProgress.set(
        reducedMotion
          ? next
            ? 1
            : 0
          : withTiming(next ? 1 : 0, { duration: 240 }),
      );
      celebration.set(0);
      if (next) {
        celebration.set(
          reducedMotion
            ? 1
            : withTiming(1, {
                duration: Number.isFinite(duration)
                  ? Math.max(0, duration)
                  : 520,
                easing: Easing.out(Easing.cubic),
              }),
        );
        pressScale.set(
          reducedMotion
            ? 1
            : withSpring(1.04, { damping: 49, stiffness: 230 }, () => {
                pressScale.set(withSpring(1, { damping: 47, stiffness: 210 }));
              }),
        );
      }
      onChange?.(next);
      if (next && emitConfirm) {
        onConfirm?.();
      }
    },
    [
      duration,
      checkProgress,
      celebration,
      completedOnGesture,
      controlled,
      holdClock,
      onChange,
      onConfirm,
      progress,
      pressScale,
      reducedMotion,
    ],
  );

  const confirmNow = useCallback(() => {
    if (!currentConfirmed) {
      setConfirmed(true, true);
    }
  }, [currentConfirmed, setConfirmed]);

  const beginHold = useCallback(() => {
    if (currentConfirmed) return;
    progress.set(0);
    holdClock.set(0);
    completedOnGesture.set(false);
    holdClock.set(
      withTiming(
        1,
        { duration: Math.max(1, holdMs), easing: Easing.linear },
        (finished) => {
          if (finished) {
            completedOnGesture.set(true);
            scheduleOnRN(confirmNow);
          }
        },
      ),
    );
    if (!reducedMotion) {
      progress.set(
        withTiming(1, {
          duration: Math.max(1, holdMs),
          easing: Easing.linear,
        }),
      );
    }
  }, [
    completedOnGesture,
    confirmNow,
    currentConfirmed,
    holdClock,
    holdMs,
    progress,
    reducedMotion,
  ]);

  const reset = useCallback(() => setConfirmed(false, false), [setConfirmed]);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (active) setScreenReaderEnabled(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setScreenReaderEnabled,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!controlled) return;
    progress.set(confirmed ? 1 : 0);
    holdClock.set(confirmed ? 1 : 0);
    completedOnGesture.set(Boolean(confirmed));
    checkProgress.set(confirmed ? 1 : 0);
  }, [
    checkProgress,
    completedOnGesture,
    confirmed,
    controlled,
    holdClock,
    progress,
  ]);

  useImperativeHandle(
    ref,
    () => ({ confirm: confirmNow, reset, start: beginHold }),
    [beginHold, confirmNow, reset],
  );

  const gesture = Gesture.LongPress()
    .enabled(!screenReaderEnabled)
    .minDuration(Math.max(1, holdMs))
    .maxDistance(32)
    .onBegin(() => {
      if (currentConfirmed) return;
      pressScale.set(
        reducedMotion ? 1 : withSpring(0.96, { damping: 50, stiffness: 240 }),
      );
      completedOnGesture.set(false);
      holdClock.set(0);
      holdClock.set(
        withTiming(
          1,
          { duration: Math.max(1, holdMs), easing: Easing.linear },
          (finished) => {
            if (finished) {
              completedOnGesture.set(true);
              scheduleOnRN(confirmNow);
            }
          },
        ),
      );
      if (!reducedMotion) {
        progress.set(
          withTiming(1, {
            duration: Math.max(1, holdMs),
            easing: Easing.linear,
          }),
        );
      }
    })
    .onFinalize(() => {
      pressScale.set(
        reducedMotion ? 1 : withSpring(1, { damping: 48, stiffness: 220 }),
      );
      if (!completedOnGesture.get() && !currentConfirmed) {
        holdClock.set(0);
        progress.set(
          reducedMotion ? 0 : withSpring(0, { damping: 50, stiffness: 240 }),
        );
      }
    });

  const isRing = variant === 'ring';
  const outerWidth = isRing ? height : width;

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.get() }],
  }));
  const controlMotionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reducedMotion ? 1 : pressScale.get() }],
  }));
  const successGlowStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion
      ? currentConfirmed
        ? 0.22
        : 0
      : interpolate(celebration.get(), [0, 0.18, 1], [0, 0.34, 0]),
    transform: [
      { scale: interpolate(celebration.get(), [0, 1], [0.72, 1.32]) },
    ],
  }));
  const sheenStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion
      ? 0
      : interpolate(celebration.get(), [0, 0.1, 0.86, 1], [0, 0.7, 0.4, 0]),
    transform: [
      {
        translateX: interpolate(
          celebration.get(),
          [0, 1],
          [-outerWidth * 0.7, outerWidth * 0.7],
        ),
      },
      { rotate: '-18deg' },
    ],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(checkProgress.get(), [0, 0.45], [1, 0]),
  }));
  const doneStyle = useAnimatedStyle(() => ({
    opacity: interpolate(checkProgress.get(), [0.45, 1], [0, 1]),
    transform: [{ scale: interpolate(checkProgress.get(), [0, 1], [0.8, 1]) }],
  }));
  return (
    <GestureDetector gesture={gesture}>
      <AnimatedPressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: currentConfirmed }}
        onAccessibilityTap={confirmNow}
        accessible
        accessibilityActions={[{ name: 'activate', label: 'Activate' }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'activate') confirmNow();
        }}
        onPress={screenReaderEnabled ? confirmNow : undefined}
        style={[
          styles.control,
          {
            backgroundColor: resolvedBackground,
            borderColor: dark
              ? 'rgba(255,255,255,0.13)'
              : 'rgba(255,255,255,0.5)',
            borderRadius: height / 2,
            boxShadow: dark
              ? '0px 1px 2px rgba(0,0,0,0.35), 0px 12px 32px rgba(0,0,0,0.3)'
              : '0px 1px 2px rgba(0,0,0,0.1), 0px 12px 32px rgba(20,20,40,0.18)',
            height,
            width: outerWidth,
          },
          style,
          controlMotionStyle,
        ]}
        testID={testID}
      >
        <LinearGradient
          colors={[resolvedBackground, resolvedBackgroundEnd]}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
          start={{ x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.successGlow,
            {
              backgroundColor: progressColor,
              borderRadius: height / 2,
              height,
              width: isRing ? height : Math.min(width, height * 2.2),
            },
            successGlowStyle,
          ]}
        />
        {!isRing ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.fill,
              { backgroundColor: progressColor, borderRadius: height / 2 },
              fillStyle,
            ]}
          >
            <LinearGradient
              colors={[progressColor, progressColor, 'rgba(255,255,255,0.2)']}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        ) : (
          Array.from({ length: RING_SEGMENTS }, (_, index) => (
            <RingSegment
              color={progressColor}
              diameter={height}
              index={index}
              key={index}
              progress={progress}
            />
          ))
        )}
        <Animated.Text
          style={[
            styles.label,
            {
              color: textColor,
              fontFamily,
              fontSize: Math.max(12, height * 0.25),
            },
            labelStyle,
          ]}
        >
          {isRing ? 'Hold' : label}
        </Animated.Text>
        <Animated.View pointerEvents="none" style={[styles.done, doneStyle]}>
          <View style={!isRing ? styles.checkWithLabel : undefined}>
            <CheckMark
              color={textColor}
              progress={checkProgress}
              size={isRing ? 'large' : 'compact'}
            />
          </View>
          {!isRing ? (
            <Text style={[styles.doneLabel, { color: textColor, fontFamily }]}>
              {doneLabel}
            </Text>
          ) : null}
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sheen,
            { height: height * 1.5, width: Math.max(18, height * 0.28) },
            sheenStyle,
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255,255,255,0)',
              'rgba(255,255,255,0.72)',
              'rgba(255,255,255,0)',
            ]}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </AnimatedPressable>
    </GestureDetector>
  );
});

export default HoldToConfirmButton;

const styles = StyleSheet.create({
  check: { position: 'relative' },
  checkStroke: {
    borderRadius: 1.125,
    height: 2.25,
    position: 'absolute',
    transformOrigin: 'left center',
  },
  checkWithLabel: { marginRight: 9 },
  control: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  done: { alignItems: 'center', flexDirection: 'row', position: 'absolute' },
  doneLabel: { fontSize: 14 },
  fill: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    transformOrigin: 'left',
  },
  label: { position: 'absolute' },
  ringSegment: { position: 'absolute' },
  sheen: { left: '50%', position: 'absolute', top: '-25%' },
  successGlow: { position: 'absolute' },
});

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useColorScheme,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 99;
const DEFAULT_WIDTH = 142;
const DEFAULT_COLLAPSED_WIDTH = 88;
const DEFAULT_HEIGHT = 46;
const DEFAULT_DURATION = 240;
const HOLD_DELAY = 420;
const HOLD_INTERVAL = 110;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

type RollingNumberProps = {
  color: string;
  direction: 1 | -1;
  duration: number;
  fontFamily?: string;
  fontSize: number;
  value: number;
};

function RollingNumber({
  color,
  direction,
  duration,
  fontFamily,
  fontSize,
  value,
}: RollingNumberProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(1);
  const previousValueRef = useRef(value);
  const [roll, setRoll] = useState({ outgoing: value, incoming: value, id: 0 });

  useEffect(() => {
    if (previousValueRef.current === value) return;
    const outgoing = previousValueRef.current;
    previousValueRef.current = value;
    setRoll((current) => ({ outgoing, incoming: value, id: current.id + 1 }));
  }, [value]);

  useLayoutEffect(() => {
    if (roll.id === 0) return;
    progress.set(0);
    progress.set(
      withTiming(1, {
        duration: reducedMotion ? 100 : duration,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [duration, progress, reducedMotion, roll.id]);

  const height = fontSize * 1.35;
  const outgoingStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 1 - progress.value : 1,
    transform: [
      { translateY: reducedMotion ? 0 : -direction * progress.value * height },
    ],
  }));
  const incomingStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? progress.value : 1,
    transform: [
      {
        translateY: reducedMotion
          ? 0
          : direction * (1 - progress.value) * height,
      },
    ],
  }));
  const numberStyle: TextStyle = {
    color,
    fontFamily,
    fontSize,
    fontVariant: ['tabular-nums'],
    height,
    lineHeight: height,
    textAlign: 'center',
  };

  return (
    <View style={[styles.numberClip, { height }]}>
      <Animated.Text style={[styles.rollingText, numberStyle, outgoingStyle]}>
        {roll.outgoing}
      </Animated.Text>
      <Animated.Text style={[styles.rollingText, numberStyle, incomingStyle]}>
        {roll.incoming}
      </Animated.Text>
    </View>
  );
}

/** Imperative controls for the quantity stepper. */
export type QuantityStepperRef = {
  /** Adds one item, respecting the maximum. */
  increment: () => void;
  /** Removes one item, respecting the minimum. */
  decrement: () => void;
  /** Requests a clamped quantity. */
  setValue: (value: number) => void;
  /** Returns to the configured minimum. */
  reset: () => void;
};

export type QuantityStepperProps = {
  /** Controlled quantity. */
  value?: number;
  /** Initial quantity when uncontrolled. @default 0 */
  defaultValue?: number;
  /** Called when a new quantity is requested. */
  onChange?: (value: number) => void;
  /** Minimum quantity. @default 0 */
  min?: number;
  /** Maximum quantity. @default 99 */
  max?: number;
  /** Main control color. @default '#6757E8' */
  accentColor?: string;
  /** Text color while expanded. @default '#FFFFFF' */
  textColor?: string;
  /** Label shown at the minimum. @default 'Add' */
  addLabel?: string;
  /** Expanded width in points. @default 142 */
  width?: number;
  /** Collapsed width in points. @default 88 */
  collapsedWidth?: number;
  /** Control height in points. @default 46 */
  height?: number;
  /** Expand/collapse duration in milliseconds. @default 240 */
  duration?: number;
  /** Font family for labels and numbers. @default System font */
  fontFamily?: string;
  /** Color appearance. @default 'auto' */
  colorScheme?: 'light' | 'dark' | 'auto';
  /** Repeats changes while plus or minus is held. @default true */
  repeatOnHold?: boolean;
  /** Screen-reader label for the Add button. @default 'Add item' */
  addAccessibilityLabel?: string;
  /** Screen-reader label for the plus button. @default 'Increase quantity' */
  incrementAccessibilityLabel?: string;
  /** Screen-reader label for the minus button. @default 'Decrease quantity' */
  decrementAccessibilityLabel?: string;
  /** Optional style for the outer control. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier applied to the outer control. */
  testID?: string;
};

/** An Add button that expands into a rolling quantity control. */
export const QuantityStepper = forwardRef<
  QuantityStepperRef,
  QuantityStepperProps
>(function QuantityStepper(
  {
    value,
    defaultValue = DEFAULT_MIN,
    onChange,
    min = DEFAULT_MIN,
    max = DEFAULT_MAX,
    accentColor = '#6757E8',
    textColor = '#FFFFFF',
    addLabel = 'Add',
    width = DEFAULT_WIDTH,
    collapsedWidth = DEFAULT_COLLAPSED_WIDTH,
    height = DEFAULT_HEIGHT,
    duration = DEFAULT_DURATION,
    fontFamily,
    colorScheme = 'auto',
    repeatOnHold = true,
    addAccessibilityLabel = 'Add item',
    incrementAccessibilityLabel = 'Increase quantity',
    decrementAccessibilityLabel = 'Decrease quantity',
    style,
    testID,
  },
  ref,
) {
  const systemColorScheme = useColorScheme();
  const dark =
    colorScheme === 'dark' ||
    (colorScheme === 'auto' && systemColorScheme === 'dark');
  const lowerBound = Math.min(min, max);
  const upperBound = Math.max(min, max);
  const initialValue = clamp(value ?? defaultValue, lowerBound, upperBound);
  const [internalValue, setInternalValue] = useState(initialValue);
  const [direction, setDirection] = useState<1 | -1>(1);
  const reducedMotion = useReducedMotion();
  const displayedValue = clamp(
    value === undefined ? internalValue : value,
    lowerBound,
    upperBound,
  );
  const valueRef = useRef(displayedValue);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const repeatedRef = useRef(false);
  const expanded = displayedValue > lowerBound;
  const expandProgress = useSharedValue(expanded ? 1 : 0);
  const pressScale = useSharedValue(1);
  const expansionBurst = useSharedValue(1);
  const effectiveAccent =
    accentColor === '#6757E8' && dark ? '#7867F2' : accentColor;

  useEffect(() => {
    valueRef.current = displayedValue;
  }, [displayedValue]);

  useEffect(() => {
    expandProgress.set(
      reducedMotion
        ? expanded
          ? 1
          : 0
        : withSpring(expanded ? 1 : 0, {
            damping: 15,
            stiffness: 220,
            mass: 0.8,
          }),
    );
    if (expanded && !reducedMotion) {
      expansionBurst.set(0);
      expansionBurst.set(
        withTiming(1, {
          duration: Math.min(560, duration * 2.2),
          easing: Easing.out(Easing.cubic),
        }),
      );
    } else {
      expansionBurst.set(1);
    }
  }, [duration, expandProgress, expanded, expansionBurst, reducedMotion]);

  const clearHold = useCallback(() => {
    if (holdTimeoutRef.current !== null) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current !== null) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  useEffect(() => clearHold, [clearHold]);

  const requestValue = useCallback(
    (requested: number) => {
      const next = clamp(requested, lowerBound, upperBound);
      if (next === valueRef.current) return;
      setDirection(next > valueRef.current ? 1 : -1);
      valueRef.current = next;
      if (value === undefined) setInternalValue(next);
      onChange?.(next);
    },
    [lowerBound, onChange, upperBound, value],
  );

  const changeBy = useCallback(
    (stepDirection: 1 | -1) => requestValue(valueRef.current + stepDirection),
    [requestValue],
  );

  const startHold = useCallback(
    (stepDirection: 1 | -1) => {
      clearHold();
      repeatedRef.current = false;
      pressScale.set(reducedMotion ? 1 : withTiming(0.95, { duration: 90 }));
      if (!repeatOnHold) return;
      holdTimeoutRef.current = setTimeout(() => {
        repeatedRef.current = true;
        changeBy(stepDirection);
        holdIntervalRef.current = setInterval(
          () => changeBy(stepDirection),
          HOLD_INTERVAL,
        );
      }, HOLD_DELAY);
    },
    [changeBy, clearHold, pressScale, reducedMotion, repeatOnHold],
  );

  const endHold = useCallback(() => {
    clearHold();
    pressScale.set(
      reducedMotion
        ? 1
        : withSpring(1, { damping: 14, stiffness: 320, mass: 0.6 }),
    );
  }, [clearHold, pressScale, reducedMotion]);

  const pressAddIn = useCallback(() => {
    pressScale.set(reducedMotion ? 1 : withTiming(0.96, { duration: 90 }));
  }, [pressScale, reducedMotion]);

  const finishPress = useCallback(
    (stepDirection: 1 | -1) => {
      if (!repeatedRef.current) changeBy(stepDirection);
      repeatedRef.current = false;
    },
    [changeBy],
  );

  useImperativeHandle(
    ref,
    () => ({
      increment: () => changeBy(1),
      decrement: () => changeBy(-1),
      setValue: requestValue,
      reset: () => requestValue(lowerBound),
    }),
    [changeBy, lowerBound, requestValue],
  );

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
    width: collapsedWidth + (width - collapsedWidth) * expandProgress.value,
  }));
  const addStyle = useAnimatedStyle(() => ({
    opacity: 1 - expandProgress.value,
  }));
  const controlsStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
    transform: [{ scale: 0.9 + 0.1 * expandProgress.value }],
  }));
  const burstStyle = useAnimatedStyle(() => ({
    borderColor: effectiveAccent,
    opacity: expanded ? 0.48 * (1 - expansionBurst.value) : 0,
    transform: [{ scale: 0.96 + expansionBurst.value * 0.18 }],
  }));
  const sheenStyle = useAnimatedStyle(() => ({
    opacity: expanded ? 0.75 * (1 - expansionBurst.value) : 0,
    transform: [
      {
        translateX: -height + expansionBurst.value * (width + height * 1.5),
      },
      { rotate: '16deg' },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: effectiveAccent, borderRadius: height / 2, height },
        style,
        containerStyle,
      ]}
      testID={testID}
    >
      <LinearGradient
        colors={
          dark
            ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']
            : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']
        }
        end={{ x: 0.8, y: 1 }}
        pointerEvents="none"
        start={{ x: 0.2, y: 0 }}
        style={styles.surface}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.burstRing, burstStyle]}
      />
      <View pointerEvents="none" style={styles.sheenClip}>
        <Animated.View style={[styles.sheen, sheenStyle]}>
          <LinearGradient
            colors={[
              'rgba(255,255,255,0)',
              'rgba(255,255,255,0.92)',
              'rgba(255,255,255,0)',
            ]}
            end={{ x: 1, y: 0.5 }}
            start={{ x: 0, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <Animated.View
        pointerEvents={expanded ? 'none' : 'auto'}
        style={[styles.layer, addStyle]}
      >
        <Pressable
          accessibilityLabel={addAccessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: upperBound <= lowerBound }}
          disabled={upperBound <= lowerBound}
          onPress={() => requestValue(Math.min(upperBound, lowerBound + 1))}
          onPressIn={pressAddIn}
          onPressOut={endHold}
          style={styles.fullPressable}
        >
          <Animated.Text
            style={[styles.addText, { color: textColor, fontFamily }]}
          >
            {addLabel}
          </Animated.Text>
        </Pressable>
      </Animated.View>

      <Animated.View
        pointerEvents={expanded ? 'auto' : 'none'}
        style={[styles.layer, styles.controls, controlsStyle]}
      >
        <Pressable
          accessibilityLabel={decrementAccessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: displayedValue <= lowerBound }}
          disabled={displayedValue <= lowerBound}
          onPress={() => finishPress(-1)}
          onPressIn={() => startHold(-1)}
          onPressOut={endHold}
          style={styles.stepButton}
        >
          <View style={[styles.symbolBar, { backgroundColor: textColor }]} />
        </Pressable>

        <RollingNumber
          color={textColor}
          direction={direction}
          duration={duration}
          fontFamily={fontFamily}
          fontSize={16}
          value={displayedValue}
        />

        <Pressable
          accessibilityLabel={incrementAccessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: displayedValue >= upperBound }}
          disabled={displayedValue >= upperBound}
          onPress={() => finishPress(1)}
          onPressIn={() => startHold(1)}
          onPressOut={endHold}
          style={styles.stepButton}
        >
          <View style={[styles.symbolBar, { backgroundColor: textColor }]} />
          <View
            style={[
              styles.symbolBar,
              styles.verticalBar,
              { backgroundColor: textColor },
            ]}
          />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  addText: { fontSize: 15 },
  container: {
    alignSelf: 'flex-start',
    borderColor: 'rgba(255,255,255,0.46)',
    borderWidth: 1,
    boxShadow:
      '0px 1px 2px rgba(16,16,32,0.12), 0px 12px 32px rgba(70,54,150,0.24)',
    overflow: 'hidden',
    position: 'relative',
  },
  burstRing: {
    borderRadius: 999,
    borderWidth: 2,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fullPressable: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  layer: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  numberClip: { minWidth: 34, overflow: 'hidden', position: 'relative' },
  rollingText: { left: 0, position: 'absolute', right: 0, top: 0 },
  sheen: {
    bottom: -10,
    position: 'absolute',
    top: -10,
    width: 22,
  },
  sheenClip: {
    borderRadius: 999,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  stepButton: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: 44,
  },
  symbolBar: { borderRadius: 1, height: 2, width: 14 },
  surface: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  verticalBar: { position: 'absolute', transform: [{ rotate: '90deg' }] },
});

export default QuantityStepper;

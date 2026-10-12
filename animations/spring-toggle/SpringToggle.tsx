import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const SIZE_MAP = {
  sm: { width: 44, height: 26, inset: 3 },
  md: { width: 56, height: 32, inset: 4 },
  lg: { width: 68, height: 38, inset: 4 },
} as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type SpringToggleSize = keyof typeof SIZE_MAP;
export type SpringToggleIcon = 'none' | 'sun-moon' | 'check';
export type SpringToggleColorScheme = 'light' | 'dark' | 'auto';

/** Imperative controls for SpringToggle. */
export type SpringToggleRef = {
  /** Toggles the current value. */
  toggle: () => void;
  /** Sets or requests a value. */
  setValue: (value: boolean) => void;
};

export type SpringToggleProps = {
  /** Controlled value. */
  value?: boolean;
  /** Initial value when uncontrolled. @default false */
  defaultValue?: boolean;
  /** Called when a gesture, press, or ref requests a value. */
  onValueChange?: (value: boolean) => void;
  /** Preset control size. @default 'md' */
  size?: SpringToggleSize;
  /** Track color when on. @default '#625BF6' */
  onColor?: string;
  /** Track color when off. @default '#D7D7DE' */
  offColor?: string;
  /** Appearance used for the thumb and material details. @default 'auto' */
  colorScheme?: SpringToggleColorScheme;
  /** Glow color behind the active thumb. Defaults to `onColor`. */
  glowColor?: string;
  /** Optional icon drawn inside the thumb. @default 'none' */
  thumbIcon?: SpringToggleIcon;
  /** Spring damping. @default 18 */
  springDamping?: number;
  /** Spring stiffness. @default 280 */
  springStiffness?: number;
  /** Screen-reader label. @default 'Toggle setting' */
  accessibilityLabel?: string;
  /** Optional outer style. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier. */
  testID?: string;
};

/** A draggable switch with a thumb that stretches through its spring travel. */
export const SpringToggle = forwardRef<SpringToggleRef, SpringToggleProps>(
  function SpringToggle(
    {
      value,
      defaultValue = false,
      onValueChange,
      size = 'md',
      onColor = '#625BF6',
      offColor = '#D7D7DE',
      colorScheme = 'auto',
      glowColor = onColor,
      thumbIcon = 'none',
      springDamping = 18,
      springStiffness = 280,
      accessibilityLabel = 'Toggle setting',
      style,
      testID,
    },
    ref,
  ) {
    const reducedMotion = useReducedMotion();
    const systemColorScheme = useColorScheme();
    const isDark =
      colorScheme === 'dark' ||
      (colorScheme === 'auto' && systemColorScheme === 'dark');
    const preset = SIZE_MAP[size];
    const thumbSize = preset.height - 2 * preset.inset;
    const travel = preset.width - 2 * preset.inset - thumbSize;
    const initialValue = value ?? defaultValue;
    const [internalValue, setInternalValue] = useState(initialValue);
    const currentValue = value ?? internalValue;
    const valueRef = useRef(currentValue);
    const progress = useSharedValue(currentValue ? 1 : 0);
    const dragStart = useSharedValue(0);
    const pressScale = useSharedValue(1);
    const glow = useSharedValue(currentValue ? 1 : 0);
    const success = useSharedValue(0);

    const animateTo = useCallback(
      (next: boolean) => {
        valueRef.current = next;
        progress.set(
          reducedMotion
            ? next
              ? 1
              : 0
            : withSpring(next ? 1 : 0, {
                damping: springDamping,
                stiffness: springStiffness,
                mass: 0.75,
              }),
        );
        glow.set(
          reducedMotion
            ? next
              ? 1
              : 0
            : withSpring(next ? 1 : 0, { damping: 16, stiffness: 220 }),
        );
        if (next && !reducedMotion) {
          success.set(
            withSequence(
              withTiming(1, { duration: 90 }),
              withSpring(0, { damping: 13, stiffness: 240 }),
            ),
          );
        }
      },
      [glow, progress, reducedMotion, springDamping, springStiffness, success],
    );

    const requestValue = useCallback(
      (next: boolean) => {
        animateTo(next);
        if (value === undefined) {
          setInternalValue(next);
        }
        onValueChange?.(next);
      },
      [animateTo, onValueChange, value],
    );

    useEffect(() => {
      if (value !== undefined) {
        animateTo(value);
      }
    }, [animateTo, value]);

    useImperativeHandle(
      ref,
      () => ({
        toggle: () => requestValue(!valueRef.current),
        setValue: requestValue,
      }),
      [requestValue],
    );

    const gesture = useMemo(() => {
      const pan = Gesture.Pan()
        .minDistance(3)
        .onBegin(() => {
          dragStart.set(progress.get());
        })
        .onUpdate((event) => {
          progress.set(
            Math.max(
              0,
              Math.min(1, dragStart.get() + event.translationX / travel),
            ),
          );
        })
        .onEnd((event) => {
          const next =
            Math.abs(event.velocityX) > 280
              ? event.velocityX > 0
              : progress.get() >= 0.5;
          scheduleOnRN(requestValue, next);
        });
      return pan;
    }, [dragStart, progress, requestValue, travel]);

    const trackStyle = useAnimatedStyle(() => ({
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [offColor, onColor],
      ),
    }));
    const pressStyle = useAnimatedStyle(() => ({
      transform: [{ scale: reducedMotion ? 1 : pressScale.value }],
    }));
    const thumbStyle = useAnimatedStyle(() => {
      const stretch = interpolate(progress.value, [0, 0.5, 1], [1, 1.25, 1]);
      return {
        transform: [
          { translateX: progress.value * travel },
          { scaleX: reducedMotion ? 1 : stretch },
          { scale: reducedMotion ? 1 : 1 + success.value * 0.09 },
        ],
      };
    });
    const glowStyle = useAnimatedStyle(() => ({
      opacity: 0.18 + glow.value * 0.3,
      transform: [
        { translateX: progress.value * travel },
        {
          scale: reducedMotion
            ? 1
            : 0.82 + glow.value * 0.32 + success.value * 0.2,
        },
      ],
    }));
    const sheenStyle = useAnimatedStyle(() => ({
      opacity: reducedMotion ? 0 : success.value * 0.72,
      transform: [
        { translateX: progress.value * travel + thumbSize * 0.15 },
        { rotate: '-18deg' },
      ],
    }));
    const sunStyle = useAnimatedStyle(() => ({
      opacity: 1 - progress.value,
      transform: [{ scale: interpolate(progress.value, [0, 1], [1, 0.65]) }],
    }));
    const moonStyle = useAnimatedStyle(() => ({
      opacity: progress.value,
      transform: [{ scale: interpolate(progress.value, [0, 1], [0.65, 1]) }],
    }));
    const checkStyle = useAnimatedStyle(() => ({
      opacity: progress.value,
      transform: [{ scale: interpolate(progress.value, [0, 1], [0.65, 1]) }],
    }));

    return (
      <AnimatedPressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="switch"
        accessibilityState={{ checked: currentValue }}
        onPress={() => requestValue(!valueRef.current)}
        onPressIn={() => {
          pressScale.set(
            reducedMotion
              ? 1
              : withSpring(0.96, { damping: 18, stiffness: 320 }),
          );
        }}
        onPressOut={() => {
          pressScale.set(
            reducedMotion ? 1 : withSpring(1, { damping: 13, stiffness: 240 }),
          );
        }}
        style={[style, pressStyle]}
        testID={testID}
      >
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              styles.track,
              {
                borderColor: isDark
                  ? 'rgba(255,255,255,0.13)'
                  : 'rgba(255,255,255,0.58)',
                borderRadius: preset.height / 2,
                height: preset.height,
                padding: preset.inset,
                width: preset.width,
              },
              trackStyle,
            ]}
          >
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(255,255,255,0.13)', 'rgba(255,255,255,0.01)']
                  : ['rgba(255,255,255,0.52)', 'rgba(255,255,255,0.04)']
              }
              end={{ x: 0.5, y: 1 }}
              pointerEvents="none"
              start={{ x: 0.5, y: 0 }}
              style={styles.materialLight}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.glow,
                {
                  backgroundColor: glowColor,
                  borderRadius: thumbSize / 2,
                  height: thumbSize,
                  left: preset.inset,
                  width: thumbSize,
                },
                glowStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.thumb,
                {
                  backgroundColor: isDark ? '#F7F7FB' : '#FFFFFF',
                  borderRadius: thumbSize / 2,
                  height: thumbSize,
                  width: thumbSize,
                },
                thumbStyle,
              ]}
            >
              {thumbIcon === 'sun-moon' ? (
                <>
                  <Animated.View style={[styles.iconLayer, sunStyle]}>
                    <View
                      style={[
                        styles.sunCore,
                        {
                          borderRadius: thumbSize * 0.13,
                          height: thumbSize * 0.26,
                          width: thumbSize * 0.26,
                        },
                      ]}
                    />
                    {[0, 45, 90, 135].map((rotation) => (
                      <View
                        key={rotation}
                        style={[
                          styles.sunRay,
                          {
                            height: thumbSize * 0.05,
                            transform: [{ rotate: `${rotation}deg` }],
                            width: thumbSize * 0.58,
                          },
                        ]}
                      />
                    ))}
                  </Animated.View>
                  <Animated.View style={[styles.iconLayer, moonStyle]}>
                    <View
                      style={[
                        styles.moon,
                        {
                          backgroundColor: onColor,
                          borderRadius: thumbSize * 0.18,
                          height: thumbSize * 0.38,
                          width: thumbSize * 0.38,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.moonCutout,
                          {
                            borderRadius: thumbSize * 0.16,
                            height: thumbSize * 0.34,
                            width: thumbSize * 0.34,
                          },
                        ]}
                      />
                    </View>
                  </Animated.View>
                </>
              ) : null}
              {thumbIcon === 'check' ? (
                <Animated.View style={[styles.iconLayer, checkStyle]}>
                  <View
                    style={[
                      styles.checkShort,
                      {
                        backgroundColor: onColor,
                        height: thumbSize * 0.08,
                        width: thumbSize * 0.22,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.checkLong,
                      {
                        backgroundColor: onColor,
                        height: thumbSize * 0.08,
                        width: thumbSize * 0.42,
                      },
                    ]}
                  />
                </Animated.View>
              ) : null}
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.sheen,
                {
                  borderRadius: thumbSize,
                  height: thumbSize * 1.4,
                  left: preset.inset,
                  width: thumbSize * 0.34,
                },
                sheenStyle,
              ]}
            />
          </Animated.View>
        </GestureDetector>
      </AnimatedPressable>
    );
  },
);

const styles = StyleSheet.create({
  checkLong: {
    borderRadius: 99,
    left: '43%',
    position: 'absolute',
    top: '46%',
    transform: [{ rotate: '-48deg' }],
  },
  checkShort: {
    borderRadius: 99,
    left: '27%',
    position: 'absolute',
    top: '55%',
    transform: [{ rotate: '42deg' }],
  },
  iconLayer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  glow: {
    boxShadow: '0px 0px 14px rgba(110,86,255,0.42)',
    position: 'absolute',
  },
  materialLight: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  moon: {
    overflow: 'hidden',
  },
  moonCutout: {
    backgroundColor: '#FFFFFF',
    left: '34%',
    position: 'absolute',
    top: '-12%',
  },
  sunCore: { backgroundColor: '#F1A928' },
  sunRay: {
    backgroundColor: '#F1A928',
    borderRadius: 99,
    position: 'absolute',
  },
  thumb: {
    alignItems: 'center',
    boxShadow:
      '0px 1px 2px rgba(16,16,32,0.12), 0px 7px 16px rgba(16,16,32,0.2)',
    justifyContent: 'center',
    transformOrigin: 'center',
  },
  sheen: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    position: 'absolute',
  },
  track: { borderWidth: 1, justifyContent: 'center', overflow: 'hidden' },
});

export default SpringToggle;

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
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Canvas,
  Circle,
  Group,
  Path,
  RoundedRect,
  Skia,
} from '@shopify/react-native-skia';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const CHECK_SPRING = { damping: 20, stiffness: 360, mass: 0.8 };
const PRESS_SPRING = { damping: 24, stiffness: 380, mass: 0.8 };

export type DrawnCheckboxColorScheme = 'light' | 'dark' | 'auto';

/** Imperative controls for DrawnCheckbox. */
export type DrawnCheckboxRef = {
  /** Toggles between checked and unchecked. */
  toggle: () => void;
  /** Sets or requests checked state. */
  setChecked: (checked: boolean) => void;
};

export type DrawnCheckboxProps = {
  /** Controlled checked state. */
  checked?: boolean;
  /** Initial checked state when uncontrolled. @default false */
  defaultChecked?: boolean;
  /** Displays a mixed-state dash. @default false */
  indeterminate?: boolean;
  /** Called when a press or ref requests checked state. */
  onChange?: (checked: boolean) => void;
  /** Optional pressable label. */
  label?: string;
  /** Checkbox width and height. @default 24 */
  size?: number;
  /** Corner radius. @default 7 */
  radius?: number;
  /** Checked fill color. @default '#6E56FF' */
  color?: string;
  /** Unchecked border color. @default '#B8B5C4' */
  borderColor?: string;
  /** Appearance used for the material and label defaults. @default 'auto' */
  colorScheme?: DrawnCheckboxColorScheme;
  /** Color of the completion glow. Defaults to `color`. */
  glowColor?: string;
  /** Check and dash color. @default '#FFFFFF' */
  markColor?: string;
  /** Check drawing duration in milliseconds. @default 240 */
  duration?: number;
  /** Label color. Uses a high-contrast theme color when omitted. */
  labelColor?: string;
  /** Label font family. @default System font */
  fontFamily?: string;
  /** Screen-reader label. Defaults to `label` or 'Checkbox'. */
  accessibilityLabel?: string;
  /** Optional outer style. */
  style?: StyleProp<ViewStyle>;
  /** Optional label style. */
  labelStyle?: StyleProp<TextStyle>;
  /** Test identifier. */
  testID?: string;
};

/** A tactile checkbox with a center-out fill, drawn mark, and animated strike-through. */
export const DrawnCheckbox = forwardRef<DrawnCheckboxRef, DrawnCheckboxProps>(
  function DrawnCheckbox(
    {
      checked,
      defaultChecked = false,
      indeterminate = false,
      onChange,
      label,
      size = 24,
      radius = 7,
      color = '#6E56FF',
      borderColor = '#B8B5C4',
      colorScheme = 'auto',
      glowColor = color,
      markColor = '#FFFFFF',
      duration = 240,
      labelColor,
      fontFamily,
      accessibilityLabel = label ?? 'Checkbox',
      style,
      labelStyle,
      testID,
    },
    ref,
  ) {
    const reducedMotion = useReducedMotion();
    const systemColorScheme = useColorScheme();
    const isDark =
      colorScheme === 'dark' ||
      (colorScheme === 'auto' && systemColorScheme === 'dark');
    const [internalChecked, setInternalChecked] = useState(
      checked ?? defaultChecked,
    );
    const currentChecked = checked ?? internalChecked;
    const checkedRef = useRef(currentChecked);
    const active = currentChecked || indeterminate;
    const progress = useSharedValue(active ? 1 : 0);
    const markProgress = useSharedValue(active ? 1 : 0);
    const pressScale = useSharedValue(1);
    const haloProgress = useSharedValue(1);
    const labelWidth = useSharedValue(0);
    const safeSize = Math.max(18, size);
    const safeRadius = Math.max(0, Math.min(radius, safeSize / 2));
    const safeDuration = Math.max(0, duration);
    const resolvedLabelColor = labelColor ?? (isDark ? '#F4F4F8' : '#17171D');

    const requestChecked = useCallback(
      (next: boolean) => {
        checkedRef.current = next;
        if (checked === undefined) setInternalChecked(next);
        onChange?.(next);
      },
      [checked, onChange],
    );

    useImperativeHandle(
      ref,
      () => ({
        toggle: () => requestChecked(!checkedRef.current),
        setChecked: requestChecked,
      }),
      [requestChecked],
    );

    useEffect(() => {
      checkedRef.current = currentChecked;
      if (reducedMotion) {
        progress.set(active ? 1 : 0);
        markProgress.set(active ? 1 : 0);
        haloProgress.set(1);
        return;
      }
      if (active) {
        progress.set(withSpring(1, CHECK_SPRING));
        markProgress.set(
          withDelay(
            70,
            withTiming(1, {
              duration: safeDuration,
              easing: Easing.bezier(0.23, 1, 0.32, 1),
            }),
          ),
        );
        haloProgress.set(0);
        haloProgress.set(
          withTiming(1, {
            duration: 480,
            easing: Easing.out(Easing.cubic),
          }),
        );
      } else {
        markProgress.set(
          withTiming(0, {
            duration: Math.round(safeDuration * 0.65),
            easing: Easing.out(Easing.cubic),
          }),
        );
        progress.set(withDelay(70, withSpring(0, CHECK_SPRING)));
        haloProgress.set(1);
      }
    }, [
      active,
      currentChecked,
      haloProgress,
      markProgress,
      progress,
      reducedMotion,
      safeDuration,
    ]);

    const checkPath = useMemo(() => {
      const path = Skia.Path.Make();
      path.moveTo(safeSize * 0.24, safeSize * 0.52);
      path.lineTo(safeSize * 0.43, safeSize * 0.7);
      path.lineTo(safeSize * 0.77, safeSize * 0.33);
      return path;
    }, [safeSize]);
    const dashPath = useMemo(() => {
      const path = Skia.Path.Make();
      path.moveTo(safeSize * 0.27, safeSize * 0.5);
      path.lineTo(safeSize * 0.73, safeSize * 0.5);
      return path;
    }, [safeSize]);
    const fillClip = useMemo(
      () =>
        Skia.RRectXY(
          Skia.XYWHRect(0.75, 0.75, safeSize - 1.5, safeSize - 1.5),
          Math.max(0, safeRadius - 0.75),
          Math.max(0, safeRadius - 0.75),
        ),
      [safeRadius, safeSize],
    );
    const fillRadius = useDerivedValue(() => progress.value * safeSize * 0.72);
    const pressStyle = useAnimatedStyle(() => ({
      transform: [{ scale: reducedMotion ? 1 : pressScale.value }],
    }));
    const labelAnimatedStyle = useAnimatedStyle(() => ({
      opacity: interpolate(progress.value, [0, 1], [1, 0.5]),
    }));
    const strikeStyle = useAnimatedStyle(() => ({
      opacity: progress.value,
      width: labelWidth.value * progress.value,
    }));
    const haloStyle = useAnimatedStyle(() => ({
      opacity: reducedMotion ? 0 : 0.34 * (1 - haloProgress.value),
      transform: [{ scale: 0.8 + haloProgress.value * 0.85 }],
    }));

    const handleLabelLayout = useCallback(
      (event: LayoutChangeEvent) => {
        labelWidth.set(event.nativeEvent.layout.width);
      },
      [labelWidth],
    );

    return (
      <AnimatedPressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="checkbox"
        accessibilityState={{
          checked: indeterminate ? 'mixed' : currentChecked,
        }}
        onPress={() => requestChecked(indeterminate || !checkedRef.current)}
        onPressIn={() => {
          pressScale.set(reducedMotion ? 1 : withSpring(0.97, PRESS_SPRING));
        }}
        onPressOut={() => {
          pressScale.set(reducedMotion ? 1 : withSpring(1, PRESS_SPRING));
        }}
        style={[styles.container, style, pressStyle]}
        testID={testID}
      >
        <View
          style={[
            styles.box,
            {
              borderRadius: safeRadius,
              height: safeSize,
              width: safeSize,
            },
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.halo,
              {
                borderColor: glowColor,
                borderRadius: safeSize,
                height: safeSize,
                width: safeSize,
              },
              haloStyle,
            ]}
          />
          <Canvas style={styles.canvas}>
            <RoundedRect
              color={borderColor}
              height={safeSize}
              r={safeRadius}
              strokeWidth={1.5}
              style="stroke"
              width={safeSize}
              x={0}
              y={0}
            />
            <Group clip={fillClip}>
              <Circle
                color={color}
                cx={safeSize / 2}
                cy={safeSize / 2}
                r={fillRadius}
              />
            </Group>
            <Path
              color={markColor}
              end={markProgress}
              path={indeterminate ? dashPath : checkPath}
              strokeCap="round"
              strokeJoin="round"
              strokeWidth={Math.max(2, safeSize * 0.105)}
              style="stroke"
            />
          </Canvas>
          <LinearGradient
            colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
            end={{ x: 0.5, y: 1 }}
            pointerEvents="none"
            start={{ x: 0.5, y: 0 }}
            style={[styles.highlight, { borderRadius: safeRadius }]}
          />
        </View>
        {label ? (
          <View onLayout={handleLabelLayout} style={styles.labelWrap}>
            <Animated.Text
              numberOfLines={2}
              style={[
                styles.label,
                { color: resolvedLabelColor, fontFamily },
                labelStyle,
                labelAnimatedStyle,
              ]}
            >
              {label}
            </Animated.Text>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.strike,
                { backgroundColor: resolvedLabelColor },
                strikeStyle,
              ]}
            />
          </View>
        ) : null}
      </AnimatedPressable>
    );
  },
);

const styles = StyleSheet.create({
  box: {
    boxShadow:
      '0px 1px 2px rgba(16,16,32,0.12), 0px 7px 16px rgba(45,38,95,0.13)',
  },
  canvas: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minHeight: 44,
  },
  halo: {
    borderWidth: 1.5,
    boxShadow: '0px 0px 18px rgba(110,86,255,0.32)',
    position: 'absolute',
  },
  highlight: {
    bottom: 1,
    left: 1,
    position: 'absolute',
    right: 1,
    top: 1,
  },
  label: {
    fontSize: 15,
    letterSpacing: -0.12,
    lineHeight: 21,
  },
  labelWrap: {
    flexShrink: 1,
    marginLeft: 12,
  },
  strike: {
    borderRadius: 1,
    height: 1.5,
    left: 0,
    position: 'absolute',
    top: '50%',
  },
});

export default DrawnCheckbox;

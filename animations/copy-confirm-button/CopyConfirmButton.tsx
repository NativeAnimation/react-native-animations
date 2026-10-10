import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Canvas,
  Group,
  Path,
  RoundedRect,
  Skia,
} from '@shopify/react-native-skia';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SUCCESS_DURATION = 1400;
const PRESS_SPRING = { damping: 20, stiffness: 360, mass: 0.7 };

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
  /** Performs the product's copy operation. */
  onCopy: () => void;
  /** Called when the requested feedback state changes. */
  onChange?: (copied: boolean) => void;
  /** Time before uncontrolled feedback resets. @default 1400 */
  resetMs?: number;
  /** Button size. @default 52 */
  size?: number;
  /** Resting button color. Defaults to a scheme-aware neutral. */
  backgroundColor?: string;
  /** Bottom surface color kept for API compatibility. */
  surfaceEndColor?: string;
  /** Resting copy icon color. Defaults to a scheme-aware neutral. */
  iconColor?: string;
  /** Success surface and glow color. @default '#6E56FF' */
  successColor?: string;
  /** Confirmation label. @default 'Copied' */
  copiedLabel?: string;
  /** Font family for the confirmation label. */
  fontFamily?: string;
  /** Color treatment, or the device setting when set to auto. @default 'auto' */
  colorScheme?: 'light' | 'dark' | 'auto';
  /** Screen-reader label. @default 'Copy value' */
  accessibilityLabel?: string;
  /** Style for the button container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier for the button. */
  testID?: string;
};

/** A tactile copy action that morphs into a drawn check and emits glass feedback. */
export const CopyConfirmButton = forwardRef<
  CopyConfirmButtonRef,
  CopyConfirmButtonProps
>(function CopyConfirmButton(
  {
    copied,
    defaultCopied = false,
    onCopy,
    onChange,
    resetMs = SUCCESS_DURATION,
    size = 52,
    backgroundColor,
    surfaceEndColor,
    iconColor,
    successColor = '#6E56FF',
    copiedLabel = 'Copied',
    fontFamily,
    colorScheme = 'auto',
    accessibilityLabel = 'Copy value',
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
  const resolvedBackground = backgroundColor ?? (dark ? '#23232E' : '#FFFFFF');
  const resolvedSurfaceEnd = surfaceEndColor ?? resolvedBackground;
  const resolvedIcon = iconColor ?? (dark ? '#F4F4F8' : '#34343D');
  const controlled = copied !== undefined;
  const [internalCopied, setInternalCopied] = useState(defaultCopied);
  const [measuredSize, setMeasuredSize] = useState(size);
  const currentCopied = controlled ? copied : internalCopied;
  const progress = useSharedValue(currentCopied ? 1 : 0);
  const feedback = useSharedValue(currentCopied ? 1 : 0);
  const pressScale = useSharedValue(1);

  const copyPath = useMemo(() => {
    const path = Skia.Path.Make();
    const unit = measuredSize / 52;
    path.addRRect(
      Skia.RRectXY(
        Skia.XYWHRect(15 * unit, 13 * unit, 18 * unit, 20 * unit),
        4 * unit,
        4 * unit,
      ),
    );
    path.addRRect(
      Skia.RRectXY(
        Skia.XYWHRect(20 * unit, 19 * unit, 18 * unit, 20 * unit),
        4 * unit,
        4 * unit,
      ),
    );
    return path;
  }, [measuredSize]);
  const checkPath = useMemo(() => {
    const path = Skia.Path.Make();
    const unit = measuredSize / 52;
    path.moveTo(15 * unit, 27 * unit);
    path.lineTo(23 * unit, 35 * unit);
    path.lineTo(38 * unit, 18 * unit);
    return path;
  }, [measuredSize]);

  const requestCopied = useCallback(
    (next: boolean) => {
      if (!controlled) setInternalCopied(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );
  const reset = useCallback(() => requestCopied(false), [requestCopied]);
  const triggerCopy = useCallback(() => {
    onCopy();
    requestCopied(true);
  }, [onCopy, requestCopied]);
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const next = Math.min(
        event.nativeEvent.layout.width,
        event.nativeEvent.layout.height,
      );
      if (next > 0 && Math.abs(next - measuredSize) > 0.5)
        setMeasuredSize(next);
    },
    [measuredSize],
  );

  useImperativeHandle(ref, () => ({ copy: triggerCopy, reset }), [
    reset,
    triggerCopy,
  ]);

  useEffect(() => {
    progress.set(
      reducedMotion
        ? currentCopied
          ? 1
          : 0
        : withTiming(currentCopied ? 1 : 0, {
            duration: currentCopied ? 360 : 180,
            easing: Easing.bezier(0.23, 1, 0.32, 1),
          }),
    );
    if (currentCopied) {
      feedback.set(0);
      feedback.set(
        reducedMotion
          ? 1
          : withTiming(1, {
              duration: Math.max(1, resetMs),
              easing: Easing.linear,
            }),
      );
    } else {
      feedback.set(1);
    }
  }, [currentCopied, feedback, progress, reducedMotion, resetMs]);

  useEffect(() => {
    if (controlled || !currentCopied) return;
    const timer = setTimeout(() => requestCopied(false), Math.max(0, resetMs));
    return () => clearTimeout(timer);
  }, [controlled, currentCopied, requestCopied, resetMs]);

  const copyOpacity = useDerivedValue(() =>
    interpolate(progress.value, [0, 0.46, 1], [1, 0, 0]),
  );
  const checkOpacity = useDerivedValue(() =>
    interpolate(progress.value, [0, 0.44, 0.62, 1], [0, 0, 1, 1]),
  );
  const checkEnd = useDerivedValue(() =>
    interpolate(progress.value, [0.46, 1], [0, 1]),
  );
  const surfaceStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [resolvedSurfaceEnd, successColor],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [
        dark ? 'rgba(255,255,255,0.16)' : 'rgba(20,20,35,0.10)',
        'rgba(255,255,255,0.36)',
      ],
    ),
  }));
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reducedMotion ? 1 : pressScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion
      ? 0
      : interpolate(feedback.value, [0, 0.08, 0.42, 1], [0, 0.9, 0.32, 0]),
    transform: [
      { scale: interpolate(feedback.value, [0, 0.24, 1], [0.72, 1.06, 1.18]) },
    ],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion
      ? currentCopied
        ? 1
        : 0
      : interpolate(feedback.value, [0, 0.09, 0.72, 1], [0, 1, 1, 0]),
    transform: [
      {
        translateY: reducedMotion
          ? 0
          : interpolate(feedback.value, [0, 0.16, 0.68, 1], [2, 0, -5, -14]),
      },
      {
        scale: reducedMotion
          ? 1
          : interpolate(feedback.value, [0, 0.16, 1], [0.94, 1, 1]),
      },
    ],
  }));

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.root,
        { height: size, maxHeight: size, maxWidth: size, width: size },
        style,
      ]}
      testID={testID}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            borderRadius: measuredSize * 0.32,
            boxShadow: `0px 0px ${Math.round(measuredSize * 0.58)}px ${successColor}`,
          },
          glowStyle,
        ]}
      />
      <AnimatedPressable
        accessibilityLabel={
          currentCopied
            ? `${copiedLabel}. ${accessibilityLabel}`
            : accessibilityLabel
        }
        accessibilityRole="button"
        accessibilityState={{ selected: currentCopied }}
        onPress={triggerCopy}
        onPressIn={() => {
          pressScale.set(reducedMotion ? 1 : withSpring(0.94, PRESS_SPRING));
        }}
        onPressOut={() => {
          pressScale.set(reducedMotion ? 1 : withSpring(1, PRESS_SPRING));
        }}
        style={[
          styles.button,
          {
            borderRadius: measuredSize * 0.29,
            boxShadow: dark
              ? '0px 1px 2px rgba(0,0,0,0.42), 0px 12px 30px rgba(0,0,0,0.34)'
              : '0px 1px 2px rgba(16,16,32,0.10), 0px 12px 30px rgba(16,16,32,0.16)',
          },
          surfaceStyle,
          pressStyle,
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.26)',
            'rgba(255,255,255,0.06)',
            'rgba(255,255,255,0)',
          ]}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
          start={{ x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Canvas pointerEvents="none" style={styles.canvas}>
          <Group opacity={copyOpacity}>
            <Path
              color={resolvedIcon}
              path={copyPath}
              strokeCap="round"
              strokeJoin="round"
              strokeWidth={Math.max(1.5, measuredSize * 0.035)}
              style="stroke"
            />
          </Group>
          <Group opacity={checkOpacity}>
            <Path
              color="#FFFFFF"
              end={checkEnd}
              path={checkPath}
              strokeCap="round"
              strokeJoin="round"
              strokeWidth={Math.max(2.2, measuredSize * 0.055)}
              style="stroke"
            />
          </Group>
          <RoundedRect
            color="rgba(255,255,255,0.18)"
            height={1}
            r={0.5}
            width={measuredSize * 0.46}
            x={measuredSize * 0.27}
            y={1}
          />
        </Canvas>
      </AnimatedPressable>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.labelPosition,
          { bottom: measuredSize + 10 },
          labelStyle,
        ]}
      >
        <BlurView
          blurMethod="dimezisBlurViewSdk31Plus"
          intensity={62}
          tint={dark ? 'systemThickMaterialDark' : 'systemThinMaterialLight'}
          style={styles.labelGlass}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.26)', 'rgba(255,255,255,0.06)']}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.labelDot, { backgroundColor: successColor }]} />
          <Text
            style={[
              styles.labelText,
              { color: dark ? '#F7F7FA' : '#22222A', fontFamily },
            ]}
          >
            {copiedLabel}
          </Text>
        </BlurView>
      </Animated.View>
    </View>
  );
});

export default CopyConfirmButton;

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  canvas: { height: '100%', width: '100%' },
  glow: {
    backgroundColor: 'transparent',
    bottom: 4,
    left: 4,
    position: 'absolute',
    right: 4,
    top: 4,
  },
  labelDot: { borderRadius: 3, height: 6, marginRight: 7, width: 6 },
  labelGlass: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  labelPosition: {
    alignSelf: 'center',
    boxShadow:
      '0px 1px 2px rgba(16,16,32,0.12), 0px 10px 26px rgba(16,16,32,0.16)',
    position: 'absolute',
  },
  labelText: { fontSize: 12, letterSpacing: 0.12, lineHeight: 15 },
  root: { flex: 1, position: 'relative' },
});

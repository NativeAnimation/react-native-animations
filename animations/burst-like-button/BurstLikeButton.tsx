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
  useColorScheme,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Canvas, Group, Path } from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const HEART_PATH =
  'M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.03L12 21.35Z';
const DEFAULT_COLORS = ['#FF3F68', '#FF657F', '#FF865E', '#FFB05C'];
const PARTICLE_COUNT = 16;

type ParticleSpec = {
  angle: number;
  delay: number;
  distance: number;
  gravity: number;
  heart: boolean;
  rotation: number;
  scale: number;
};

const PARTICLES: ParticleSpec[] = Array.from(
  { length: PARTICLE_COUNT },
  (_, index) => {
    const offset = index % 2 === 0 ? -0.055 : 0.038;
    return {
      angle: (index / PARTICLE_COUNT + offset) * Math.PI * 2 - Math.PI / 2,
      delay: (index % 4) * 0.025,
      distance: 0.72 + ((index * 7) % 5) * 0.085,
      gravity: 0.12 + ((index * 11) % 4) * 0.035,
      heart: index % 2 === 1,
      rotation: index % 2 === 0 ? 120 : -135,
      scale: 0.72 + ((index * 3) % 5) * 0.09,
    };
  },
);

type ParticleProps = {
  burst: SharedValue<number>;
  color: string;
  power: SharedValue<number>;
  reducedMotion: boolean;
  size: number;
  spec: ParticleSpec;
};

function Particle({
  burst,
  color,
  power,
  reducedMotion,
  size,
  spec,
}: ParticleProps) {
  const fieldSize = size * 3.9;
  const particleSize = size * (spec.heart ? 0.2 : 0.1) * spec.scale;
  const animatedStyle = useAnimatedStyle(() => {
    const localProgress = interpolate(
      burst.get(),
      [spec.delay, 0.94],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const launch = 1 - Math.pow(1 - localProgress, 2.25);
    const radius = size * spec.distance * power.get();
    return {
      opacity: reducedMotion
        ? 0
        : interpolate(localProgress, [0, 0.08, 0.68, 1], [0, 1, 0.92, 0]),
      transform: [
        { translateX: Math.cos(spec.angle) * radius * launch },
        {
          translateY:
            Math.sin(spec.angle) * radius * launch +
            size * spec.gravity * localProgress * localProgress,
        },
        { rotate: `${spec.rotation * localProgress}deg` },
        {
          scale: interpolate(
            localProgress,
            [0, 0.14, 0.72, 1],
            [0.55, 1.08, 0.88, 0.38],
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          height: particleSize,
          left: (fieldSize - particleSize) / 2,
          top: (fieldSize - particleSize) / 2,
          width: particleSize,
        },
        animatedStyle,
      ]}
    >
      {spec.heart ? (
        <Canvas
          style={StyleSheet.flatten([
            styles.particleCanvas,
            { height: particleSize, width: particleSize },
          ])}
        >
          <Group transform={[{ scale: particleSize / 24 }]}>
            <Path color={color} path={HEART_PATH} />
          </Group>
        </Canvas>
      ) : (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: color,
              borderRadius: particleSize / 2,
              boxShadow: `0px 2px 7px ${color}80`,
            },
          ]}
        />
      )}
    </Animated.View>
  );
}

/** Imperative controls for the like button. */
export type BurstLikeButtonRef = {
  /** Toggles the current like state. */
  toggle: () => void;
  /** Activates the button. */
  like: () => void;
  /** Deactivates the button. */
  unlike: () => void;
};

export type BurstLikeButtonProps = {
  /** Controlled like state. */
  liked?: boolean;
  /** Initial state when uncontrolled. @default false */
  defaultLiked?: boolean;
  /** Called when the requested state changes. */
  onChange?: (liked: boolean) => void;
  /** Heart width and height in points. @default 28 */
  size?: number;
  /** Active heart and wave color. @default '#FF3F68' */
  color?: string;
  /** Nearby accent colors shared by the dots and mini hearts. */
  particleColors?: readonly string[];
  /** Wave and particle burst duration in milliseconds. @default 680 */
  burstDuration?: number;
  /** Hold duration before the super-like activates in milliseconds. @default 720 */
  superLikeDuration?: number;
  /** Optional count shown beside the heart. */
  count?: number;
  /** Whether to show the count. @default true when count is provided */
  showCount?: boolean;
  /** Inactive outline and count color. @default '#686573' */
  inactiveColor?: string;
  /** Accessible button label. @default 'Like this post' */
  accessibilityLabel?: string;
  /** Optional font family for the count. */
  fontFamily?: string;
  /** Color treatment, or the device setting when set to auto. @default 'auto' */
  colorScheme?: 'light' | 'dark' | 'auto';
  /** Top surface color. Defaults to a scheme-aware pearl tone. */
  surfaceColor?: string;
  /** Bottom surface color. Defaults to a scheme-aware nearby tone. */
  surfaceEndColor?: string;
  /** Style for the outer container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier for the button. */
  testID?: string;
};

/** A Skia heart with a physical burst, rolling count, and hold-to-charge super-like. */
export const BurstLikeButton = forwardRef<
  BurstLikeButtonRef,
  BurstLikeButtonProps
>(function BurstLikeButton(
  {
    liked,
    defaultLiked = false,
    onChange,
    size = 28,
    color = '#FF3F68',
    particleColors = DEFAULT_COLORS,
    burstDuration = 680,
    superLikeDuration = 720,
    count,
    showCount = count !== undefined,
    inactiveColor = '#686573',
    accessibilityLabel = 'Like this post',
    fontFamily,
    colorScheme = 'auto',
    surfaceColor,
    surfaceEndColor,
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
  const resolvedSurface = surfaceColor ?? (dark ? '#211F27' : '#FFFFFF');
  const resolvedSurfaceEnd = surfaceEndColor ?? (dark ? '#17161C' : '#F8F5F7');
  const controlled = liked !== undefined;
  const [internalLiked, setInternalLiked] = useState(defaultLiked);
  const currentLiked = controlled ? liked : internalLiked;
  const likedProgress = useSharedValue(currentLiked ? 1 : 0);
  const burst = useSharedValue(1);
  const burstPower = useSharedValue(1);
  const heartScale = useSharedValue(1);
  const charge = useSharedValue(0);
  const countRoll = useSharedValue(1);
  const previousLiked = useRef(currentLiked);
  const longPressActivated = useRef(false);

  const playBurst = useCallback(
    (superLike: boolean) => {
      burstPower.set(superLike ? 1.38 : 1);
      burst.set(0);
      burst.set(
        reducedMotion
          ? 1
          : withTiming(1, {
              duration: superLike ? burstDuration + 140 : burstDuration,
              easing: Easing.bezier(0.23, 1, 0.32, 1),
            }),
      );
      heartScale.set(
        reducedMotion
          ? 1
          : withSequence(
              withSpring(superLike ? 1.34 : 1.25, {
                damping: 27,
                stiffness: 390,
                mass: 0.72,
              }),
              withSpring(1, { damping: 53, stiffness: 270 }),
            ),
      );
    },
    [burst, burstDuration, burstPower, heartScale, reducedMotion],
  );

  const animateState = useCallback(
    (next: boolean, emit: boolean, forceBurst = false, synchronize = false) => {
      if (next === currentLiked && !forceBurst && !synchronize) return;
      previousLiked.current = next;
      if (!controlled) setInternalLiked(next);
      likedProgress.set(
        reducedMotion
          ? next
            ? 1
            : 0
          : withSpring(next ? 1 : 0, { damping: 57, stiffness: 310 }),
      );
      if (next) playBurst(forceBurst);
      else {
        burst.set(1);
        heartScale.set(
          reducedMotion ? 1 : withSpring(0.92, { damping: 58, stiffness: 320 }),
        );
      }
      if (emit) onChange?.(next);
    },
    [
      burst,
      controlled,
      currentLiked,
      heartScale,
      likedProgress,
      onChange,
      playBurst,
      reducedMotion,
    ],
  );

  useEffect(() => {
    if (previousLiked.current !== currentLiked) {
      animateState(currentLiked, false, false, true);
      previousLiked.current = currentLiked;
    }
  }, [animateState, currentLiked]);

  useLayoutEffect(() => {
    countRoll.set(reducedMotion ? 1 : 0);
    countRoll.set(
      withTiming(1, {
        duration: reducedMotion ? 180 : 280,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
      }),
    );
  }, [countRoll, currentLiked, reducedMotion]);

  const setLiked = useCallback(
    (next: boolean) => animateState(next, true),
    [animateState],
  );

  useImperativeHandle(
    ref,
    () => ({
      toggle: () => setLiked(!currentLiked),
      like: () => setLiked(true),
      unlike: () => setLiked(false),
    }),
    [currentLiked, setLiked],
  );

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.get() }],
  }));
  const activeHeartStyle = useAnimatedStyle(() => ({
    opacity: likedProgress.get(),
    transform: [
      {
        scale: interpolate(
          likedProgress.get(),
          [0, 1],
          [0.84, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const waveStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion
      ? 0
      : interpolate(burst.get(), [0, 0.08, 0.72, 1], [0, 0.82, 0.28, 0]),
    transform: [
      {
        scale: interpolate(burst.get(), [0, 1], [0.52, 1.7 * burstPower.get()]),
      },
    ],
  }));
  const chargeStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion
      ? 0
      : interpolate(charge.get(), [0, 0.18, 1], [0, 0.2, 0.72]),
    transform: [{ scale: interpolate(charge.get(), [0, 1], [0.8, 1.22]) }],
  }));
  const oldCountStyle = useAnimatedStyle(() => ({
    opacity: 1 - countRoll.get(),
    transform: [
      { translateY: (currentLiked ? -1 : 1) * countRoll.get() * size * 0.72 },
    ],
  }));
  const newCountStyle = useAnimatedStyle(() => ({
    opacity: countRoll.get(),
    transform: [
      {
        translateY:
          (currentLiked ? 1 : -1) * (1 - countRoll.get()) * size * 0.72,
      },
    ],
  }));

  const fieldSize = size * 3.9;
  const heartScaleFactor = size / 24;
  const countValue = count === undefined ? 0 : count + (currentLiked ? 1 : 0);
  const previousCount = countValue + (currentLiked ? -1 : 1);
  const countFontSize = Math.max(13, size * 0.51);
  const countStyle: TextStyle = {
    color: currentLiked ? color : inactiveColor,
    fontFamily,
    fontSize: countFontSize,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.02 * countFontSize,
    lineHeight: size,
  };

  return (
    <Pressable
      accessibilityHint="Double tap to like. Hold for a super-like."
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ checked: currentLiked }}
      delayLongPress={superLikeDuration}
      onLongPress={() => {
        longPressActivated.current = true;
        charge.set(1);
        animateState(true, true, true);
      }}
      onPress={() => {
        if (longPressActivated.current) return;
        setLiked(!currentLiked);
      }}
      onPressIn={() => {
        longPressActivated.current = false;
        heartScale.set(
          reducedMotion
            ? 1
            : withSpring(0.8, { damping: 28, stiffness: 420, mass: 0.72 }),
        );
        charge.set(
          reducedMotion
            ? 0
            : withTiming(1, {
                duration: superLikeDuration,
                easing: Easing.bezier(0.23, 1, 0.32, 1),
              }),
        );
      }}
      onPressOut={() => {
        cancelAnimation(charge);
        charge.set(withTiming(0, { duration: reducedMotion ? 0 : 180 }));
        if (!longPressActivated.current) {
          heartScale.set(
            reducedMotion ? 1 : withSpring(1, { damping: 58, stiffness: 320 }),
          );
        }
      }}
      style={[styles.pressTarget, style]}
      testID={testID}
    >
      <View
        style={[
          styles.surface,
          {
            borderColor: dark
              ? 'rgba(255,255,255,0.14)'
              : 'rgba(255,255,255,0.84)',
            borderRadius: fieldSize * 0.13,
            boxShadow: dark
              ? '0px 1px 2px rgba(0,0,0,0.34), 0px 14px 38px rgba(0,0,0,0.3)'
              : '0px 1px 2px rgba(40,22,34,0.08), 0px 14px 38px rgba(72,36,55,0.15)',
            minHeight: size * 1.7,
          },
        ]}
      >
        <LinearGradient
          colors={[resolvedSurface, resolvedSurfaceEnd]}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: fieldSize * 0.13 }]}
        />
        <View style={{ height: size * 1.7, width: size * 1.9 }}>
          <View
            pointerEvents="none"
            style={[
              styles.burstField,
              {
                height: fieldSize,
                left: (size * 1.9 - fieldSize) / 2,
                top: (size * 1.7 - fieldSize) / 2,
                width: fieldSize,
              },
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.chargeGlow,
                {
                  borderColor: `${color}55`,
                  borderRadius: size,
                  boxShadow: `0px 0px ${size * 0.72}px ${color}8A`,
                  height: size * 1.3,
                  left: (fieldSize - size * 1.3) / 2,
                  top: (fieldSize - size * 1.3) / 2,
                  width: size * 1.3,
                },
                chargeStyle,
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.wave,
                {
                  borderColor: color,
                  borderRadius: size * 0.7,
                  height: size * 1.4,
                  left: (fieldSize - size * 1.4) / 2,
                  top: (fieldSize - size * 1.4) / 2,
                  width: size * 1.4,
                },
                waveStyle,
              ]}
            />
            {PARTICLES.map((spec, index) => (
              <Particle
                burst={burst}
                color={
                  particleColors[index % Math.max(1, particleColors.length)] ??
                  color
                }
                key={index}
                power={burstPower}
                reducedMotion={reducedMotion}
                size={size}
                spec={spec}
              />
            ))}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.heartStage,
                {
                  height: size,
                  left: (fieldSize - size) / 2,
                  top: (fieldSize - size) / 2,
                  width: size,
                },
                heartStyle,
              ]}
            >
              <Canvas style={styles.heartCanvas}>
                <Group transform={[{ scale: heartScaleFactor }]}>
                  <Path
                    color={inactiveColor}
                    path={HEART_PATH}
                    style="stroke"
                    strokeCap="round"
                    strokeJoin="round"
                    strokeWidth={1.8 / heartScaleFactor}
                  />
                </Group>
              </Canvas>
              <Animated.View
                pointerEvents="none"
                style={[styles.heartFill, activeHeartStyle]}
              >
                <Canvas style={styles.heartCanvas}>
                  <Group transform={[{ scale: heartScaleFactor }]}>
                    <Path color={color} path={HEART_PATH} />
                  </Group>
                </Canvas>
              </Animated.View>
            </Animated.View>
          </View>
        </View>
        {showCount ? (
          <View
            style={[
              styles.countWindow,
              { height: size, minWidth: Math.max(size * 1.45, 48) },
            ]}
          >
            <Animated.Text
              accessibilityElementsHidden={true}
              importantForAccessibility={true ? 'no-hide-descendants' : 'auto'}
              aria-hidden
              style={[styles.countMeasure, countStyle]}
            >
              {Math.max(countValue, previousCount)}
            </Animated.Text>
            <Animated.Text style={[styles.count, countStyle, oldCountStyle]}>
              {previousCount}
            </Animated.Text>
            <Animated.Text style={[styles.count, countStyle, newCountStyle]}>
              {countValue}
            </Animated.Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

export default BurstLikeButton;

const styles = StyleSheet.create({
  burstField: { position: 'absolute' },
  chargeGlow: { borderWidth: 1, position: 'absolute' },
  count: {
    left: 0,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
  },
  countMeasure: { opacity: 0, textAlign: 'center' },
  countWindow: { justifyContent: 'center', overflow: 'hidden' },
  dot: { flex: 1 },
  heartCanvas: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  heartFill: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  heartStage: { position: 'absolute' },
  particle: { position: 'absolute' },
  particleCanvas: { flex: 1 },
  pressTarget: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  surface: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingRight: 18,
  },
  wave: { borderWidth: 1.5, position: 'absolute' },
});

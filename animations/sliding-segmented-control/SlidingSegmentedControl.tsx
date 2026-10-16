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
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export type SlidingSegmentedControlColorScheme = 'light' | 'dark' | 'auto';

/** Imperative controls for SlidingSegmentedControl. */
export type SlidingSegmentedControlRef = {
  /** Selects a segment by index. */
  select: (index: number) => void;
  /** Selects the next segment. */
  next: () => void;
  /** Selects the previous segment. */
  previous: () => void;
};

export type SlidingSegmentedControlProps = {
  /** Segment labels. */
  segments: readonly string[];
  /** Controlled selected index. */
  value?: number;
  /** Initial index when uncontrolled. @default 0 */
  defaultValue?: number;
  /** Called when a press, drag, or ref requests an index. */
  onChange?: (index: number) => void;
  /** Control height. @default 44 */
  height?: number;
  /** Horizontal padding inside each segment. @default 18 */
  segmentPadding?: number;
  /** Track color. @default '#E7E7EC' */
  trackColor?: string;
  /** Sliding indicator color. @default '#FFFFFF' */
  indicatorColor?: string;
  /** Selected label color. @default '#202027' */
  activeColor?: string;
  /** Unselected label color. @default '#777782' */
  inactiveColor?: string;
  /** Appearance used for material defaults. @default 'auto' */
  colorScheme?: SlidingSegmentedControlColorScheme;
  /** Indicator glow color. Defaults to `indicatorColor`. */
  glowColor?: string;
  /** Label font family. @default System font */
  fontFamily?: string;
  /** Spring damping. @default 24 */
  springDamping?: number;
  /** Spring stiffness. @default 260 */
  springStiffness?: number;
  /** Screen-reader label. @default 'Segmented control' */
  accessibilityLabel?: string;
  /** Optional outer style. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier. */
  testID?: string;
};

type SegmentLabelProps = {
  color: string;
  text: string;
  fontFamily?: string;
};

function SegmentLabel({ color, text, fontFamily }: SegmentLabelProps) {
  return (
    <Animated.Text style={[styles.label, { color, fontFamily }]}>
      {text}
    </Animated.Text>
  );
}

function clampIndex(index: number, count: number): number {
  'worklet';
  return Math.max(0, Math.min(count - 1, Math.round(index)));
}

/** A measured segmented control with a springy, draggable indicator. */
export const SlidingSegmentedControl = forwardRef<
  SlidingSegmentedControlRef,
  SlidingSegmentedControlProps
>(function SlidingSegmentedControl(
  {
    segments,
    value,
    defaultValue = 0,
    onChange,
    height = 44,
    segmentPadding = 18,
    trackColor = '#E7E7EC',
    indicatorColor = '#FFFFFF',
    activeColor = '#202027',
    inactiveColor = '#5B5D6B',
    colorScheme = 'auto',
    glowColor = indicatorColor,
    fontFamily,
    springDamping = 24,
    springStiffness = 260,
    accessibilityLabel = 'Segmented control',
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
  const count = Math.max(1, segments.length);
  const initialIndex = clampIndex(value ?? defaultValue, count);
  const [internalValue, setInternalValue] = useState(initialIndex);
  const [widths, setWidths] = useState(() =>
    Array.from({ length: count }, (_, index) =>
      Math.max(64, (segments[index]?.length ?? 4) * 9 + 2 * segmentPadding),
    ),
  );
  const currentIndex = clampIndex(value ?? internalValue, count);
  const indexRef = useRef(currentIndex);
  const progress = useSharedValue(currentIndex);
  const pressScale = useSharedValue(1);
  const selectionPulse = useSharedValue(0);

  const measuredWidths = useMemo(
    () => Array.from({ length: count }, (_, index) => widths[index] ?? 64),
    [count, widths],
  );
  const lefts = useMemo(() => {
    let running = 0;
    return measuredWidths.map((width) => {
      const left = running;
      running += width;
      return left;
    });
  }, [measuredWidths]);
  const centers = useMemo(
    () => lefts.map((left, index) => left + measuredWidths[index] / 2),
    [lefts, measuredWidths],
  );
  const inputRange = useMemo(
    () => Array.from({ length: count }, (_, index) => index),
    [count],
  );
  const animationInputRange = count === 1 ? [0, 1] : inputRange;
  const animationWidths =
    count === 1 ? [measuredWidths[0], measuredWidths[0]] : measuredWidths;
  const animationLefts = count === 1 ? [0, 0] : lefts;
  const resolvedActiveColor =
    activeColor === '#202027' && isDark ? '#F4F4F8' : activeColor;
  const resolvedInactiveColor =
    inactiveColor === '#5B5D6B' && isDark ? '#B8B9C7' : inactiveColor;

  const animateTo = useCallback(
    (index: number) => {
      const next = clampIndex(index, count);
      indexRef.current = next;
      progress.set(
        reducedMotion
          ? next
          : withSpring(next, {
              damping: Math.max(
                springDamping,
                1.6 * Math.sqrt(springStiffness * 0.8),
              ),
              stiffness: springStiffness,
              mass: 0.8,
            }),
      );
      if (!reducedMotion) {
        selectionPulse.set(
          withSequence(
            withTiming(1, { duration: 90 }),
            withTiming(0, { duration: 420 }),
          ),
        );
      }
    },
    [
      count,
      progress,
      reducedMotion,
      selectionPulse,
      springDamping,
      springStiffness,
    ],
  );

  const commitIndex = useCallback(
    (index: number) => {
      const next = clampIndex(index, count);
      if (value === undefined) setInternalValue(next);
      if (next !== currentIndex) onChange?.(next);
    },
    [count, currentIndex, onChange, value],
  );

  const requestIndex = useCallback(
    (index: number) => {
      const next = clampIndex(index, count);
      animateTo(next);
      commitIndex(next);
    },
    [animateTo, commitIndex, count],
  );

  useEffect(() => {
    if (value !== undefined) animateTo(value);
  }, [animateTo, value]);

  useImperativeHandle(
    ref,
    () => ({
      select: requestIndex,
      next: () => requestIndex(indexRef.current + 1),
      previous: () => requestIndex(indexRef.current - 1),
    }),
    [requestIndex],
  );

  const handleSegmentLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const nextWidth = event.nativeEvent.layout.width;
      setWidths((previous) => {
        if (previous[index] === nextWidth && previous.length === count)
          return previous;
        const next = Array.from(
          { length: count },
          (_, itemIndex) => previous[itemIndex] ?? 64,
        );
        next[index] = nextWidth;
        return next;
      });
    },
    [count],
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(4)
        .onUpdate((event) => {
          const x = Math.max(centers[0], Math.min(centers[count - 1], event.x));
          let nextProgress = 0;
          for (let index = 0; index < count - 1; index += 1) {
            const start = centers[index];
            const end = centers[index + 1];
            if (x >= start && x <= end) {
              nextProgress = index + (x - start) / Math.max(1, end - start);
              break;
            }
            if (x > end) nextProgress = index + 1;
          }
          progress.set(nextProgress);
        })
        .onEnd((event) => {
          const projectedX = event.x + event.velocityX * 0.08;
          let nearestIndex = 0;
          let nearestDistance = Math.abs(projectedX - centers[0]);
          for (let index = 1; index < count; index += 1) {
            const distance = Math.abs(projectedX - centers[index]);
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestIndex = index;
            }
          }
          progress.set(
            reducedMotion
              ? nearestIndex
              : withSpring(nearestIndex, {
                  damping: Math.max(
                    springDamping,
                    1.6 * Math.sqrt(springStiffness * 0.8),
                  ),
                  stiffness: springStiffness,
                  mass: 0.8,
                }),
          );
          scheduleOnRN(commitIndex, nearestIndex);
        }),
    [
      centers,
      commitIndex,
      count,
      progress,
      reducedMotion,
      springDamping,
      springStiffness,
    ],
  );

  const indicatorStyle = useAnimatedStyle(() => {
    const nearest = Math.round(progress.get());
    const stretchPhase = Math.abs(progress.get() - nearest) * 2;
    return {
      width: interpolate(progress.get(), animationInputRange, animationWidths),
      transform: [
        {
          translateX: interpolate(
            progress.get(),
            animationInputRange,
            animationLefts,
          ),
        },
        {
          scaleX: reducedMotion
            ? 1
            : 1 + 0.1 * stretchPhase + selectionPulse.get() * 0.025,
        },
        { scaleY: reducedMotion ? 1 : 1 + selectionPulse.get() * 0.055 },
      ],
    };
  });
  const activeLabelClipStyle = useAnimatedStyle(() => {
    const indicatorWidth = interpolate(
      progress.get(),
      animationInputRange,
      animationWidths,
    );
    const indicatorLeft = interpolate(
      progress.get(),
      animationInputRange,
      animationLefts,
    );
    const nearest = Math.round(progress.get());
    const stretchPhase = Math.abs(progress.get() - nearest) * 2;
    const scaleX = reducedMotion
      ? 1
      : 1 + 0.1 * stretchPhase + selectionPulse.get() * 0.025;
    const visualWidth = indicatorWidth * scaleX;
    const visualLeft = indicatorLeft - (visualWidth - indicatorWidth) / 2;

    return {
      width: visualWidth,
      transform: [{ translateX: visualLeft }],
    };
  });
  const activeLabelRowStyle = useAnimatedStyle(() => {
    const indicatorWidth = interpolate(
      progress.get(),
      animationInputRange,
      animationWidths,
    );
    const indicatorLeft = interpolate(
      progress.get(),
      animationInputRange,
      animationLefts,
    );
    const nearest = Math.round(progress.get());
    const stretchPhase = Math.abs(progress.get() - nearest) * 2;
    const scaleX = reducedMotion
      ? 1
      : 1 + 0.1 * stretchPhase + selectionPulse.get() * 0.025;
    const visualWidth = indicatorWidth * scaleX;
    const visualLeft = indicatorLeft - (visualWidth - indicatorWidth) / 2;

    return { transform: [{ translateX: -visualLeft }] };
  });
  const trackPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reducedMotion ? 1 : pressScale.get() }],
  }));
  const sheenStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0 : selectionPulse.get() * 0.65,
    transform: [
      { translateX: (1 - selectionPulse.get()) * 70 - 35 },
      { rotate: '-18deg' },
    ],
  }));

  if (segments.length === 0) return null;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.track,
          {
            backgroundColor:
              trackColor === '#E7E7EC' && isDark ? '#23232E' : trackColor,
            borderColor: isDark
              ? 'rgba(255,255,255,0.11)'
              : 'rgba(255,255,255,0.58)',
            borderRadius: height / 2,
            height,
          },
          style,
          trackPressStyle,
        ]}
        testID={testID}
      >
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.01)']
              : ['rgba(255,255,255,0.48)', 'rgba(255,255,255,0.03)']
          }
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
          start={{ x: 0.5, y: 0 }}
          style={styles.trackLight}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              backgroundColor:
                indicatorColor === '#FFFFFF' && isDark
                  ? '#3A3A48'
                  : indicatorColor,
              borderRadius: (height - 6) / 2,
              boxShadow: `0px 2px 7px rgba(30,30,45,0.14), 0px 8px 22px ${glowColor}42`,
              height: height - 6,
              top: 3,
            },
            indicatorStyle,
          ]}
        >
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.02)']
                : ['rgba(255,255,255,0.82)', 'rgba(255,255,255,0.08)']
            }
            end={{ x: 0.5, y: 1 }}
            start={{ x: 0.5, y: 0 }}
            style={styles.indicatorLight}
          />
          <Animated.View style={[styles.sheen, sheenStyle]} />
        </Animated.View>
        {segments.map((segment, index) => (
          <Pressable
            accessibilityLabel={segment}
            accessibilityRole="tab"
            accessibilityState={{ selected: currentIndex === index }}
            key={`${segment}-${index}`}
            onLayout={(event) => handleSegmentLayout(index, event)}
            onPress={() => requestIndex(index)}
            onPressIn={() => {
              pressScale.set(
                reducedMotion
                  ? 1
                  : withSpring(0.96, { damping: 58, stiffness: 320 }),
              );
            }}
            onPressOut={() => {
              pressScale.set(
                reducedMotion
                  ? 1
                  : withSpring(1, { damping: 50, stiffness: 240 }),
              );
            }}
            style={[
              styles.segment,
              { minHeight: height, paddingHorizontal: segmentPadding },
            ]}
          >
            <SegmentLabel
              color={resolvedInactiveColor}
              fontFamily={fontFamily}
              text={segment}
            />
          </Pressable>
        ))}
        <Animated.View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={[
            styles.activeLabelClip,
            { height, top: 0 },
            activeLabelClipStyle,
          ]}
        >
          <Animated.View style={[styles.activeLabelRow, activeLabelRowStyle]}>
            {segments.map((segment, index) => (
              <Animated.View
                key={`${segment}-${index}-active`}
                style={[
                  styles.activeLabelSegment,
                  { height, width: measuredWidths[index] },
                ]}
              >
                <SegmentLabel
                  color={resolvedActiveColor}
                  fontFamily={fontFamily}
                  text={segment}
                />
              </Animated.View>
            ))}
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  activeLabelClip: {
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
  },
  activeLabelRow: {
    flexDirection: 'row',
    left: 0,
    position: 'absolute',
    top: 0,
  },
  activeLabelSegment: { alignItems: 'center', justifyContent: 'center' },
  indicator: {
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    transformOrigin: 'center',
  },
  indicatorLight: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  label: { fontSize: 14 },
  segment: { alignItems: 'center', justifyContent: 'center' },
  sheen: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    bottom: -10,
    position: 'absolute',
    top: -10,
    width: 18,
  },
  track: {
    alignSelf: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  trackLight: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

export default SlidingSegmentedControl;

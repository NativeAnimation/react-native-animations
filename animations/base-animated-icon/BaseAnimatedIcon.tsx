import Animated, {
  ReduceMotion,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import {
  useBaseReducedMotion,
  useBaseTheme,
  type BaseTheme,
} from '../base-theme';
import React, { useEffect } from 'react';

import Svg, { Path } from 'react-native-svg';

export type BaseAnimatedIconName =
  'bell' | 'trending-up' | 'refresh-cw' | 'check-check';

export type BaseAnimatedIconProps = {
  name: BaseAnimatedIconName;
  /** Change this value (a counter works well) to play the animation once. */
  trigger?: number;
  /** Plays once when mounted. */
  animateOnMount?: boolean;
  size?: number;
  color?: string;
  strokeWidth?: number;
  theme?: BaseTheme;
  testID?: string;
  accessibilityLabel?: string;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const easeInOut = Easing.bezier(0.42, 0, 0.58, 1);
const easeOut = Easing.bezier(0, 0, 0.58, 1);

// Keyframes spread evenly over a duration.
function keyframes(values: number[], duration: number, easing = easeInOut) {
  const step = duration / (values.length - 1);
  const [, ...rest] = values;
  return withSequence(
    ReduceMotion.Never,
    ...rest.map((v) =>
      withTiming(v, {
        reduceMotion: ReduceMotion.Never,
        duration: step,
        easing,
      }),
    ),
  );
}

// Path data from Lucide (ISC). Lengths are precomputed for the stroke-draw effect.
const PATHS = {
  bellBody:
    'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326',
  bellClapper: 'M10.268 21a2 2 0 0 0 3.464 0',
  trendLine: 'M2 17l6.5-6.5 5 5L22 7',
  trendTip: 'M16 7h6v6',
  refresh: [
    'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8',
    'M21 3v5h-5',
    'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16',
    'M8 16H3v5',
  ],
  check1: 'm2 12 5 5L18 6',
  check2: 'm13 16 1.5 1.5L22 10',
};
const LENGTH = { trendLine: 28.3, check1: 22.7, check2: 12.8 };

export function BaseAnimatedIcon({
  name,
  trigger = 0,
  animateOnMount = false,
  size = 20,
  color,
  strokeWidth = 2,
  theme: override,
  testID,
  accessibilityLabel,
}: BaseAnimatedIconProps) {
  const theme = useBaseTheme(override);
  const stroke = color ?? theme.colors.foreground;
  const reduced = useBaseReducedMotion();

  // a: rotation or scale of the whole icon, b: secondary part, c/d: stroke-draw progress.
  const a = useSharedValue(name === 'check-check' ? 1 : 0);
  const b = useSharedValue(name === 'trending-up' ? 1 : 0);
  const c = useSharedValue(1);
  const d = useSharedValue(1);
  const played = React.useRef(false);

  useEffect(() => {
    if (!played.current) {
      played.current = true;
      if (!animateOnMount) return;
    }
    if (reduced) return;
    switch (name) {
      case 'bell':
        a.set(keyframes([0, 20, -10, 10, -5, 3, 0], 900));
        b.set(keyframes([0, -6, 5, -5, 4, -3, 2, 0], 1100));
        break;
      case 'trending-up':
        c.set(0);
        c.set(
          withTiming(1, {
            reduceMotion: ReduceMotion.Never,
            duration: 500,
            easing: easeInOut,
          }),
        );
        b.set(0);
        b.set(
          withDelay(
            360,
            withTiming(1, {
              reduceMotion: ReduceMotion.Never,
              duration: 240,
              easing: easeOut,
            }),
            ReduceMotion.Never,
          ),
        );
        break;
      case 'refresh-cw':
        a.set(
          withSequence(
            ReduceMotion.Never,
            withSpring(45, {
              reduceMotion: ReduceMotion.Never,
              stiffness: 150,
              damping: 25,
              mass: 1,
            }),
            withSpring(0, {
              reduceMotion: ReduceMotion.Never,
              stiffness: 150,
              damping: 25,
              mass: 1,
            }),
          ),
        );
        break;
      case 'check-check':
        a.set(keyframes([1, 1.1, 1], 800));
        c.set(0);
        c.set(
          withTiming(1, {
            reduceMotion: ReduceMotion.Never,
            duration: 600,
            easing: easeInOut,
          }),
        );
        d.set(0);
        d.set(
          withDelay(
            200,
            withTiming(1, {
              reduceMotion: ReduceMotion.Never,
              duration: 600,
              easing: easeInOut,
            }),
            ReduceMotion.Never,
          ),
        );
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const unit = size / 24;
  const wholeStyle = useAnimatedStyle(() => {
    if (name === 'bell' || name === 'refresh-cw')
      return { transform: [{ rotate: `${a.get()}deg` }] };
    if (name === 'check-check') return { transform: [{ scale: a.get() }] };
    return {};
  });
  const partStyle = useAnimatedStyle(() => {
    if (name === 'bell') return { transform: [{ translateX: b.get() * unit }] };
    if (name === 'trending-up')
      return { opacity: b.get(), transform: [{ scale: 0.3 + 0.7 * b.get() }] };
    return {};
  });

  const svgProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const layer = { position: 'absolute' as const, top: 0, left: 0 };

  return (
    <Animated.View
      testID={testID}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          width: size,
          height: size,
          transformOrigin: name === 'bell' ? 'top' : 'center',
        },
        wholeStyle,
      ]}
    >
      {name === 'bell' ? (
        <>
          <Svg {...svgProps} style={layer}>
            <Path d={PATHS.bellBody} />
          </Svg>
          <Animated.View style={[layer, partStyle]}>
            <Svg {...svgProps}>
              <Path d={PATHS.bellClapper} />
            </Svg>
          </Animated.View>
        </>
      ) : null}
      {name === 'trending-up' ? (
        <>
          <Svg {...svgProps} style={layer}>
            <DrawnPath
              d={PATHS.trendLine}
              length={LENGTH.trendLine}
              progress={c}
            />
          </Svg>
          <Animated.View
            style={[
              layer,
              { width: size, height: size, transformOrigin: '91.7% 29.2%' },
              partStyle,
            ]}
          >
            <Svg {...svgProps}>
              <Path d={PATHS.trendTip} />
            </Svg>
          </Animated.View>
        </>
      ) : null}
      {name === 'refresh-cw' ? (
        <Svg {...svgProps}>
          {PATHS.refresh.map((p) => (
            <Path key={p} d={p} />
          ))}
        </Svg>
      ) : null}
      {name === 'check-check' ? (
        <Svg {...svgProps}>
          <DrawnPath d={PATHS.check1} length={LENGTH.check1} progress={c} />
          <DrawnPath d={PATHS.check2} length={LENGTH.check2} progress={d} />
        </Svg>
      ) : null}
    </Animated.View>
  );
}

function DrawnPath({
  d,
  length,
  progress,
}: {
  d: string;
  length: number;
  progress: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - progress.get()),
    strokeOpacity: Math.min(1, progress.get() * 4),
  }));
  return (
    <AnimatedPath
      d={d}
      strokeDasharray={[length, length]}
      animatedProps={animatedProps}
    />
  );
}

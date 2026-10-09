import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export type SkeletonBlockProps = {
  /** Block width. */ width?: number | `${number}%`;
  /** Block height. */ height?: number;
  /** Shape. */ variant?: 'rectangle' | 'circle' | 'text';
  /** Base surface color. */ color?: string;
  /** Optional style. */ style?: StyleProp<ViewStyle>;
};
/** A single synchronised loading placeholder. Use inside ShimmerSkeleton. */
export function SkeletonBlock({
  width = '100%',
  height = 16,
  variant = 'rectangle',
  color = '#E7E8EE',
  style,
}: SkeletonBlockProps) {
  return (
    <View
      style={[
        styles.block,
        {
          width,
          height,
          borderRadius:
            variant === 'circle'
              ? height / 2
              : variant === 'text'
                ? height / 2
                : 14,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}
export type ShimmerSkeletonProps = {
  /** Shows placeholders while true. @default true */ loading?: boolean;
  /** Content revealed after loading. */ children?: React.ReactNode;
  /** Placeholder layout that receives the shared shimmer. */
  placeholder?: React.ReactNode;
  /** Sweep cycle duration. @default 1400 */ duration?: number;
  /** Surface color. */ color?: string;
  /** Highlight color. */ highlightColor?: string;
  /** Container style. */ style?: StyleProp<ViewStyle>;
  /** Accessible loading label. */ accessibilityLabel?: string;
};
/** A premium skeleton group whose diagonal highlight is shared by all its blocks. */
export default function ShimmerSkeleton({
  loading = true,
  children,
  placeholder,
  duration = 1400,
  color = '#E7E8EE',
  highlightColor = 'rgba(255,255,255,0.88)',
  style,
  accessibilityLabel = 'Loading content',
}: ShimmerSkeletonProps) {
  const reduced = useReducedMotion();
  const sweep = useSharedValue(-1);
  const reveal = useSharedValue(loading ? 0 : 1);
  useEffect(() => {
    sweep.set(
      reduced
        ? 0
        : withRepeat(
            withTiming(1, { duration, easing: Easing.linear }),
            -1,
            false,
          ),
    );
  }, [duration, reduced, sweep]);
  useEffect(() => {
    reveal.set(
      reduced
        ? loading
          ? 0
          : 1
        : withTiming(loading ? 0 : 1, {
            duration: 360,
            easing: Easing.out(Easing.cubic),
          }),
    );
  }, [loading, reduced, reveal]);
  const shine = useAnimatedStyle(() => ({
    transform: [
      { translateX: `${-120 + sweep.value * 240}%` },
      { skewX: '-18deg' },
    ],
  }));
  const content = useAnimatedStyle(() => ({ opacity: reveal.value }));
  const shell = useAnimatedStyle(() => ({ opacity: 1 - reveal.value }));
  const skeleton = placeholder ?? children;
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: loading }}
      style={[styles.root, style]}
    >
      <Animated.View
        pointerEvents={loading ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, shell]}
      >
        <View style={[styles.surface, { backgroundColor: color }]}>
          {skeleton ?? (
            <View style={styles.default}>
              <SkeletonBlock color={color} width="58%" />
              <SkeletonBlock color={color} height={76} />
              <SkeletonBlock color={color} width="78%" />
            </View>
          )}
          <Animated.View pointerEvents="none" style={[styles.shine, shine]}>
            <LinearGradient
              colors={['transparent', highlightColor, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </Animated.View>
      <Animated.View pointerEvents={loading ? 'none' : 'auto'} style={content}>
        {children}
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { minHeight: 80, overflow: 'hidden' },
  surface: { flex: 1, overflow: 'hidden' },
  default: { gap: 14, padding: 20 },
  block: { overflow: 'hidden' },
  shine: { bottom: 0, left: 0, position: 'absolute', top: 0, width: '55%' },
});
export { ShimmerSkeleton };

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
export type BumpBadgeRef = {
  /** Sets the count. */ setCount: (count: number) => void;
};
export type BumpBadgeProps = {
  /** Controlled count. */ value?: number;
  /** Initial uncontrolled count. @default 3 */ defaultValue?: number;
  /** Called after a count request. */ onChange?: (count: number) => void;
  /** Accent color. */ color?: string;
  /** Icon size. */ size?: number;
  /** Accessible label. */ accessibilityLabel?: string;
  /** Container style. */ style?: StyleProp<ViewStyle>;
};
/** A bell notification counter with a spring bump, rolling numeral, and success glow. */
export const BumpBadge = forwardRef<BumpBadgeRef, BumpBadgeProps>(
  function BumpBadge(
    {
      value,
      defaultValue = 3,
      onChange,
      color = '#6D5DFB',
      size = 42,
      accessibilityLabel = 'Notifications',
      style,
    },
    ref,
  ) {
    const [internal, setInternal] = useState(defaultValue);
    const count = value ?? internal;
    const previous = useRef(count);
    const reduced = useReducedMotion();
    const scale = useSharedValue(count ? 1 : 0);
    const shake = useSharedValue(0);
    useEffect(() => {
      if (count !== previous.current) {
        const up = count > previous.current;
        previous.current = count;
        scale.set(
          reduced
            ? count
              ? 1
              : 0
            : count
              ? withSequence(
                  withSpring(1.35, { damping: 12, stiffness: 240 }),
                  withSpring(1, { damping: 14, stiffness: 220 }),
                )
              : withTiming(0, { duration: 180 }),
        );
        if (up)
          shake.set(
            withSequence(
              withTiming(-1, { duration: 55 }),
              withTiming(1, { duration: 85 }),
              withTiming(0, { duration: 55 }),
            ),
          );
      }
    }, [count, reduced, scale, shake]);
    useImperativeHandle(
      ref,
      () => ({
        setCount(next) {
          if (value === undefined) setInternal(Math.max(0, next));
          onChange?.(Math.max(0, next));
        },
      }),
      [onChange, value],
    );
    const badge = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));
    const bell = useAnimatedStyle(() => ({
      transform: [{ rotate: `${shake.value * 8}deg` }],
    }));
    const label = count > 99 ? '99+' : String(count);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: false }}
        onPress={() => {
          const next = count + 1;
          if (value === undefined) setInternal(next);
          onChange?.(next);
        }}
        style={[styles.hit, style]}
      >
        <Animated.View style={bell}>
          <View
            style={[
              styles.bell,
              { width: size, height: size, borderColor: color },
            ]}
          >
            <View style={[styles.clapper, { backgroundColor: color }]} />
          </View>
        </Animated.View>
        {count > 0 && (
          <Animated.View
            style={[styles.badge, { backgroundColor: color }, badge]}
          >
            <Text style={styles.number}>{label}</Text>
          </Animated.View>
        )}
      </Pressable>
    );
  },
);
export default BumpBadge;
const styles = StyleSheet.create({
  hit: { height: 60, justifyContent: 'center', width: 60 },
  bell: {
    borderRadius: 20,
    borderWidth: 2.5,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  clapper: {
    alignSelf: 'center',
    borderRadius: 5,
    height: 6,
    marginBottom: 5,
    width: 12,
  },
  badge: {
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute',
    right: 0,
    top: 1,
  },
  number: {
    color: 'white',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { BlurTargetView, BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const STACK_SPRING = { damping: 22, stiffness: 320, mass: 1 };
const DISMISS_SPRING = { damping: 18, stiffness: 260, mass: 1 };
const PRESS_SPRING = { damping: 20, stiffness: 360, mass: 0.8 };
const CARD_HEIGHT = 84;
const EXPANDED_GAP = 8;
const COMPACT_LAYERS = 3;

export type ToastType =
  'success' | 'message' | 'upload' | 'error' | 'undo' | 'info';

export type ToastInput = {
  /** Primary notification copy. */
  title: string;
  /** Supporting notification copy. */
  message?: string;
  /** Visual and semantic treatment. @default 'info' */
  type?: ToastType;
  /** Auto-dismiss delay in milliseconds. */
  duration?: number;
  /** Optional short action such as Retry or Undo. */
  actionLabel?: string;
  /** Called when the optional action is pressed. */
  onAction?: () => void;
  /** Upload progress from 0 to 1. */
  progress?: number;
  /** One or two characters used by message toasts as an avatar. */
  avatarLabel?: string;
};

export type ToastApi = {
  /** Adds a toast and returns its generated id. */
  show: (toast: ToastInput) => string;
  /** Dismisses one toast by id. */
  dismiss: (id: string) => void;
  /** Dismisses every visible toast. */
  dismissAll: () => void;
  /** Opens the stack into a readable fan. */
  expand: () => void;
  /** Collapses the fan into a compact stack. */
  collapse: () => void;
};

export type ToastProviderRef = ToastApi;

const ToastContext = createContext<ToastApi | null>(null);

/** Returns the nearest ToastProvider API. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used within ToastProvider');
  return api;
}

type ToastItem = ToastInput & { id: string };

type ToastVisual = {
  accent: string;
  accentSoft: string;
  glyph: string;
  eyebrow: string;
};

function getToastVisual(type: ToastType): ToastVisual {
  switch (type) {
    case 'success':
      return {
        accent: '#61E6B4',
        accentSoft: 'rgba(97,230,180,0.16)',
        glyph: '✓',
        eyebrow: 'Complete',
      };
    case 'message':
      return {
        accent: '#A99BFF',
        accentSoft: 'rgba(169,155,255,0.16)',
        glyph: '•',
        eyebrow: 'Message',
      };
    case 'upload':
      return {
        accent: '#8BB9FF',
        accentSoft: 'rgba(139,185,255,0.16)',
        glyph: '↑',
        eyebrow: 'Uploading',
      };
    case 'error':
      return {
        accent: '#FF857E',
        accentSoft: 'rgba(255,133,126,0.16)',
        glyph: '!',
        eyebrow: 'Needs attention',
      };
    case 'undo':
      return {
        accent: '#FFC56E',
        accentSoft: 'rgba(255,197,110,0.16)',
        glyph: '↩',
        eyebrow: 'Updated',
      };
    default:
      return {
        accent: '#A99BFF',
        accentSoft: 'rgba(169,155,255,0.16)',
        glyph: 'i',
        eyebrow: 'Update',
      };
  }
}

function ScalePressable({
  accessibilityLabel,
  children,
  onPress,
  style,
  textStyle,
}: {
  accessibilityLabel: string;
  children: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onPress}
        onPressIn={() => scale.set(withTiming(0.96, { duration: 90 }))}
        onPressOut={() => scale.set(withSpring(1, PRESS_SPRING))}
        style={styles.pressFill}
      >
        <Text style={[styles.actionText, textStyle]}>{children}</Text>
      </Pressable>
    </Animated.View>
  );
}

function ToastCard({
  blurTarget,
  expandedProgress,
  fontFamily,
  index,
  item,
  onAction,
  onDismiss,
  stackWidth,
  titleFontFamily,
  toggleExpanded,
}: {
  blurTarget: React.RefObject<View | null>;
  expandedProgress: SharedValue<number>;
  fontFamily?: string;
  index: number;
  item: ToastItem;
  onAction: (item: ToastItem) => void;
  onDismiss: (id: string) => void;
  stackWidth: number;
  titleFontFamily?: string;
  toggleExpanded: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const translateX = useSharedValue(0);
  const entry = useSharedValue(reducedMotion ? 1 : 0);
  const glow = useSharedValue(0);
  const visual = getToastVisual(item.type ?? 'info');
  const progress = Math.max(0, Math.min(1, item.progress ?? 0));

  useEffect(() => {
    if (reducedMotion) {
      entry.set(withTiming(1, { duration: 180 }));
      return;
    }
    entry.set(withSpring(1, { damping: 19, stiffness: 270, mass: 0.9 }));
    glow.set(
      withSequence(
        withTiming(1, { duration: 120 }),
        withDelay(
          220,
          withTiming(0, {
            duration: 320,
            easing: Easing.bezier(0.23, 1, 0.32, 1),
          }),
        ),
      ),
    );
  }, [entry, glow, reducedMotion]);

  const finishDismiss = useCallback(() => {
    onDismiss(item.id);
  }, [item.id, onDismiss]);

  /* Gesture callbacks run as worklets and intentionally mutate shared values. */
  /* eslint-disable react-hooks/immutability */
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-12, 12])
        .onChange((event) => {
          const distance = event.translationX;
          const resistance =
            (distance * stackWidth * 0.55) /
            (stackWidth + 0.55 * Math.abs(distance));
          translateX.value = resistance;
        })
        .onFinalize((event) => {
          const projection =
            translateX.value + (event.velocityX / 1000) * (0.998 / (1 - 0.998));
          if (Math.abs(projection) > stackWidth * 0.42) {
            const direction = projection < 0 ? -1 : 1;
            translateX.value = reducedMotion
              ? withTiming(
                  direction * stackWidth * 1.25,
                  { duration: 140 },
                  () => scheduleOnRN(finishDismiss),
                )
              : withSpring(
                  direction * stackWidth * 1.25,
                  { ...DISMISS_SPRING, velocity: event.velocityX },
                  (finished) => {
                    if (finished) scheduleOnRN(finishDismiss);
                  },
                );
          } else {
            translateX.value = reducedMotion
              ? withTiming(0, { duration: 150 })
              : withSpring(0, {
                  ...DISMISS_SPRING,
                  velocity: event.velocityX,
                });
          }
        }),
    [finishDismiss, reducedMotion, stackWidth, translateX],
  );
  /* eslint-enable react-hooks/immutability */

  const cardStyle = useAnimatedStyle(() => {
    const open = expandedProgress.value;
    const compactY = index * 10;
    const fanY = index * (CARD_HEIGHT + EXPANDED_GAP);
    const layoutOpen = reducedMotion ? (open >= 0.5 ? 1 : 0) : open;
    const depthScale = 1 - index * 0.045 * (1 - layoutOpen);
    const compactOpacity =
      index < COMPACT_LAYERS ? Math.max(0.46, 1 - index * 0.24) : 0;
    const layerOpacity = interpolate(
      open,
      [0, 1],
      [compactOpacity, 1],
      Extrapolation.CLAMP,
    );
    const reducedMotionOpacity = reducedMotion
      ? interpolate(open, [0, 0.42, 0.58, 1], [1, 0, 0, 1])
      : 1;
    return {
      filter: [
        {
          blur: interpolate(
            open,
            [0, 1],
            [Math.min(index, COMPACT_LAYERS - 1) * 1.4, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
      opacity:
        interpolate(entry.value, [0, 1], [0, 1], Extrapolation.CLAMP) *
        layerOpacity *
        reducedMotionOpacity,
      transform: [
        {
          translateX:
            translateX.value +
            interpolate(entry.value, [0, 1], [36, 0], Extrapolation.CLAMP),
        },
        {
          translateY:
            interpolate(layoutOpen, [0, 1], [compactY, fanY]) +
            interpolate(entry.value, [0, 1], [-18, 0]),
        },
        { scale: depthScale * interpolate(entry.value, [0, 1], [0.96, 1]) },
      ],
      zIndex: 100 - index,
    };
  });
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: interpolate(glow.value, [0, 1], [1.02, 1]) }],
  }));

  const isMessage = item.type === 'message';
  const hasProgress = item.type === 'upload';

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.cardPosition, cardStyle]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.entryGlow,
            {
              borderColor: visual.accent,
              boxShadow: `0px 0px 24px ${visual.accent}`,
            },
            glowStyle,
          ]}
        />
        <LinearGradient
          colors={[
            visual.accent,
            'rgba(255,255,255,0.15)',
            'rgba(255,255,255,0.03)',
          ]}
          end={{ x: 0.7, y: 1 }}
          locations={[0, 0.42, 1]}
          start={{ x: 0.08, y: 0 }}
          style={styles.borderGradient}
        >
          <BlurView
            blurMethod="dimezisBlurViewSdk31Plus"
            blurTarget={blurTarget}
            intensity={index === 0 ? 62 : 48}
            style={styles.glass}
            tint="systemChromeMaterialDark"
          >
            <Pressable
              accessibilityHint="Opens or closes the notification stack"
              accessibilityLabel={`${item.title}. ${item.message ?? ''}`}
              accessibilityRole="button"
              onPress={toggleExpanded}
              style={styles.cardBody}
            >
              {isMessage ? (
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[
                    styles.avatar,
                    { backgroundColor: visual.accentSoft },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      { color: visual.accent, fontFamily: titleFontFamily },
                    ]}
                  >
                    {item.avatarLabel?.slice(0, 2).toUpperCase() ?? 'A'}
                  </Text>
                  <View style={styles.onlineDot} />
                </View>
              ) : (
                <View
                  style={[
                    styles.icon,
                    {
                      backgroundColor: visual.accentSoft,
                      borderColor: `${visual.accent}55`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.iconText,
                      { color: visual.accent, fontFamily: titleFontFamily },
                    ]}
                  >
                    {visual.glyph}
                  </Text>
                </View>
              )}

              <View style={styles.copy}>
                <Text
                  numberOfLines={1}
                  style={[styles.eyebrow, { color: visual.accent, fontFamily }]}
                >
                  {visual.eyebrow}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.title, { fontFamily: titleFontFamily }]}
                >
                  {item.title}
                </Text>
                {item.message ? (
                  <Text
                    numberOfLines={1}
                    style={[styles.message, { fontFamily }]}
                  >
                    {item.message}
                  </Text>
                ) : null}
                {hasProgress ? (
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: visual.accent,
                          width: `${progress * 100}%`,
                        },
                      ]}
                    />
                  </View>
                ) : null}
              </View>
            </Pressable>

            {item.actionLabel ? (
              <ScalePressable
                accessibilityLabel={`${item.actionLabel}: ${item.title}`}
                onPress={() => onAction(item)}
                style={styles.toastAction}
                textStyle={{
                  color: visual.accent,
                  fontFamily: titleFontFamily,
                }}
              >
                {item.actionLabel}
              </ScalePressable>
            ) : (
              <ScalePressable
                accessibilityLabel={`Dismiss ${item.title}`}
                onPress={() => onDismiss(item.id)}
                style={styles.close}
                textStyle={styles.closeGlyph}
              >
                ×
              </ScalePressable>
            )}
          </BlurView>
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
}

export type ToastProviderProps = {
  /** App content rendered beneath the toast layer. */
  children: ReactNode;
  /** Default auto-dismiss delay in milliseconds. @default 5000 */
  duration?: number;
  /** Maximum number of visible toasts. @default 5 */
  maxVisible?: number;
  /** Font family for labels and supporting text. */
  fontFamily?: string;
  /** Font family for toast titles and actions. */
  titleFontFamily?: string;
  /** Called after a toast is dismissed. */
  onDismiss?: (id: string) => void;
  /** Optional style for the outer provider container. */
  style?: StyleProp<ViewStyle>;
  /** Optional style for the absolute toast host. */
  hostStyle?: StyleProp<ViewStyle>;
  /** Maximum distance the app content moves down while the stack is open. @default 344 */
  expandedContentOffset?: number;
  /** Test identifier applied to the outer provider container. */
  testID?: string;
};

/** A glass notification stack with fan expansion and physical swipe dismissal. */
export const ToastProvider = forwardRef<ToastProviderRef, ToastProviderProps>(
  function ToastProvider(
    {
      children,
      duration = 5000,
      maxVisible = 5,
      fontFamily,
      titleFontFamily,
      onDismiss,
      style,
      hostStyle,
      expandedContentOffset = 344,
      testID,
    },
    ref,
  ) {
    const reducedMotion = useReducedMotion();
    const [items, setItems] = useState<ToastItem[]>([]);
    const [expanded, setExpanded] = useState(false);
    const [stackWidth, setStackWidth] = useState(320);
    const expandedProgress = useSharedValue(0);
    const blurTarget = useRef<View>(null);
    const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const onDismissRef = useRef(onDismiss);

    useEffect(() => {
      onDismissRef.current = onDismiss;
    }, [onDismiss]);

    const setStackExpanded = useCallback(
      (next: boolean) => {
        setExpanded(next);
        expandedProgress.set(
          reducedMotion
            ? withTiming(next ? 1 : 0, { duration: 180 })
            : withSpring(next ? 1 : 0, STACK_SPRING),
        );
      },
      [expandedProgress, reducedMotion],
    );

    const dismiss = useCallback((id: string) => {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
      setItems((current) => current.filter((item) => item.id !== id));
      onDismissRef.current?.(id);
    }, []);

    const dismissAll = useCallback(() => {
      Object.values(timers.current).forEach(clearTimeout);
      timers.current = {};
      setItems([]);
      setStackExpanded(false);
    }, [setStackExpanded]);

    const show = useCallback(
      (input: ToastInput) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setItems((current) =>
          [{ ...input, id }, ...current].slice(0, maxVisible),
        );
        timers.current[id] = setTimeout(
          () => dismiss(id),
          input.duration ?? duration,
        );
        return id;
      },
      [dismiss, duration, maxVisible],
    );

    const api = useMemo<ToastApi>(
      () => ({
        show,
        dismiss,
        dismissAll,
        expand: () => setStackExpanded(true),
        collapse: () => setStackExpanded(false),
      }),
      [dismiss, dismissAll, setStackExpanded, show],
    );

    useImperativeHandle(ref, () => api, [api]);

    useEffect(
      () => () => Object.values(timers.current).forEach(clearTimeout),
      [],
    );

    const handleAction = useCallback(
      (item: ToastItem) => {
        item.onAction?.();
        dismiss(item.id);
      },
      [dismiss],
    );

    const handleHostLayout = useCallback((event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      if (width > 0) setStackWidth(width);
    }, []);

    const toggleExpanded = useCallback(() => {
      setStackExpanded(!expanded);
    }, [expanded, setStackExpanded]);

    const visibleCount = Math.min(items.length, maxVisible);
    const expandedStackHeight =
      CARD_HEIGHT +
      Math.max(0, visibleCount - 1) * (CARD_HEIGHT + EXPANDED_GAP);
    const contentShift = Math.min(
      expandedContentOffset,
      Math.max(CARD_HEIGHT + 24, expandedStackHeight - 110),
    );
    const contentStyle = useAnimatedStyle(() => ({
      opacity: reducedMotion
        ? interpolate(
            expandedProgress.value,
            [0, 1],
            [1, 0.12],
            Extrapolation.CLAMP,
          )
        : 1,
      transform: [
        {
          translateY: reducedMotion ? 0 : expandedProgress.value * contentShift,
        },
        {
          scale: reducedMotion
            ? 1
            : interpolate(
                expandedProgress.value,
                [0, 1],
                [1, 0.975],
                Extrapolation.CLAMP,
              ),
        },
      ],
    }));
    const backdropStyle = useAnimatedStyle(() => ({
      opacity: interpolate(
        expandedProgress.value,
        [0, 1],
        [0, 0.7],
        Extrapolation.CLAMP,
      ),
    }));

    return (
      <ToastContext.Provider value={api}>
        <View style={[styles.container, style]} testID={testID}>
          <BlurTargetView ref={blurTarget} style={styles.content}>
            <Animated.View
              pointerEvents={expanded ? 'none' : 'auto'}
              style={[styles.content, contentStyle]}
            >
              {children}
            </Animated.View>
          </BlurTargetView>
          <Animated.View
            pointerEvents="none"
            style={[styles.backdrop, backdropStyle]}
          />
          <View
            onLayout={handleHostLayout}
            pointerEvents="box-none"
            style={[styles.host, hostStyle]}
          >
            {items.map((item, index) => (
              <ToastCard
                blurTarget={blurTarget}
                expandedProgress={expandedProgress}
                fontFamily={fontFamily}
                index={index}
                item={item}
                key={item.id}
                onAction={handleAction}
                onDismiss={dismiss}
                stackWidth={stackWidth}
                titleFontFamily={titleFontFamily}
                toggleExpanded={toggleExpanded}
              />
            ))}
          </View>
        </View>
      </ToastContext.Provider>
    );
  },
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  host: {
    left: 14,
    minHeight: CARD_HEIGHT,
    position: 'absolute',
    right: 14,
    top: 64,
  },
  backdrop: {
    backgroundColor: '#050509',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  cardPosition: {
    height: CARD_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  entryGlow: {
    borderRadius: 23,
    borderWidth: 1,
    inset: -1,
    position: 'absolute',
  },
  borderGradient: {
    borderRadius: 22,
    boxShadow: '0px 1px 2px rgba(0,0,0,0.32), 0px 16px 40px rgba(0,0,0,0.42)',
    flex: 1,
    padding: 1,
  },
  glass: {
    backgroundColor: 'rgba(16,16,24,0.74)',
    borderRadius: 21,
    flex: 1,
    overflow: 'hidden',
  },
  cardBody: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 11,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 72,
    paddingTop: 10,
  },
  icon: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconText: { fontSize: 17, lineHeight: 20 },
  avatar: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  avatarText: { fontSize: 12, letterSpacing: 0.2 },
  onlineDot: {
    backgroundColor: '#61E6B4',
    borderColor: '#171720',
    borderRadius: 4,
    borderWidth: 1.5,
    bottom: -1,
    height: 8,
    position: 'absolute',
    right: -1,
    width: 8,
  },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 0.54,
    lineHeight: 11,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F7F7FA',
    fontSize: 14,
    letterSpacing: -0.14,
    lineHeight: 18,
  },
  message: {
    color: 'rgba(235,235,244,0.62)',
    fontSize: 11,
    lineHeight: 14,
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    height: 3,
    marginTop: 5,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: { borderRadius: 2, height: 3 },
  toastAction: {
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
    top: 20,
  },
  close: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 20,
    width: 44,
  },
  pressFill: { alignItems: 'center', justifyContent: 'center', minHeight: 28 },
  actionText: { fontSize: 12, letterSpacing: 0.1 },
  closeGlyph: {
    color: 'rgba(235,235,244,0.55)',
    fontSize: 22,
    lineHeight: 24,
  },
});

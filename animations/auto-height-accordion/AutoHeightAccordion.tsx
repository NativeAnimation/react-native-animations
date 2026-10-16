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
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

export type AccordionItem = { id: string; title: string; content: string };
export type AutoHeightAccordionRef = {
  open: (id: string) => void;
  close: (id: string) => void;
  toggle: (id: string) => void;
};
export type AutoHeightAccordionProps = {
  /** Font family for component text. Omit to preserve the existing font. */
  fontFamily?: string;

  /** Questions and answers displayed by the accordion. */ items: AccordionItem[];
  /** Controlled open item ids. */ value?: string[];
  /** Initial open item ids. @default [] */ defaultValue?: string[];
  /** Allows more than one answer to stay open. @default false */ allowMultiple?: boolean;
  /** Called when open item ids change. */ onChange?: (value: string[]) => void;
  /** Accent used for active controls. @default '#645BFF' */ accentColor?: string;
  /** Accessible label prefix. @default 'Toggle answer' */ accessibilityLabel?: string;
  /** Style applied to the outer container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier applied to the outer container. */
  testID?: string;
};

function AccordionRow({
  item,
  open,
  onPress,
  accentColor,
  label,
  fontFamily,
}: {
  item: AccordionItem;
  open: boolean;
  onPress: () => void;
  accentColor: string;
  label: string;
  fontFamily?: string;
}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(open ? 1 : 0);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    progress.set(
      reduced
        ? Number(open)
        : withSpring(Number(open), { damping: 48, stiffness: 220 }),
    );
  }, [open, progress, reduced]);
  const contentStyle = useAnimatedStyle(() => ({
    height: height * progress.get(),
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * -8 }],
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.get() * 180}deg` }],
  }));
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${label}: ${item.title}`}
        onPress={onPress}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <Text
          style={[styles.question, fontFamily ? { fontFamily } : undefined]}
        >
          {item.title}
        </Text>
        <Animated.Text
          style={[styles.chevron, { color: accentColor }, chevronStyle]}
        >
          ⌄
        </Animated.Text>
      </Pressable>
      <Animated.View
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
        aria-hidden={!open}
        pointerEvents={open ? 'auto' : 'none'}
        style={[styles.answerClip, contentStyle]}
      >
        <View
          onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
          style={styles.answerMeasure}
        >
          <Text
            style={[styles.answer, fontFamily ? { fontFamily } : undefined]}
          >
            {item.content}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

/** Measured-content accordion with interruptible spring expansion. */
export const AutoHeightAccordion = forwardRef<
  AutoHeightAccordionRef,
  AutoHeightAccordionProps
>(function AutoHeightAccordion(
  {
    fontFamily,

    items,
    value,
    defaultValue = [],
    allowMultiple = false,
    onChange,
    accentColor = '#645BFF',
    accessibilityLabel = 'Toggle answer',
    style,
    testID,
  },
  ref,
) {
  const [internal, setInternal] = useState(defaultValue);
  const openIds = value ?? internal;
  const pendingIds = useRef(openIds);
  useLayoutEffect(() => {
    pendingIds.current = openIds;
  });
  const update = useCallback(
    (transform: (current: string[]) => string[]) => {
      const next = transform(pendingIds.current);
      if (next === pendingIds.current) return;
      pendingIds.current = next;
      if (value === undefined) setInternal((current) => transform(current));
      onChange?.(next);
    },
    [onChange, value],
  );
  const toggle = useCallback(
    (id: string) =>
      update((current) =>
        current.includes(id)
          ? current.filter((openId) => openId !== id)
          : allowMultiple
            ? [...current, id]
            : [id],
      ),
    [allowMultiple, update],
  );
  useImperativeHandle(
    ref,
    () => ({
      open: (id) =>
        update((current) =>
          current.includes(id)
            ? current
            : allowMultiple
              ? [...current, id]
              : [id],
        ),
      close: (id) =>
        update((current) =>
          current.includes(id)
            ? current.filter((openId) => openId !== id)
            : current,
        ),
      toggle,
    }),
    [allowMultiple, toggle, update],
  );
  return (
    <View style={[styles.card, style]} testID={testID}>
      {items.map((item) => (
        <AccordionRow
          fontFamily={fontFamily}
          key={item.id}
          item={item}
          open={openIds.includes(item.id)}
          onPress={() => toggle(item.id)}
          accentColor={accentColor}
          label={accessibilityLabel}
        />
      ))}
    </View>
  );
});
export default AutoHeightAccordion;
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255,255,255,0.65)',
    borderRadius: 24,
    borderWidth: 1,
    boxShadow:
      '0px 1px 2px rgba(0,0,0,0.08), 0px 12px 32px rgba(20,20,40,0.14)',
    overflow: 'hidden',
  },
  row: { borderBottomColor: 'rgba(43,38,69,0.08)', borderBottomWidth: 1 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 62,
    paddingHorizontal: 20,
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  question: { color: '#28243A', flex: 1, fontSize: 15 },
  chevron: { fontSize: 24, marginLeft: 16 },
  answerClip: { overflow: 'hidden' },
  answerMeasure: { paddingBottom: 20, paddingHorizontal: 20 },
  answer: { color: '#777287', fontSize: 14, lineHeight: 21 },
});

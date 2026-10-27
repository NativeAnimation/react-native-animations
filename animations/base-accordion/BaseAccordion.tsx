import Animated, {
  ReduceMotion,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  baseActivationProps,
  useBaseReducedMotion,
  useBaseTheme,
  type BaseTheme,
} from '../base-theme';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  type StyleProp,
  type ViewStyle,
  type LayoutChangeEvent,
} from 'react-native';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

export type BaseAccordionItem = {
  value: string;
  title: string;
  content: React.ReactNode;
};
export type BaseAccordionProps = {
  items: BaseAccordionItem[];
  type?: 'single' | 'multiple';
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
  theme?: BaseTheme;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

const DISCLOSURE_EASING = Easing.bezier(0.215, 0.61, 0.355, 1);

function AccordionContent({
  content,
  theme,
}: {
  content: React.ReactNode;
  theme: BaseTheme;
}) {
  if (typeof content === 'string' || typeof content === 'number') {
    return (
      <Text
        style={{
          fontFamily: theme.fonts.regular,
          fontSize: 14,
          lineHeight: 20,
          color: theme.colors.mutedForeground,
        }}
      >
        {content}
      </Text>
    );
  }
  return content;
}

function AccordionItem({
  item,
  open,
  onToggle,
  last,
  theme,
  testID,
  reduced,
}: {
  item: BaseAccordionItem;
  open: boolean;
  onToggle: () => void;
  last: boolean;
  theme: BaseTheme;
  testID?: string;
  reduced: boolean;
}) {
  const height = useSharedValue(0);
  const progress = useSharedValue(open ? 1 : 0);
  const [measured, setMeasured] = useState(0);
  useEffect(() => {
    progress.set(
      reduced
        ? open
          ? 1
          : 0
        : withTiming(open ? 1 : 0, {
            reduceMotion: ReduceMotion.Never,
            duration: 350,
            easing: DISCLOSURE_EASING,
          }),
    );
  }, [open, progress, reduced]);
  useEffect(() => {
    height.set(measured);
  }, [height, measured]);
  const onMeasure = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    if (next !== measured) setMeasured(next);
  };
  const bodyStyle = useAnimatedStyle(() => ({
    height: height.get() * progress.get(),
    opacity: progress.get(),
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(progress.get(), [0, 1], [0, 180])}deg` },
    ],
  }));
  const tap = Gesture.Tap().onEnd((_event, success) => {
    if (success) scheduleOnRN(onToggle);
  });
  return (
    <View
      style={{
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <GestureDetector gesture={tap}>
        <Animated.View
          testID={testID ? `${testID}-trigger-${item.value}` : undefined}
          accessible
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          aria-expanded={open}
          accessibilityLabel={item.title}
          {
            /* RN Web forwards DOM events rather than native event objects. */
            ...(baseActivationProps(onToggle) as object)
          }
          style={{
            minHeight: 44,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Text
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: theme.fonts.medium,
              fontSize: 14,
              lineHeight: 20,
              color: theme.colors.foreground,
            }}
          >
            {item.title}
          </Text>
          <Animated.View style={chevronStyle}>
            <ChevronDown size={16} color={theme.colors.mutedForeground} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      <Animated.View
        aria-hidden={!open}
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
        pointerEvents={open ? 'auto' : 'none'}
        style={[{ overflow: 'hidden' }, bodyStyle]}
      >
        <View style={{ paddingBottom: 16 }}>
          <AccordionContent content={item.content} theme={theme} />
        </View>
      </Animated.View>
      <View
        pointerEvents="none"
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onLayout={onMeasure}
        style={{ position: 'absolute', left: 0, right: 0, top: 44, opacity: 0 }}
      >
        <View style={{ paddingBottom: 16 }}>
          <AccordionContent content={item.content} theme={theme} />
        </View>
      </View>
    </View>
  );
}

export function BaseAccordion({
  items,
  type = 'single',
  value: controlled,
  onValueChange,
  collapsible = true,
  theme: override,
  testID,
  style,
}: BaseAccordionProps) {
  const theme = useBaseTheme(override);
  const reduced = useBaseReducedMotion();
  const initial = controlled ?? (type === 'multiple' ? [] : '');
  const [internal, setInternal] = useState<string | string[]>(initial);
  const current = controlled ?? internal;
  const isOpen = (item: string) =>
    Array.isArray(current) ? current.includes(item) : current === item;
  const toggle = (item: string) => {
    let next: string | string[];
    if (type === 'multiple') {
      const list = Array.isArray(current) ? current : current ? [current] : [];
      next = list.includes(item)
        ? list.filter((value) => value !== item)
        : [...list, item];
    } else {
      next = current === item ? (collapsible ? '' : item) : item;
    }
    if (controlled === undefined) setInternal(next);
    onValueChange?.(next);
  };
  return (
    <View testID={testID} style={[{ width: '100%' }, style]}>
      {items.map((item, index) => (
        <AccordionItem
          key={item.value}
          item={item}
          open={isOpen(item.value)}
          onToggle={() => toggle(item.value)}
          last={index === items.length - 1}
          theme={theme}
          testID={testID}
          reduced={reduced}
        />
      ))}
    </View>
  );
}

export default BaseAccordion;

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useBaseTheme, type BaseTheme } from '../base-theme';
import { AnchoredPanel } from './AnchoredPanel';
import { PopoverTrigger } from './PopoverTrigger';

export type BaseTooltipProps = {
  label: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
  delayMs?: number;
  accessibilityLabel?: string;
  theme?: BaseTheme;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};
export function BaseTooltip({
  label,
  open: controlled,
  onOpenChange,
  children,
  side = 'top',
  delayMs = 500,
  accessibilityLabel,
  theme: override,
  style,
  testID,
}: BaseTooltipProps) {
  const theme = useBaseTheme(override);
  const { width } = useWindowDimensions();
  const anchor = useRef<View>(null);
  const [internal, setInternal] = useState(false);
  const open = controlled ?? internal;
  const setOpen = (next: boolean) => {
    if (controlled === undefined) setInternal(next);
    onOpenChange?.(next);
  };
  const [labelWidth, setLabelWidth] = useState(0);
  const pending = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancel = useCallback(() => {
    clearTimeout(pending.current);
    clearTimeout(closing.current);
  }, []);
  useEffect(() => cancel, [cancel]);
  const show = () => {
    cancel();
    setOpen(true);
  };
  const release = () => {
    cancel();
    closing.current = setTimeout(() => setOpen(false), 1500);
  };
  const hover = () => {
    cancel();
    pending.current = setTimeout(() => setOpen(true), Math.max(0, delayMs));
  };
  const leave = () => {
    cancel();
    setOpen(false);
  };
  const textStyle = {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.background,
  };
  return (
    <View style={[{ zIndex: open ? 10000 : undefined }, style]}>
      <PopoverTrigger
        anchorRef={anchor}
        theme={theme}
        label={accessibilityLabel ?? label}
        hint={label}
        expanded={open}
        tooltip
        delayMs={delayMs}
        onActivate={show}
        onRelease={release}
        onHover={hover}
        onLeave={leave}
        testID={testID}
      >
        {children}
      </PopoverTrigger>
      <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        aria-hidden
        style={{
          position: 'absolute',
          opacity: 0,
          width: Math.max(1, Math.min(264, width - 40)),
        }}
      >
        <Text
          onLayout={(event) => setLabelWidth(event.nativeEvent.layout.width)}
          style={[textStyle, { alignSelf: 'flex-start' }]}
        >
          {label}
        </Text>
      </View>
      <AnchoredPanel
        open={open}
        onClose={leave}
        anchorRef={anchor}
        side={side}
        align="center"
        sideOffset={8}
        width={labelWidth + 24}
        tooltip
        theme={theme}
        accessibilityLabel={label}
        testID={testID ? `${testID}-panel` : undefined}
      >
        <Text style={textStyle}>{label}</Text>
      </AnchoredPanel>
    </View>
  );
}

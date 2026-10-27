import {
  useBaseReducedMotion,
  BaseThemeProvider,
  spring,
  timing,
  type BaseTheme,
} from '../base-theme';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { PanelHost } from './PanelHost';

type Rect = { x: number; y: number; width: number; height: number };
// Kept local so copying this piece never depends on another overlay implementation.
export function useAnchoredPanel(
  controlled?: boolean,
  onOpenChange?: (open: boolean) => void,
) {
  const triggerRef = useRef<React.ComponentRef<typeof View>>(null);
  const [internal, setInternal] = useState(false);
  const open = controlled ?? internal;
  const changeOpen = useCallback(
    (next: boolean) => {
      if (controlled === undefined) setInternal(next);
      onOpenChange?.(next);
      if (!next && Platform.OS === 'web') triggerRef.current?.focus();
    },
    [controlled, onOpenChange],
  );
  return { triggerRef, open, changeOpen };
}
export function AnchoredPanel({
  open,
  onClose,
  anchorRef,
  side = 'bottom',
  align = 'center',
  sideOffset = 4,
  width: requestedWidth = 288,
  tooltip = false,
  theme,
  children,
  accessibilityLabel,
  testID,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<React.ComponentRef<typeof View> | View | null>;
  side?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  width?: number;
  tooltip?: boolean;
  theme: BaseTheme;
  children: React.ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}) {
  const { width, height } = useWindowDimensions();
  const reduced = useBaseReducedMotion();
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  const [anchor, setAnchor] = useState<Rect | null>(null);
  const [origin, setOrigin] = useState<Rect | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);
  const root = useRef<React.ComponentRef<typeof View>>(null);
  const panel = useRef<React.ComponentRef<typeof View>>(null);
  const measureOrigin = useCallback(() => {
    root.current?.measureInWindow((x, y, width, height) => {
      setOrigin((previous) =>
        previous?.x === x &&
        previous?.y === y &&
        previous?.width === width &&
        previous?.height === height
          ? previous
          : { x, y, width, height },
      );
    });
  }, []);
  const version = useRef(0);
  const pose = useSharedValue(0);
  const finishExit = useCallback((ticket: number) => {
    if (version.current === ticket) {
      setMounted(false);
      setAnchor(null);
      setOrigin(null);
      setPanelHeight(0);
    }
  }, []);
  useLayoutEffect(() => {
    if (!open) return;
    let current = true;
    (
      anchorRef.current as React.ComponentRef<typeof View> | null
    )?.measureInWindow((x, y, w, h) => {
      if (current) setAnchor({ x, y, width: w, height: h });
    });
    return () => {
      current = false;
    };
  }, [open, width, height, anchorRef]);
  const ready = Boolean(anchor && origin && panelHeight);
  useEffect(() => {
    const lifecycle = version;
    const ticket = ++lifecycle.current;
    if (!mounted) return;
    if (open && ready) {
      pose.set(withSpring(1, spring(theme, 'pop')));
      if (!tooltip && Platform.OS !== 'web' && panel.current)
        AccessibilityInfo.sendAccessibilityEvent(panel.current, 'focus');
      if (!tooltip && Platform.OS === 'web') panel.current?.focus();
    } else if (!open) {
      pose.set(
        withTiming(
          0,
          timing(theme, tooltip ? 'tooltipOut' : 'panelOut'),
          (finished) => {
            if (finished) scheduleOnRN(finishExit, ticket);
          },
        ),
      );
    }
    return () => {
      lifecycle.current++;
      cancelAnimation(pose);
    };
  }, [open, mounted, ready, tooltip, theme, pose, finishExit]);
  const localAnchor =
    anchor && origin
      ? { ...anchor, x: anchor.x - origin.x, y: anchor.y - origin.y }
      : null;
  const viewportWidth = origin?.width || width;
  const viewportHeight = origin?.height || height;
  const panelWidth = Math.max(0, Math.min(viewportWidth - 16, requestedWidth));
  const offset = Math.max(0, sideOffset);
  const below = localAnchor
    ? Math.max(
        0,
        viewportHeight - 8 - localAnchor.y - localAnchor.height - offset,
      )
    : 0;
  const above = localAnchor ? Math.max(0, localAnchor.y - 8 - offset) : 0;
  const preferred = side === 'top' ? above : below;
  const opposite = side === 'top' ? below : above;
  const flipped = panelHeight > preferred && opposite > preferred;
  const placedAbove = side === 'top' ? !flipped : flipped;
  const maxHeight = placedAbove ? above : below;
  const shownHeight = Math.min(panelHeight, maxHeight);
  const left = Math.max(
    8,
    Math.min(
      viewportWidth - panelWidth - 8,
      localAnchor
        ? localAnchor.x +
            (align === 'end'
              ? localAnchor.width - panelWidth
              : align === 'center'
                ? (localAnchor.width - panelWidth) / 2
                : 0)
        : 8,
    ),
  );
  const top = Math.max(
    8,
    Math.min(
      viewportHeight - shownHeight - 8,
      localAnchor
        ? placedAbove
          ? localAnchor.y - shownHeight - offset
          : localAnchor.y + localAnchor.height + offset
        : 8,
    ),
  );
  const arrowX = Math.max(
    10,
    Math.min(
      panelWidth - 20,
      (localAnchor
        ? localAnchor.x + localAnchor.width / 2
        : left + panelWidth / 2) -
        left -
        5,
    ),
  );
  const animated = useAnimatedStyle(() => ({
    opacity: ready ? Math.max(0, Math.min(1, pose.get())) : 0,
    transform: [
      {
        scale: reduced
          ? 1
          : (tooltip
              ? theme.motion.scales.tooltip
              : theme.motion.scales.popover) +
            (1 -
              (tooltip
                ? theme.motion.scales.tooltip
                : theme.motion.scales.popover)) *
              pose.get(),
      },
    ],
  }));
  const outside = Gesture.Tap()
    .enabled(open)
    .onEnd((_event, success) => {
      if (success) scheduleOnRN(onClose);
    });
  if (!mounted) return null;
  return (
    <PanelHost tooltip={tooltip} onClose={onClose} onShow={measureOrigin}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BaseThemeProvider theme={theme}>
          <View
            ref={root}
            collapsable={false}
            style={{ flex: 1 }}
            onLayout={measureOrigin}
          >
            <GestureDetector gesture={outside}>
              <Animated.View
                accessible={false}
                importantForAccessibility="no"
                style={StyleSheet.absoluteFill}
              />
            </GestureDetector>
            <Animated.View
              ref={panel}
              testID={testID}
              role={tooltip ? 'tooltip' : 'dialog'}
              tabIndex={-1}
              accessibilityLabel={accessibilityLabel}
              accessibilityViewIsModal={!tooltip}
              aria-modal={!tooltip}
              onAccessibilityEscape={onClose}
              pointerEvents={open && ready ? 'auto' : 'none'}
              {
                /* RN Web forwards DOM events rather than native event objects. */
                ...((Platform.OS === 'web'
                  ? {
                      onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
                        if (!tooltip && event.key === 'Tab') {
                          const candidates = Array.from(
                            event.currentTarget.querySelectorAll<HTMLElement>(
                              'input, textarea, button, select, a[href], [tabindex]',
                            ),
                          ).filter(
                            (node) =>
                              node.tabIndex >= 0 &&
                              !node.hasAttribute('disabled'),
                          );
                          const first = candidates[0];
                          const last = candidates[candidates.length - 1];
                          if (!first) {
                            event.preventDefault();
                            panel.current?.focus();
                          } else if (
                            event.shiftKey &&
                            (document.activeElement === first ||
                              document.activeElement === event.currentTarget)
                          ) {
                            event.preventDefault();
                            last.focus();
                          } else if (
                            !event.shiftKey &&
                            (document.activeElement === last ||
                              document.activeElement === event.currentTarget)
                          ) {
                            event.preventDefault();
                            first.focus();
                          }
                        }
                        if (event.key === 'Escape') {
                          event.stopPropagation();
                          onClose();
                        }
                      },
                    }
                  : {}) as object)
              }
              style={[
                {
                  position: 'absolute',
                  left,
                  top,
                  width: panelWidth,
                  maxHeight: ready
                    ? maxHeight
                    : Math.max(44, viewportHeight - 16),
                  borderWidth: tooltip ? 0 : 1,
                  borderColor: theme.colors.border,
                  backgroundColor: tooltip
                    ? theme.colors.foreground
                    : theme.colors.popover,
                  borderRadius: theme.radius.md,
                  boxShadow: tooltip ? undefined : theme.shadow.lg,
                  ...(Platform.OS === 'web'
                    ? ({ outlineStyle: 'none' } as object)
                    : null),
                  transformOrigin: `${Math.max(0, Math.min(panelWidth, (localAnchor ? localAnchor.x + localAnchor.width / 2 : left) - left))}px ${placedAbove ? 'bottom' : 'top'}`,
                },
                animated,
              ]}
            >
              {tooltip ? (
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: arrowX,
                    top: placedAbove ? undefined : -5,
                    bottom: placedAbove ? -5 : undefined,
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: theme.colors.foreground,
                    transform: [{ rotate: '45deg' }],
                  }}
                />
              ) : null}
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={(_w, h) =>
                  setPanelHeight(h + (tooltip ? 0 : 2))
                }
                contentContainerStyle={
                  tooltip
                    ? { paddingHorizontal: 12, paddingVertical: 6 }
                    : { padding: 16 }
                }
              >
                {children}
              </ScrollView>
            </Animated.View>
          </View>
        </BaseThemeProvider>
      </GestureHandlerRootView>
    </PanelHost>
  );
}

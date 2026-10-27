import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Modal, View, useWindowDimensions } from 'react-native';
export type PanelHostProps = {
  children: React.ReactNode;
  tooltip: boolean;
  onShow: () => void;
  onClose: () => void;
};
// A passive native overlay leaves the long-press gesture in its original window.
function TooltipHost({
  children,
  onShow,
}: Pick<PanelHostProps, 'children' | 'onShow'>) {
  const marker = useRef<View>(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const { width, height } = useWindowDimensions();
  const measure = useCallback(() => {
    marker.current?.measureInWindow((x, y) =>
      setOrigin((previous) =>
        previous.x === x && previous.y === y ? previous : { x, y },
      ),
    );
  }, []);
  useLayoutEffect(() => {
    measure();
  }, [width, height, measure]);
  useLayoutEffect(() => {
    onShow();
  }, [origin, onShow]);
  return (
    <View
      ref={marker}
      collapsable={false}
      pointerEvents="none"
      onLayout={measure}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        zIndex: 10000,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -origin.y,
          left: -origin.x,
          width,
          height,
        }}
      >
        {children}
      </View>
    </View>
  );
}
export function PanelHost({
  children,
  tooltip,
  onShow,
  onClose,
}: PanelHostProps) {
  if (tooltip) return <TooltipHost onShow={onShow}>{children}</TooltipHost>;
  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
      onShow={onShow}
    >
      {children}
    </Modal>
  );
}

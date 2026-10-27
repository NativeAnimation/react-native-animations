import React, { useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Modal, View } from 'react-native';
import type { PanelHostProps } from './PanelHost';
// A passive tooltip must not take the pointer or keyboard focus away from its trigger.
export function PanelHost({
  children,
  tooltip,
  onShow,
  onClose,
}: PanelHostProps) {
  useLayoutEffect(() => {
    if (tooltip) onShow();
  }, [tooltip, onShow]);
  if (tooltip)
    return createPortal(
      <View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10000,
          },
          { position: 'fixed' } as object,
        ]}
      >
        {children}
      </View>,
      document.body,
    );
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

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type NativeTouchEvent,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const DEFAULT_DURATION = 220;
const DEFAULT_HEIGHT = 56;
const LABEL_SPRING = { damping: 22, stiffness: 320, mass: 0.9 };

/** Imperative controls for the floating-label field. */
export type FloatingLabelInputRef = {
  /** Focuses the native input. */
  focus: () => void;
  /** Blurs the native input. */
  blur: () => void;
  /** Clears the current value. */
  clear: () => void;
};

export type FloatingLabelInputProps = {
  /** Label shown inside and above the field. */
  label: string;
  /** Controlled text value. */
  value?: string;
  /** Initial text when uncontrolled. @default '' */
  defaultValue?: string;
  /** Called whenever the text changes. */
  onChangeText?: (value: string) => void;
  /** Error copy shown below the field. Also marks it invalid. */
  error?: string;
  /** Supporting copy shown below a valid or neutral field. */
  helperText?: string;
  /** Visual validation state. Errors take precedence. @default 'idle' */
  validationState?: 'idle' | 'valid' | 'invalid';
  /** Shows a character counter. @default false */
  showCharacterCount?: boolean;
  /** Maximum input length and counter target. */
  maxLength?: number;
  /** Field height in points. @default 56 */
  height?: number;
  /** Focus and active-label color. @default '#6E56FF' */
  accentColor?: string;
  /** Resting border color. @default 'rgba(38, 35, 48, 0.14)' */
  borderColor?: string;
  /** Error color. @default '#D94763' */
  errorColor?: string;
  /** Valid-state color. @default '#168A69' */
  successColor?: string;
  /** Field background color. @default '#FFFFFF' */
  backgroundColor?: string;
  /** Input text color. @default '#17151C' */
  textColor?: string;
  /** Label font family. @default System font */
  labelFontFamily?: string;
  /** Input font family. @default System font */
  inputFontFamily?: string;
  /** Color appearance. @default 'auto' */
  colorScheme?: 'light' | 'dark' | 'auto';
  /** Base animation duration in milliseconds. @default 220 */
  duration?: number;
  /** Screen-reader label. Defaults to `label`. */
  accessibilityLabel?: string;
  /** Additional native-input props. */
  inputProps?: Omit<
    TextInputProps,
    'value' | 'defaultValue' | 'onChangeText' | 'maxLength' | 'placeholder'
  >;
  /** Optional style for the outer container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier applied to the native input. */
  testID?: string;
};

function StatusGlyph({
  backgroundColor,
  color,
  progress,
  state,
}: {
  backgroundColor: string;
  color: string;
  progress: SharedValue<number>;
  state: 'valid' | 'invalid';
}) {
  const shellStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.86, 1]) }],
  }));
  const shortStrokeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0.08, 0.34],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scaleX: interpolate(
          progress.value,
          [0.08, 0.48],
          [0, 1],
          Extrapolation.CLAMP,
        ),
      },
      { rotate: '45deg' },
    ],
  }));
  const longStrokeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0.35, 0.58],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scaleX: interpolate(
          progress.value,
          [0.35, 0.92],
          [0, 1],
          Extrapolation.CLAMP,
        ),
      },
      { rotate: '-48deg' },
    ],
  }));
  const alertLineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0.3, 0.62],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scaleY: interpolate(
          progress.value,
          [0.3, 0.75],
          [0, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const alertDotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0.66, 0.9],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          progress.value,
          [0.66, 1],
          [0.4, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.statusGlyph,
        { borderColor: color, backgroundColor },
        shellStyle,
      ]}
    >
      {state === 'valid' ? (
        <>
          <Animated.View
            style={[
              styles.checkShort,
              { backgroundColor: color },
              shortStrokeStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.checkLong,
              { backgroundColor: color },
              longStrokeStyle,
            ]}
          />
        </>
      ) : (
        <>
          <Animated.View
            style={[
              styles.alertLine,
              { backgroundColor: color },
              alertLineStyle,
            ]}
          />
          <Animated.View
            style={[styles.alertDot, { backgroundColor: color }, alertDotStyle]}
          />
        </>
      )}
    </Animated.View>
  );
}

/** A large floating-label field with touch-origin focus light and live validation. */
export const FloatingLabelInput = forwardRef<
  FloatingLabelInputRef,
  FloatingLabelInputProps
>(function FloatingLabelInput(
  {
    label,
    value,
    defaultValue = '',
    onChangeText,
    error,
    helperText,
    validationState = 'idle',
    showCharacterCount = false,
    maxLength,
    height = DEFAULT_HEIGHT,
    accentColor = '#6E56FF',
    borderColor = 'rgba(38, 35, 48, 0.14)',
    errorColor = '#D94763',
    successColor = '#168A69',
    backgroundColor = '#FFFFFF',
    textColor = '#17151C',
    labelFontFamily,
    inputFontFamily,
    colorScheme = 'auto',
    duration = DEFAULT_DURATION,
    accessibilityLabel = label,
    inputProps,
    style,
    testID,
  },
  ref,
) {
  const systemColorScheme = useColorScheme();
  const dark =
    colorScheme === 'dark' ||
    (colorScheme === 'auto' && systemColorScheme === 'dark');
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const [fieldSize, setFieldSize] = useState({ width: 0, height });
  const inputRef = useRef<TextInput>(null);
  const lastTouchAtRef = useRef(0);
  const reducedMotion = useReducedMotion();
  const text = value === undefined ? internalValue : value;
  const floated = focused || text.length > 0;
  const state = error ? 'invalid' : validationState;
  const message = error ?? helperText;
  const hasMessage = Boolean(message);
  const stateColor = state === 'invalid' ? errorColor : successColor;
  const focusProgress = useSharedValue(focused ? 1 : 0);
  const labelProgress = useSharedValue(floated ? 1 : 0);
  const messageProgress = useSharedValue(hasMessage ? 1 : 0);
  const statusProgress = useSharedValue(state === 'idle' ? 0 : 1);
  const lightProgress = useSharedValue(0);
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(height / 2);
  const surfaceColor =
    backgroundColor === '#FFFFFF' && dark ? '#17161E' : backgroundColor;
  const copyColor = textColor === '#17151C' && dark ? '#F7F5FA' : textColor;
  const restingBorder =
    borderColor === 'rgba(38, 35, 48, 0.14)' && dark
      ? 'rgba(255, 255, 255, 0.14)'
      : borderColor;
  const mutedColor = dark ? '#AAA6B5' : '#74717E';

  useEffect(() => {
    const target = focused ? 1 : 0;
    focusProgress.set(
      reducedMotion ? target : withSpring(target, LABEL_SPRING),
    );
  }, [focusProgress, focused, reducedMotion]);

  useEffect(() => {
    const target = floated ? 1 : 0;
    labelProgress.set(
      reducedMotion ? target : withSpring(target, LABEL_SPRING),
    );
  }, [floated, labelProgress, reducedMotion]);

  useEffect(() => {
    const target = hasMessage ? 1 : 0;
    if (hasMessage && !reducedMotion) messageProgress.set(0);
    messageProgress.set(
      reducedMotion
        ? target
        : withTiming(target, {
            duration,
            easing: Easing.bezier(0.23, 1, 0.32, 1),
          }),
    );
  }, [duration, hasMessage, message, messageProgress, reducedMotion]);

  useEffect(() => {
    if (state === 'idle') {
      statusProgress.set(
        reducedMotion
          ? 0
          : withTiming(0, { duration: Math.min(duration, 150) }),
      );
      return;
    }
    statusProgress.set(0);
    statusProgress.set(
      reducedMotion
        ? 1
        : withSpring(1, { damping: 17, stiffness: 260, mass: 0.8 }),
    );
  }, [duration, reducedMotion, state, statusProgress]);

  const updateText = useCallback(
    (next: string) => {
      if (value === undefined) setInternalValue(next);
      onChangeText?.(next);
    },
    [onChangeText, value],
  );

  const startFocusLight = useCallback(
    (x: number, y: number) => {
      touchX.set(x);
      touchY.set(y);
      if (reducedMotion) {
        lightProgress.set(1);
        return;
      }
      lightProgress.set(0);
      lightProgress.set(
        withTiming(1, {
          duration: Math.min(520, duration * 2.25),
          easing: Easing.bezier(0.23, 1, 0.32, 1),
        }),
      );
    },
    [duration, lightProgress, reducedMotion, touchX, touchY],
  );

  useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => updateText(''),
    }),
    [updateText],
  );

  const onFieldLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height: measuredHeight } = event.nativeEvent.layout;
      setFieldSize({ width, height: measuredHeight });
      if (touchX.get() === 0) {
        touchX.set(width / 2);
        touchY.set(measuredHeight / 2);
      }
    },
    [touchX, touchY],
  );

  const onTouchStart = useCallback(
    (event: NativeSyntheticEvent<NativeTouchEvent>) => {
      lastTouchAtRef.current = Date.now();
      startFocusLight(event.nativeEvent.locationX, event.nativeEvent.locationY);
      inputProps?.onTouchStart?.(event);
    },
    [inputProps, startFocusLight],
  );

  const labelStyle = useAnimatedStyle(() => ({
    color:
      state === 'invalid'
        ? errorColor
        : interpolateColor(
            focusProgress.value,
            [0, 1],
            [mutedColor, accentColor],
          ),
    fontSize: interpolate(labelProgress.value, [0, 1], [16, 11.5]),
    letterSpacing: interpolate(labelProgress.value, [0, 1], [0, 0.18]),
    transform: [
      {
        translateY: interpolate(
          labelProgress.value,
          [0, 1],
          [0, -height * 0.22],
        ),
      },
    ],
  }));
  const focusGlowStyle = useAnimatedStyle(() => ({
    opacity: state === 'invalid' ? 0 : focusProgress.value * 0.18,
    transform: [{ scale: 0.985 + focusProgress.value * 0.015 }],
  }));
  const topLeftLightStyle = useAnimatedStyle(() => ({
    left: touchX.value * (1 - lightProgress.value),
    opacity: focusProgress.value,
    width: touchX.value * lightProgress.value,
  }));
  const topRightLightStyle = useAnimatedStyle(() => ({
    left: touchX.value,
    opacity: focusProgress.value,
    width: Math.max(0, fieldSize.width - touchX.value) * lightProgress.value,
  }));
  const leftTopLightStyle = useAnimatedStyle(() => ({
    height: touchY.value * lightProgress.value,
    opacity: focusProgress.value,
    top: touchY.value * (1 - lightProgress.value),
  }));
  const leftBottomLightStyle = useAnimatedStyle(() => ({
    height: Math.max(0, fieldSize.height - touchY.value) * lightProgress.value,
    opacity: focusProgress.value,
    top: touchY.value,
  }));
  const messageStyle = useAnimatedStyle(() => ({
    filter: [{ blur: (1 - messageProgress.value) * 4 }],
    height: messageProgress.value * 24,
    opacity: messageProgress.value,
    transform: [
      { translateY: interpolate(messageProgress.value, [0, 1], [-5, 0]) },
    ],
  }));

  const hasFooter = hasMessage || showCharacterCount;
  const iconVisible = state !== 'idle';
  const lineColor = state === 'invalid' ? errorColor : accentColor;

  return (
    <View style={[styles.container, style]}>
      <View
        onLayout={onFieldLayout}
        style={[
          styles.field,
          {
            backgroundColor: surfaceColor,
            borderColor: state === 'invalid' ? errorColor : restingBorder,
            height,
          },
        ]}
      >
        <LinearGradient
          colors={
            dark
              ? ['rgba(255,255,255,0.045)', 'rgba(255,255,255,0)']
              : ['rgba(255,255,255,0.98)', 'rgba(248,247,251,0.7)']
          }
          end={{ x: 0.75, y: 1 }}
          pointerEvents="none"
          start={{ x: 0.2, y: 0 }}
          style={styles.surface}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.focusGlow,
            {
              borderColor: accentColor,
              boxShadow: `0px 0px 18px ${accentColor}`,
            },
            focusGlowStyle,
          ]}
        />
        <Animated.Text
          pointerEvents="none"
          style={[styles.label, { fontFamily: labelFontFamily }, labelStyle]}
        >
          {label}
        </Animated.Text>
        <TextInput
          {...inputProps}
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ disabled: inputProps?.editable === false }}
          aria-invalid={state === 'invalid'}
          maxLength={maxLength}
          onBlur={(event) => {
            setFocused(false);
            inputProps?.onBlur?.(event);
          }}
          onChangeText={updateText}
          onFocus={(event) => {
            setFocused(true);
            if (Date.now() - lastTouchAtRef.current > 120)
              startFocusLight(fieldSize.width / 2, fieldSize.height / 2);
            inputProps?.onFocus?.(event);
          }}
          onTouchStart={onTouchStart}
          ref={inputRef}
          style={[
            styles.input,
            {
              color: copyColor,
              fontFamily: inputFontFamily,
              height,
              paddingTop: floated ? height * 0.27 : 0,
            },
          ]}
          testID={testID}
          value={text}
        />
        {iconVisible ? (
          <StatusGlyph
            backgroundColor={surfaceColor}
            color={stateColor}
            progress={statusProgress}
            state={state}
          />
        ) : null}
        {focused ? (
          <View pointerEvents="none" style={styles.borderLightClip}>
            <Animated.View
              style={[
                styles.horizontalLight,
                styles.topLight,
                { backgroundColor: lineColor },
                topLeftLightStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.horizontalLight,
                styles.topLight,
                { backgroundColor: lineColor },
                topRightLightStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.horizontalLight,
                styles.bottomLight,
                { backgroundColor: lineColor },
                topLeftLightStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.horizontalLight,
                styles.bottomLight,
                { backgroundColor: lineColor },
                topRightLightStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.verticalLight,
                styles.leftLight,
                { backgroundColor: lineColor },
                leftTopLightStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.verticalLight,
                styles.leftLight,
                { backgroundColor: lineColor },
                leftBottomLightStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.verticalLight,
                styles.rightLight,
                { backgroundColor: lineColor },
                leftTopLightStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.verticalLight,
                styles.rightLight,
                { backgroundColor: lineColor },
                leftBottomLightStyle,
              ]}
            />
          </View>
        ) : null}
      </View>

      {hasFooter ? (
        <View style={styles.footer}>
          <Animated.View style={[styles.messageClip, messageStyle]}>
            <Text
              accessibilityLiveRegion="polite"
              style={[
                styles.messageText,
                {
                  color: state === 'invalid' ? errorColor : successColor,
                  fontFamily: labelFontFamily,
                },
              ]}
            >
              {message ?? ''}
            </Text>
          </Animated.View>
          {showCharacterCount ? (
            <Text
              accessibilityLabel={`${text.length}${maxLength === undefined ? '' : ` of ${maxLength}`} characters`}
              style={[
                styles.count,
                { color: mutedColor, fontFamily: labelFontFamily },
              ]}
            >
              {text.length}
              {maxLength === undefined ? '' : `/${maxLength}`}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  alertDot: {
    borderRadius: 1.5,
    bottom: 4.5,
    height: 3,
    position: 'absolute',
    width: 3,
  },
  alertLine: {
    borderRadius: 1,
    height: 7,
    position: 'absolute',
    top: 4,
    width: 2,
  },
  borderLightClip: {
    borderRadius: 15,
    bottom: -1,
    left: -1,
    overflow: 'hidden',
    position: 'absolute',
    right: -1,
    top: -1,
  },
  bottomLight: { bottom: 0 },
  checkLong: {
    borderRadius: 1,
    height: 2,
    left: 7,
    position: 'absolute',
    top: 8,
    width: 9,
  },
  checkShort: {
    borderRadius: 1,
    height: 2,
    left: 4,
    position: 'absolute',
    top: 10,
    width: 6,
  },
  container: { flex: 1, width: '100%' },
  count: { fontSize: 11, marginLeft: 'auto', marginTop: 6 },
  field: {
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    position: 'relative',
    boxShadow:
      '0px 1px 2px rgba(20,18,30,0.07), 0px 10px 28px rgba(20,18,30,0.08)',
  },
  focusGlow: {
    borderRadius: 15,
    borderWidth: 1,
    bottom: -1,
    left: -1,
    position: 'absolute',
    right: -1,
    top: -1,
  },
  footer: { flexDirection: 'row', minHeight: 0 },
  horizontalLight: {
    boxShadow: '0px 0px 8px rgba(110,86,255,0.85)',
    height: 1.5,
    position: 'absolute',
  },
  input: {
    fontSize: 16,
    letterSpacing: -0.12,
    paddingBottom: 0,
    paddingHorizontal: 16,
    paddingRight: 52,
    paddingVertical: 0,
  },
  label: { left: 16, position: 'absolute', zIndex: 1 },
  leftLight: { left: 0 },
  messageClip: { flex: 1, overflow: 'hidden' },
  messageText: { fontSize: 11.5, lineHeight: 17, marginLeft: 2, marginTop: 5 },
  rightLight: { right: 0 },
  statusGlyph: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 15,
    width: 20,
  },
  surface: {
    borderRadius: 14,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  topLight: { top: 0 },
  verticalLight: {
    boxShadow: '0px 0px 8px rgba(110,86,255,0.85)',
    position: 'absolute',
    width: 1.5,
  },
});

export default FloatingLabelInput;

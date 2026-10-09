import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  interpolateColor,
  ReduceMotion,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

/** A product image and the colors used while that variant is selected. */
export type VariantCarouselVariant = {
  /** Name displayed in the horizontal variant rail. */
  name: string;
  /** Local or remote product image with a transparent background. */
  image: ImageSourcePropType;
  /** Full-screen background color for this variant. */
  backgroundColor: string;
  /** Color used by the oversized brand wordmark. */
  brandColor: string;
  /** Primary foreground color for names, borders, and values. */
  textColor: string;
  /** Muted foreground color used by specification labels. */
  secondaryColor: string;
};

/** One label-value pair in the product specification stack. */
export type VariantCarouselSpecification = {
  /** Short specification label. */
  label: string;
  /** Short specification value. */
  value: string;
};

/** Imperative controls for the variant carousel. */
export type VariantCarouselRef = {
  /** Animates to a zero-based variant index. */
  goTo: (index: number) => void;
  /** Animates to the next variant. */
  next: () => void;
  /** Animates to the previous variant. */
  prev: () => void;
};

export type VariantCarouselProps = {
  /** Product variants. At least two variants are required. */
  variants: VariantCarouselVariant[];
  /** Brand wordmark displayed behind the product. @default 'NOVA' */
  brandName?: string;
  /** Short mark displayed inside the circular logo. @default 'n' */
  logoText?: string;
  /** Product facts displayed below the hero area. Exactly three fit the measured layout. */
  specifications?: VariantCarouselSpecification[];
  /** Purchase action text. @default 'Add to cart' */
  actionLabel?: string;
  /** Formatted price text. @default '$249.00' */
  priceLabel?: string;
  /** Accessible name for the next-variant button. @default 'Next color' */
  nextAccessibilityLabel?: string;
  /** Accessible hint for the next-variant button. @default 'Shows the next color variant' */
  nextAccessibilityHint?: string;
  /** Called after a transition settles on a variant. */
  onIndexChange?: (index: number) => void;
  /** Called when the user begins dragging the carousel. */
  onGestureStart?: () => void;
  /** Spring damping used for every transition. @default 20 */
  springDamping?: number;
  /** Spring stiffness used for every transition. @default 180 */
  springStiffness?: number;
  /** Spring mass used for every transition. @default 1 */
  springMass?: number;
  /** Drag distance, as a fraction of width, required to advance. @default 0.22 */
  swipeDistanceThreshold?: number;
  /** Horizontal velocity required to advance. @default 600 */
  swipeVelocityThreshold?: number;
  /** Product image size as a fraction of container width. @default 1.25 */
  productSizeRatio?: number;
  /** Product layer's left position as a fraction of width. @default 0.24 */
  productHorizontalOffset?: number;
  /** Product layer's top position as a fraction of height. @default 0.03 */
  productVerticalOffset?: number;
  /** Color of the translucent purchase bar. @default 'rgba(0,0,0,0.22)' */
  purchaseBarColor?: string;
  /** Color of both purchase labels. @default '#FFFFFF' */
  purchaseTextColor?: string;
  /** Font family for the brand wordmark and circular logo. */
  brandFontFamily?: string;
  /** Font family for variant names. */
  variantFontFamily?: string;
  /** Font family for specification labels. */
  bodyFontFamily?: string;
  /** Font family for specification values and purchase labels. */
  emphasisFontFamily?: string;
  /** Optional style for the outer container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier applied to the outer container. */
  testID?: string;
};

type ProductLayerProps = {
  count: number;
  index: number;
  progress: SharedValue<number>;
  reduceMotion: boolean;
  size: number;
  source: ImageSourcePropType;
  width: number;
};

type NameLayerProps = {
  colors: readonly string[];
  count: number;
  fontFamily?: string;
  index: number;
  name: string;
  progress: SharedValue<number>;
  reduceMotion: boolean;
  width: number;
};

const DEFAULT_SPECIFICATIONS: VariantCarouselSpecification[] = [
  { label: 'Form factor', value: 'Over-ear' },
  { label: 'Connection', value: 'Wireless' },
  { label: 'Battery', value: '40 hr' },
];

function positiveModulo(value: number, divisor: number) {
  'worklet';
  return ((value % divisor) + divisor) % divisor;
}

function wrappedDistance(index: number, progress: number, count: number) {
  'worklet';
  const rawDistance = index - progress;
  return count / 2 - positiveModulo(count / 2 - rawDistance, count);
}

function animatedColor(
  progress: number,
  colors: readonly string[],
  count: number,
) {
  'worklet';
  const base = Math.floor(progress);
  const fraction = progress - base;
  const currentIndex = positiveModulo(base, count);
  const nextIndex = positiveModulo(base + 1, count);

  return interpolateColor(
    fraction,
    [0, 1],
    [colors[currentIndex], colors[nextIndex]],
  );
}

function weightedFontStyle(
  fontFamily: string | undefined,
  fontWeight: TextStyle['fontWeight'],
): TextStyle {
  return fontFamily ? { fontFamily } : { fontWeight };
}

function ProductLayer({
  count,
  index,
  progress,
  reduceMotion,
  size,
  source,
  width,
}: ProductLayerProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const distance = wrappedDistance(index, progress.value, count);
    let opacity = 0;
    let scale = 1;
    let translateX = 0;

    if (distance >= 0 && distance <= 1) {
      opacity = 1 - distance;
      if (!reduceMotion) {
        translateX = distance * 0.65 * width;
        scale = 1 - 0.06 * distance;
      }
    } else if (distance >= -1 && distance < 0) {
      opacity = Math.max(0, 1 + distance * 1.6);
      if (!reduceMotion) {
        translateX = distance * 0.08 * width;
        scale = 1 + 0.04 * distance;
      }
    }

    return { opacity, transform: [{ translateX }, { scale }] };
  });

  return (
    <Animated.Image
      accessible={false}
      resizeMode="contain"
      source={source}
      style={[styles.product, { height: size, width: size }, animatedStyle]}
    />
  );
}

function NameLayer({
  colors,
  count,
  fontFamily,
  index,
  name,
  progress,
  reduceMotion,
  width,
}: NameLayerProps) {
  const fontSize = width * 0.056;
  const lineHeight = width * 0.067;
  const horizontalInset = width * 0.053;
  const fontStyle = weightedFontStyle(fontFamily, '500');
  const movingStyle = useAnimatedStyle(() => {
    const distance = wrappedDistance(index, progress.value, count);
    const opacity = interpolate(
      distance,
      [-0.5, 0, 1, 1.6],
      [0, 1, 0.55, 0],
      Extrapolation.CLAMP,
    );
    return {
      color: animatedColor(progress.value, colors, count),
      opacity,
      transform: [{ translateX: distance * width * 0.62 }],
    };
  });
  const currentReducedStyle = useAnimatedStyle(() => {
    const distance = Math.abs(wrappedDistance(index, progress.value, count));
    return {
      color: animatedColor(progress.value, colors, count),
      opacity: interpolate(distance, [0, 1], [1, 0], Extrapolation.CLAMP),
    };
  });
  const nextReducedStyle = useAnimatedStyle(() => {
    const distance = Math.abs(
      wrappedDistance(index, progress.value, count) - 1,
    );
    return {
      color: animatedColor(progress.value, colors, count),
      opacity: interpolate(distance, [0, 1], [0.55, 0], Extrapolation.CLAMP),
    };
  });

  if (reduceMotion) {
    return (
      <>
        <Animated.Text
          style={[
            styles.currentReducedName,
            fontStyle,
            { fontSize, left: horizontalInset, lineHeight },
            currentReducedStyle,
          ]}
        >
          {name}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.nextReducedName,
            fontStyle,
            { fontSize, lineHeight, right: horizontalInset },
            nextReducedStyle,
          ]}
        >
          {name}
        </Animated.Text>
      </>
    );
  }

  return (
    <Animated.Text
      style={[
        styles.variantName,
        fontStyle,
        { fontSize, left: horizontalInset, lineHeight },
        movingStyle,
      ]}
    >
      {name}
    </Animated.Text>
  );
}

/**
 * A gesture-driven product carousel that synchronizes imagery, copy, and the
 * full-screen color field through one interruptible progress value.
 */
export const VariantCarousel = forwardRef<
  VariantCarouselRef,
  VariantCarouselProps
>(function VariantCarousel(
  {
    variants,
    brandName = 'NOVA',
    logoText = 'n',
    specifications = DEFAULT_SPECIFICATIONS,
    actionLabel = 'Add to cart',
    priceLabel = '$249.00',
    nextAccessibilityLabel = 'Next color',
    nextAccessibilityHint = 'Shows the next color variant',
    onIndexChange,
    onGestureStart,
    springDamping = 20,
    springStiffness = 180,
    springMass = 1,
    swipeDistanceThreshold = 0.22,
    swipeVelocityThreshold = 600,
    productSizeRatio = 1.25,
    productHorizontalOffset = 0.24,
    productVerticalOffset = 0.03,
    purchaseBarColor = 'rgba(0,0,0,0.22)',
    purchaseTextColor = '#FFFFFF',
    brandFontFamily,
    variantFontFamily,
    bodyFontFamily,
    emphasisFontFamily,
    style,
    testID,
  },
  ref,
) {
  if (variants.length < 2) {
    throw new Error('VariantCarousel requires at least two variants.');
  }

  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const count = variants.length;
  const backgroundColors = variants.map((variant) => variant.backgroundColor);
  const brandColors = variants.map((variant) => variant.brandColor);
  const textColors = variants.map((variant) => variant.textColor);
  const secondaryColors = variants.map((variant) => variant.secondaryColor);
  const { width, height } = size;
  const productSize = width * productSizeRatio;
  const logoDiameter = width * 0.13;
  const logoFontSize = width * 0.07;
  const namesLineHeight = width * 0.067;
  const brandLineHeight = width * 0.22;
  const specificationFontSize = width * 0.047;
  const specificationLineHeight = width * 0.057;
  const horizontalInset = width * 0.053;
  const specificationTops = [0.51, 0.622, 0.732] as const;

  const finishIndexChange = useCallback(
    (index: number) => onIndexChange?.(index),
    [onIndexChange],
  );
  const notifyGestureStart = useCallback(
    () => onGestureStart?.(),
    [onGestureStart],
  );

  const animateTo = useCallback(
    (target: number, velocity = 0) => {
      const normalizedIndex = positiveModulo(Math.round(target), count);
      progress.set(
        withSpring(
          target,
          {
            damping: springDamping,
            stiffness: springStiffness,
            mass: springMass,
            reduceMotion: ReduceMotion.Never,
            velocity,
          },
          (finished) => {
            if (finished) {
              scheduleOnRN(finishIndexChange, normalizedIndex);
            }
          },
        ),
      );
    },
    [
      count,
      finishIndexChange,
      progress,
      springDamping,
      springMass,
      springStiffness,
    ],
  );

  const next = useCallback(() => {
    animateTo(Math.round(progress.get()) + 1);
  }, [animateTo, progress]);
  const prev = useCallback(() => {
    animateTo(Math.round(progress.get()) - 1);
  }, [animateTo, progress]);
  const goTo = useCallback(
    (index: number) => {
      if (!Number.isInteger(index) || index < 0 || index >= count) {
        throw new Error(
          `VariantCarousel index must be an integer from 0 to ${count - 1}.`,
        );
      }
      const current = Math.round(progress.get());
      const currentIndex = positiveModulo(current, count);
      let delta = index - currentIndex;
      if (delta > count / 2) delta -= count;
      if (delta < -count / 2) delta += count;
      animateTo(current + delta);
    },
    [animateTo, count, progress],
  );

  useImperativeHandle(ref, () => ({ goTo, next, prev }), [goTo, next, prev]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextSize = event.nativeEvent.layout;
    setSize((current) =>
      current.width === nextSize.width && current.height === nextSize.height
        ? current
        : { width: nextSize.width, height: nextSize.height },
    );
  }, []);

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColor(progress.value, backgroundColors, count),
  }));
  const textStyle = useAnimatedStyle(() => ({
    color: animatedColor(progress.value, textColors, count),
  }));
  const logoBorderStyle = useAnimatedStyle(() => ({
    borderColor: animatedColor(progress.value, textColors, count),
  }));
  const secondaryTextStyle = useAnimatedStyle(() => ({
    color: animatedColor(progress.value, secondaryColors, count),
  }));
  const brandStyle = useAnimatedStyle(() => ({
    color: animatedColor(progress.value, brandColors, count),
  }));
  const dipStyle = useAnimatedStyle(() => {
    const fraction = progress.value - Math.floor(progress.value);
    return { opacity: 1 - 0.7 * Math.sin(Math.PI * fraction) };
  });

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onBegin(() => {
      cancelAnimation(progress);
      scheduleOnRN(notifyGestureStart);
    })
    .onChange((event) => {
      if (width > 0) progress.set(progress.get() - event.changeX / width);
    })
    .onEnd((event) => {
      if (width <= 0) return;
      const origin = Math.round(progress.get() + event.translationX / width);
      const hasDistance =
        Math.abs(event.translationX) > width * swipeDistanceThreshold;
      const hasVelocity = Math.abs(event.velocityX) > swipeVelocityThreshold;
      let destination = origin;

      if (hasDistance || hasVelocity) {
        const directionSource = hasVelocity
          ? event.velocityX
          : event.translationX;
        destination = origin + (directionSource < 0 ? 1 : -1);
      }

      const destinationIndex = positiveModulo(destination, count);
      progress.set(
        withSpring(
          destination,
          {
            damping: springDamping,
            stiffness: springStiffness,
            mass: springMass,
            reduceMotion: ReduceMotion.Never,
            velocity: -event.velocityX / width,
          },
          (finished) => {
            if (finished) {
              scheduleOnRN(finishIndexChange, destinationIndex);
            }
          },
        ),
      );
    })
    .onFinalize((_event, success) => {
      if (!success) {
        progress.set(
          withSpring(Math.round(progress.get()), {
            damping: springDamping,
            stiffness: springStiffness,
            mass: springMass,
            reduceMotion: ReduceMotion.Never,
          }),
        );
      }
    });

  const brandFontStyle = weightedFontStyle(brandFontFamily, '900');
  const logoFontStyle = weightedFontStyle(brandFontFamily, '800');
  const valueFontStyle = weightedFontStyle(emphasisFontFamily, '600');
  const actionFontStyle = weightedFontStyle(emphasisFontFamily, '600');
  const priceFontStyle = weightedFontStyle(emphasisFontFamily, '700');

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        onLayout={handleLayout}
        style={[styles.screen, style, backgroundStyle]}
        testID={testID}
      >
        <SafeAreaView
          style={[
            styles.safeArea,
            Platform.OS === 'android' && {
              paddingTop: StatusBar.currentHeight ?? 0,
            },
          ]}
        >
          <View
            pointerEvents="none"
            style={[
              styles.products,
              {
                height: productSize,
                left: width * productHorizontalOffset,
                top: height * productVerticalOffset,
                width: productSize,
              },
            ]}
          >
            {variants.map((variant, index) => (
              <ProductLayer
                count={count}
                index={index}
                key={`${variant.name}-${index}`}
                progress={progress}
                reduceMotion={reduceMotion}
                size={productSize}
                source={variant.image}
                width={width}
              />
            ))}
          </View>

          <Animated.Text
            style={[
              styles.brand,
              brandFontStyle,
              {
                fontSize: width * 0.2,
                left: horizontalInset,
                letterSpacing: width * -0.01,
                lineHeight: brandLineHeight,
                top: height * 0.245 - brandLineHeight / 2,
              },
              brandStyle,
            ]}
          >
            {brandName}
          </Animated.Text>

          <Animated.View
            style={[
              styles.logo,
              {
                borderRadius: logoDiameter / 2,
                borderWidth: width * 0.012,
                height: logoDiameter,
                left: width * 0.12 - logoDiameter / 2,
                top: height * 0.075 - logoDiameter / 2,
                width: logoDiameter,
              },
              logoBorderStyle,
            ]}
          >
            <Animated.Text
              style={[
                logoFontStyle,
                { fontSize: logoFontSize, lineHeight: logoFontSize * 1.05 },
                textStyle,
              ]}
            >
              {logoText}
            </Animated.Text>
          </Animated.View>

          <View
            pointerEvents="none"
            style={[
              styles.names,
              {
                height: namesLineHeight,
                top: height * 0.175 - namesLineHeight / 2,
              },
            ]}
          >
            {variants.map((variant, index) => (
              <NameLayer
                colors={textColors}
                count={count}
                fontFamily={variantFontFamily}
                index={index}
                key={`${variant.name}-${index}`}
                name={variant.name}
                progress={progress}
                reduceMotion={reduceMotion}
                width={width}
              />
            ))}
          </View>
          <Pressable
            accessibilityHint={nextAccessibilityHint}
            accessibilityLabel={nextAccessibilityLabel}
            accessibilityRole="button"
            onPress={next}
            style={[
              styles.nextColorButton,
              { height: height * 0.08, top: height * 0.135 },
            ]}
          />

          <View
            pointerEvents="none"
            style={[styles.specifications, { left: horizontalInset }]}
          >
            {specifications.slice(0, 3).map((specification, index) => (
              <View
                key={`${specification.label}-${index}`}
                style={[
                  styles.specification,
                  { top: height * specificationTops[index] },
                ]}
              >
                <Animated.Text
                  style={[
                    {
                      fontFamily: bodyFontFamily,
                      fontSize: specificationFontSize,
                      lineHeight: specificationLineHeight,
                    },
                    secondaryTextStyle,
                  ]}
                >
                  {specification.label}
                </Animated.Text>
                <Animated.Text
                  style={[
                    styles.specificationValue,
                    valueFontStyle,
                    {
                      fontSize: specificationFontSize,
                      lineHeight: specificationLineHeight,
                      top: height * 0.033,
                    },
                    textStyle,
                    dipStyle,
                  ]}
                >
                  {specification.value}
                </Animated.Text>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.bottomBar,
              {
                backgroundColor: purchaseBarColor,
                borderRadius: width * 0.0375,
                bottom: height * 0.048,
                height: height * 0.072,
                left: horizontalInset,
                paddingHorizontal: width * 0.05,
                right: horizontalInset,
              },
            ]}
          >
            <Animated.Text
              style={[
                actionFontStyle,
                { color: purchaseTextColor, fontSize: width * 0.044 },
                dipStyle,
              ]}
            >
              {actionLabel}
            </Animated.Text>
            <Animated.Text
              style={[
                priceFontStyle,
                { color: purchaseTextColor, fontSize: width * 0.044 },
                dipStyle,
              ]}
            >
              {priceLabel}
            </Animated.Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </GestureDetector>
  );
});

export default VariantCarousel;

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden' },
  safeArea: { flex: 1 },
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 3,
  },
  names: { left: 0, position: 'absolute', right: 0, zIndex: 3 },
  variantName: { position: 'absolute' },
  currentReducedName: { position: 'absolute' },
  nextReducedName: { position: 'absolute' },
  nextColorButton: {
    position: 'absolute',
    right: 0,
    width: '45%',
    zIndex: 4,
  },
  brand: { position: 'absolute', zIndex: 2 },
  products: { position: 'absolute', zIndex: 1 },
  product: { left: 0, position: 'absolute', top: 0 },
  specifications: {
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 3,
  },
  specification: { position: 'absolute' },
  specificationValue: { left: 0, position: 'absolute' },
  bottomBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    zIndex: 3,
  },
});

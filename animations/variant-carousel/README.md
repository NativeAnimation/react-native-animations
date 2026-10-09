# Color Variant Carousel

A gesture-driven product carousel that synchronizes product imagery, copy, and a full-screen color field.

## How it works

1. One Reanimated shared value represents the carousel's continuous position.
2. Each product image and variant name derives its wrapped distance from that position, so the carousel loops without duplicating data.
3. Background and foreground colors interpolate between the current and incoming variants.
4. A horizontal pan updates progress directly on the UI thread and settles with an interruptible spring.
5. The imperative API uses the same spring path, allowing controls and autoplay to stay outside the component.

## Install

```bash
npx expo install react-native-gesture-handler react-native-reanimated react-native-worklets
```

Mount your app under `GestureHandlerRootView` as described by React Native Gesture Handler.

## Usage

```tsx
import { VariantCarousel } from './VariantCarousel';

const variants = [
  {
    name: 'Sand',
    image: require('./sand.png'),
    backgroundColor: '#C8B49B',
    brandColor: '#FFF5E8',
    textColor: '#201B17',
    secondaryColor: 'rgba(32,27,23,0.6)',
  },
  {
    name: 'Ocean',
    image: require('./ocean.png'),
    backgroundColor: '#365D73',
    brandColor: '#D7ECF5',
    textColor: '#FFFFFF',
    secondaryColor: 'rgba(255,255,255,0.6)',
  },
];

export function ProductScreen() {
  return <VariantCarousel variants={variants} />;
}
```

Customize the measured motion and content with knobs:

```tsx
<VariantCarousel
  actionLabel="Reserve"
  brandName="NORTH"
  onIndexChange={(index) => setSelectedVariant(index)}
  priceLabel="$189.00"
  productSizeRatio={1.15}
  springDamping={24}
  springStiffness={160}
  variants={variants}
/>
```

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `variants` | `VariantCarouselVariant[]` | Required | Two or more images, names, and color sets. |
| `brandName` | `string` | `"NOVA"` | Oversized brand wordmark. |
| `logoText` | `string` | `"n"` | Short circular logo mark. |
| `specifications` | `VariantCarouselSpecification[]` | Generic product facts | Up to three product facts. |
| `actionLabel` | `string` | `"Add to cart"` | Purchase action text. |
| `priceLabel` | `string` | `"$249.00"` | Formatted price text. |
| `nextAccessibilityLabel` | `string` | `"Next color"` | Screen-reader name for the next control. |
| `nextAccessibilityHint` | `string` | `"Shows the next color variant"` | Screen-reader hint for the next control. |
| `onIndexChange` | `(index: number) => void` | — | Runs after a transition settles. |
| `onGestureStart` | `() => void` | — | Runs when a drag begins. |
| `springDamping` | `number` | `20` | Transition spring damping. |
| `springStiffness` | `number` | `180` | Transition spring stiffness. |
| `springMass` | `number` | `1` | Transition spring mass. |
| `swipeDistanceThreshold` | `number` | `0.22` | Required drag distance as a width fraction. |
| `swipeVelocityThreshold` | `number` | `600` | Required horizontal fling velocity. |
| `productSizeRatio` | `number` | `1.25` | Product size as a width fraction. |
| `productHorizontalOffset` | `number` | `0.24` | Product left offset as a width fraction. |
| `productVerticalOffset` | `number` | `0.03` | Product top offset as a height fraction. |
| `purchaseBarColor` | `string` | `"rgba(0,0,0,0.22)"` | Purchase-bar background color. |
| `purchaseTextColor` | `string` | `"#FFFFFF"` | Purchase-bar text color. |
| `brandFontFamily` | `string` | System | Brand and logo font family. |
| `variantFontFamily` | `string` | System | Variant-name font family. |
| `bodyFontFamily` | `string` | System | Specification-label font family. |
| `emphasisFontFamily` | `string` | System | Values and purchase-label font family. |
| `style` | `StyleProp<ViewStyle>` | — | Outer container style. |
| `testID` | `string` | — | Outer container test identifier. |

The forwarded ref exposes `goTo(index)`, `next()`, and `prev()`.

## Compatibility

- Expo SDK 57, React Native 0.86, Reanimated 4.5, and Worklets 0.10.
- Web: verified.
- iOS and Android: bundles verified; physical devices not yet verified.
- Works in Expo Go because all native dependencies are included in the SDK 57 client.

## Accessibility

The next-variant touch target exposes a button role, label, and hint. Dragging is not the only way to advance. When reduced motion is enabled, spatial product and name movement is removed while the selected content and colors still update.

# Free React Native animations for Expo

Production-ready animation components for **React Native and Expo**, built with **Reanimated 4**, **Gesture Handler**
and **Skia**. Copy a folder into your project and own the code: no runtime dependency on this repo.

These are the free pieces of [Native Animation](https://nativeanimation.com), a catalog of premium React Native
animations: onboarding screens, carousels, paywalls, loaders, liquid glass tab bars and micro-interactions.

| Animation | Preview | What it is |
|---|---|---|
| [Shimmer Skeleton](animations/shimmer-skeleton) | [▶ Live preview](https://nativeanimation.com/animations/shimmer-skeleton) | A React Native **skeleton loader** with a synchronized diagonal shimmer for loading placeholders. |
| [Copy Confirm Button](animations/copy-confirm-button) | [▶ Live preview](https://nativeanimation.com/animations/copy-confirm-button) | An **animated button** that morphs a copy icon into a check with a success halo and a confirmation bubble. |
| [Color Variant Carousel](animations/variant-carousel) | [▶ Live preview](https://nativeanimation.com/animations/variant-carousel) | A gesture-driven **product carousel** whose background color follows the drag between variants. |

## Install

Each folder is self-contained. Two ways to add one:

```sh
# With the CLI (copies the source into src/components/<id>/)
npx nativeanimation add shimmer-skeleton

# Or by hand: copy animations/<id>/ into your project and install its dependencies
npx expo install react-native-reanimated expo-linear-gradient
```

Dependencies for each piece are listed in its `piece.json` and README.

## Compatibility

Tested with **Expo SDK 57**, React Native 0.86, Reanimated 4.5 and react-native-worklets 0.10. Every animation runs on
the UI thread from a single shared value, so gestures stay interruptible and there is no React state per frame.

## More animations

The full catalog lives at [nativeanimation.com/animations](https://nativeanimation.com/animations): OTP code input,
swipe card deck, wheel picker, liquid glass tab bar, countdown paywall, animated bar chart, 3D carousels and more.
One piece costs $9, or get [every current and future animation](https://nativeanimation.com/pricing) with a
one-time payment.

## License

Free to use in unlimited personal and commercial apps under the
[Native Animation License](https://nativeanimation.com/license). Please don't republish the source as a library,
template or UI kit.

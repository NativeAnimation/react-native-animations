# Base Plans Block

A plan-selection screen with configurable monthly and annual prices, plan content and icons, features, FAQ, selection callbacks, copy, loading, errors, insets, and theme.

## How it works

1. Composes segmented billing tabs, a savings badge, selectable plan cards, feature checks, FAQ disclosures, and one primary continue action.
2. Recommended cards use the theme primary border; selected cards also expose selected accessibility state. No nested buttons are placed inside pressable cards.
3. Prices are full billing-period amounts: `monthlyPrice` per month, `yearlyPrice` per year. The CTA price composes Base sliding digits and an explicit period suffix.
4. Sections reveal in 300 ms from 6 pt, with 30 ms staggering; all other movement belongs to the composed Base controls.
5. Continue calls `onSelectPlan(plan, period)`. The host handles checkout/navigation; this block never collects payment information or starts a transaction.

## Install

```bash
npx nativeanimation add base-plans-block
```

The CLI copies the exact family modules listed in `registryDependencies`, including their transitive dependencies. To copy by hand, copy those modules too and install their native packages with:

```bash
npx expo install react-native-gesture-handler react-native-reanimated react-native-worklets lucide-react-native react-native-svg
```

Mount `GestureHandlerRootView` at the app root. Load the Geist regular and medium fonts once, or supply your own font names through the theme. Free forever. MIT.

## Usage

```tsx
import { BasePlansBlock } from './base-plans-block';

<BasePlansBlock
  plans={plans}
  period={period}
  onPeriodChange={setPeriod}
  selectedPlan={selectedPlan}
  onSelectedPlanChange={setSelectedPlan}
  onSelectPlan={(plan, billingPeriod) => openCheckout(plan.id, billingPeriod)}
  insets={insets}
/>
```

Wrap your app in `BaseThemeProvider` from `base-theme` to choose light/dark and neutral, blue, green, or violet accents. A `theme` prop overrides the provider and is inherited by nested controls, sheets, and dialogs. Place the block inside a bounded container with `flex: 1`; screens scroll vertically when space is limited. Supply safe-area insets from the host.

Set `copy.savings` to match your prices, or to an empty string to hide the badge. `copy.continue` supports `{plan}`; `copy.priceAction` supports `{action}`, `{price}`, and `{period}`. Prices should be finite nonnegative numbers. Update a controlled selected ID when replacing the plan collection.

### Use with an agent

> Use Native Animation MCP to add base-plans-block with monthly and annual plans, a recommended tier, FAQ, and a callback to my checkout.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `copy` | `Partial<copy>` | `Northwind copy` | All headings, billing/price labels, savings badge, disclaimer, and templates. |
| `plans` | `BlockPlan[]` | `Personal / Team` | ID, name, description, monthly/yearly prices, features, optional recommended and icon. |
| `period / defaultPeriod` | `BillingPeriod` | `monthly` | Controlled or initial monthly/yearly period. |
| `onPeriodChange` | `(period: BillingPeriod) => void` | `—` | Reports billing changes. |
| `selectedPlan / defaultSelectedPlan` | `string` | `recommended or first initial plan` | Controlled or initial plan ID. Unknown IDs disable Continue. |
| `onSelectedPlanChange` | `(id: string) => void` | `—` | Card-selection callback, separate from submission. |
| `onSelectPlan` | `(plan: BlockPlan, period: BillingPeriod) => void` | `—` | Continue callback; no payment processing. |
| `faq` | `BaseAccordionItem[]` | `three questions` | Caller-owned FAQ titles/content; [] hides it. |
| `openFaq / onOpenFaqChange` | `string / (value: string) => void` | `uncontrolled` | Optional FAQ open state. |
| `currency / locale` | `string` | `USD / en-US` | Intl number-format settings. |
| `featureIcon` | `ReactNode` | `Check` | Caller-owned feature icon; null hides it. |
| `insets` | `{ top?: number; bottom?: number }` | `0 / 0` | Host safe-area insets; no internal SafeAreaView. |
| `theme` | `BaseTheme` | `nearest provider` | Full shared theme override inherited by every nested control. |
| `onBack / backLabel` | `() => void / string` | `— / Back` | Optional host back action and its accessible name. |
| `loading / error` | `boolean / string` | `false / —` | Host pending state and failure message. |
| `testID` | `string` | `piece ID` | Stable identifier on the screen primary action. |
| `style` | `StyleProp<ViewStyle>` | `flex: 1` | Container override. |

`copy` supports these keys: `title`, `heading`, `description`, `monthly`, `yearly`, `savings`, `recommended`, `selected`, `monthSuffix`, `yearSuffix`, `faq`, `continue`, `priceAction`, `disclaimer`, `loading`, `errorTitle`, `emptyTitle`, `emptyDescription`, `back`. Unspecified keys keep the generic English defaults. Icons and content remain caller-owned.

## Compatibility

Expo SDK 58 · React Native 0.88 · Reanimated 4.7 · react-native-worklets 0.13. Targets iOS, Android, and web, in Expo Go and development builds. Native bundle compilation does not replace device interaction testing. Part of **Native Animation Base**. Free forever. MIT. No router, network, or storage dependency.

### Go further

- [trial-timeline-paywall](https://nativeanimation.com/animations/trial-timeline-paywall) for a guided trial offer.
- [tier-pillars-paywall](https://nativeanimation.com/animations/tier-pillars-paywall) for a more expressive tier comparison.

## Accessibility

Plan cards announce the plan, price, billing period, and selected state. The primary action has one complete accessible price label; digit wheels stay decorative. FAQ triggers expose expanded state. Loading is announced as busy and empty/error states remain readable. Reduce Motion removes section displacement and applies composed-control changes without motion.

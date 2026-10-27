import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Check from 'lucide-react-native/icons/check';
import { BaseAccordion, type BaseAccordionItem } from '../base-accordion';
import { BaseAlert } from '../base-alert';
import { BaseBadge } from '../base-badge';
import { BaseButton } from '../base-button';
import {
  BaseCard,
  BaseCardContent,
  BaseCardDescription,
  BaseCardHeader,
  BaseCardTitle,
} from '../base-card';
import { BaseEmptyState } from '../base-empty-state';
import { BaseSkeletonText } from '../base-skeleton';
import { BaseSlidingNumber } from '../base-sliding-number';
import { BaseTabs } from '../base-tabs';
import { useBaseTheme } from '../base-theme';
import {
  BlockFrame,
  BlockSection,
  BlockText,
  type BlockProps,
} from './BlockLayout';

const defaultCopy = {
  title: 'Find your plan',
  heading: 'Room for your next big idea',
  description: 'Choose the Northwind workspace that grows with you.',
  monthly: 'Monthly',
  yearly: 'Annual',
  savings: 'Save 20% annually',
  recommended: 'Recommended',
  selected: 'Selected',
  monthSuffix: '/month',
  yearSuffix: '/year',
  faq: 'Good to know',
  continue: 'Continue with {plan}',
  priceAction: '{action} — {price}{period}',
  disclaimer: 'Pick the plan that fits your next chapter.',
  loading: 'Loading plans',
  errorTitle: 'Could not load plans',
  emptyTitle: 'Plans are on their way',
  emptyDescription: 'Check back soon for your workspace options.',
  back: 'Back',
};
export type BillingPeriod = 'monthly' | 'yearly';
export type BlockPlan = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  recommended?: boolean;
  icon?: React.ReactNode;
};
export type BasePlansBlockProps = BlockProps & {
  /** All screen labels and accessible names; action templates support placeholders. */
  copy?: Partial<typeof defaultCopy>;
  /** Plans and full billing-period prices. No payment integration is included. */
  plans?: BlockPlan[];
  /** Controlled billing period. */
  period?: BillingPeriod;
  /** Initial billing period. */
  defaultPeriod?: BillingPeriod;
  /** Reports billing period changes. */
  onPeriodChange?: (period: BillingPeriod) => void;
  /** Controlled selected plan ID. */
  selectedPlan?: string;
  /** Initial selected plan, otherwise the recommended/first plan. */
  defaultSelectedPlan?: string;
  /** Reports card selection without submitting. */
  onSelectedPlanChange?: (id: string) => void;
  /** Primary action with the selected plan and billing period. */
  onSelectPlan?: (plan: BlockPlan, period: BillingPeriod) => void;
  /** FAQ content. Empty arrays hide the FAQ. */
  faq?: BaseAccordionItem[];
  /** Controlled FAQ selection for hosts and presentations. */
  openFaq?: string;
  /** Reports FAQ changes. */
  onOpenFaqChange?: (value: string) => void;
  /** Currency formatting for prices, default USD/en-US. */
  currency?: string;
  /** Locale used to format prices. */
  locale?: string;
  /** Feature check slot; null removes the default icon. */
  featureIcon?: React.ReactNode;
};
const defaultPlans: BlockPlan[] = [
  {
    id: 'personal',
    name: 'Personal',
    description: 'A calm place for your own projects.',
    monthlyPrice: 10,
    yearlyPrice: 96,
    features: ['3 active projects', 'Unlimited notes', 'Community support'],
  },
  {
    id: 'team',
    name: 'Team',
    description: 'Everything your team needs to move forward.',
    monthlyPrice: 25,
    yearlyPrice: 240,
    features: [
      'Unlimited projects',
      'Shared workspaces',
      'Priority support',
      'Advanced insights',
    ],
    recommended: true,
  },
];
const defaultFaq: BaseAccordionItem[] = [
  {
    value: 'change',
    title: 'Can I change my plan later?',
    content:
      'Yes. Change plans from your account settings as your workspace grows.',
  },
  {
    value: 'annual',
    title: 'How does annual billing work?',
    content:
      'Annual prices cover a full year and are billed once per year. Monthly plans are billed once per month.',
  },
  {
    value: 'cancel',
    title: 'Can I cancel anytime?',
    content:
      'Manage your subscription from your account settings. Review your plan terms before continuing.',
  },
];

export function BasePlansBlock({
  copy,
  plans = defaultPlans,
  period: controlledPeriod,
  defaultPeriod = 'monthly',
  onPeriodChange,
  selectedPlan: controlledPlan,
  defaultSelectedPlan,
  onSelectedPlanChange,
  onSelectPlan,
  faq = defaultFaq,
  openFaq,
  onOpenFaqChange,
  currency = 'USD',
  locale = 'en-US',
  featureIcon,
  loading = false,
  error,
  ...props
}: BasePlansBlockProps) {
  const theme = useBaseTheme(props.theme);
  const t = { ...defaultCopy, ...copy };
  const [localPeriod, setLocalPeriod] = useState(defaultPeriod);
  const period = controlledPeriod ?? localPeriod;
  const [localPlan, setLocalPlan] = useState(
    defaultSelectedPlan ??
      plans.find((plan) => plan.recommended)?.id ??
      plans[0]?.id,
  );
  const selected = plans.find(
    (plan) => plan.id === (controlledPlan ?? localPlan),
  );
  const price = selected
    ? period === 'monthly'
      ? selected.monthlyPrice
      : selected.yearlyPrice
    : 0;
  const suffix = period === 'monthly' ? t.monthSuffix : t.yearSuffix;
  const format: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  };
  const formatter = new Intl.NumberFormat(locale, format);
  const action = t.continue.replace('{plan}', selected?.name ?? '');
  const selectPeriod = (next: string) => {
    if (loading || (next !== 'monthly' && next !== 'yearly')) return;
    if (controlledPeriod === undefined) setLocalPeriod(next);
    onPeriodChange?.(next);
  };
  return (
    <BlockFrame
      {...props}
      theme={theme}
      title={t.title}
      backLabel={props.backLabel ?? t.back}
    >
      <BlockSection>
        <BlockText medium style={{ fontSize: 24, lineHeight: 32 }}>
          {t.heading}
        </BlockText>
        <BlockText muted>{t.description}</BlockText>
      </BlockSection>
      {error ? (
        <BaseAlert
          variant="destructive"
          title={t.errorTitle}
          description={error}
        />
      ) : null}
      <BlockSection index={1}>
        <BaseTabs
          value={period}
          onValueChange={selectPeriod}
          tabs={[
            { value: 'monthly', label: t.monthly },
            { value: 'yearly', label: t.yearly },
          ]}
          testID="plans-period"
        />
        {t.savings ? (
          <BaseBadge variant="secondary">{t.savings}</BaseBadge>
        ) : null}
      </BlockSection>
      {loading ? (
        <View
          accessible
          accessibilityLabel={t.loading}
          accessibilityState={{ busy: true }}
          aria-busy={true}
          style={{ gap: theme.space[6] }}
        >
          <BaseSkeletonText lines={5} />
          <BaseSkeletonText lines={5} />
        </View>
      ) : plans.length ? (
        plans.map((plan, index) => (
          <BlockSection key={plan.id} index={index + 2}>
            <BaseCard
              onPress={() => {
                if (controlledPlan === undefined) setLocalPlan(plan.id);
                onSelectedPlanChange?.(plan.id);
              }}
              accessibilityLabel={`${plan.name}, ${formatter.format(period === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice)}${suffix}`}
              accessibilityState={{ selected: selected?.id === plan.id }}
              aria-selected={selected?.id === plan.id}
              testID={`plan-${plan.id}`}
              style={{
                borderColor:
                  plan.recommended || selected?.id === plan.id
                    ? theme.colors.primary
                    : theme.colors.border,
              }}
            >
              <BaseCardHeader>
                {plan.icon}
                <BaseCardTitle>{plan.name}</BaseCardTitle>
                <BaseCardDescription>{plan.description}</BaseCardDescription>
                {selected?.id === plan.id ? (
                  <BaseBadge variant="outline">{t.selected}</BaseBadge>
                ) : null}
                {plan.recommended ? (
                  <BaseBadge variant="secondary">{t.recommended}</BaseBadge>
                ) : null}
              </BaseCardHeader>
              <BaseCardContent style={{ gap: theme.space[3] }}>
                <BlockText medium style={{ fontSize: 24, lineHeight: 32 }}>
                  {formatter.format(
                    period === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice,
                  )}
                  {suffix}
                </BlockText>
                {plan.features.map((feature, featureIndex) => (
                  <View
                    key={`${featureIndex}-${feature}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: theme.space[2],
                    }}
                  >
                    <View
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                      style={{ paddingTop: 2 }}
                    >
                      {featureIcon === undefined ? (
                        <Check size={16} color={theme.colors.foreground} />
                      ) : (
                        featureIcon
                      )}
                    </View>
                    <BlockText style={{ flex: 1 }}>{feature}</BlockText>
                  </View>
                ))}
              </BaseCardContent>
            </BaseCard>
          </BlockSection>
        ))
      ) : (
        <BaseEmptyState title={t.emptyTitle} description={t.emptyDescription} />
      )}
      <BlockSection index={4}>
        <BaseButton
          fullWidth
          loading={loading}
          disabled={!selected || !!error}
          onPress={() => {
            if (selected) onSelectPlan?.(selected, period);
          }}
          testID={props.testID ?? 'base-plans-block'}
          style={{
            minHeight: 48,
            height: 'auto',
            paddingVertical: theme.space[3],
          }}
          accessibilityLabel={t.priceAction
            .replace('{action}', action)
            .replace('{price}', formatter.format(price))
            .replace('{period}', suffix)}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.space[2],
            }}
          >
            <Text
              style={{
                fontFamily: theme.fonts.medium,
                fontSize: 14,
                lineHeight: 20,
                color: theme.colors.primaryForeground,
              }}
            >
              {action}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BaseSlidingNumber
                value={price}
                locale={locale}
                format={format}
                fontSize={14}
                lineHeight={20}
                color={theme.colors.primaryForeground}
              />
              <Text
                style={{
                  fontFamily: theme.fonts.medium,
                  fontSize: 14,
                  lineHeight: 20,
                  color: theme.colors.primaryForeground,
                }}
              >
                {suffix}
              </Text>
            </View>
          </View>
        </BaseButton>
        <BlockText muted style={{ textAlign: 'center' }}>
          {t.disclaimer}
        </BlockText>
      </BlockSection>
      {faq.length ? (
        <BlockSection index={5} title={t.faq}>
          <BaseAccordion
            items={faq}
            value={openFaq}
            onValueChange={(value) =>
              onOpenFaqChange?.(
                typeof value === 'string' ? value : (value[0] ?? ''),
              )
            }
          />
        </BlockSection>
      ) : null}
    </BlockFrame>
  );
}
export default BasePlansBlock;

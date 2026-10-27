import {
  useBaseReducedMotion,
  timing,
  useBaseTheme,
  type BaseTheme,
} from '../base-theme';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { BaseAlert } from '../base-alert';
import { BaseButton } from '../base-button';
import { BaseProgress } from '../base-progress';
import { BaseRadioGroup, type BaseRadioOption } from '../base-radio-group';
import { BaseSkeletonText } from '../base-skeleton';
import { BaseSlider } from '../base-slider';
import { BaseSwitch } from '../base-switch';
import { BaseToggleGroup, type BaseToggleItem } from '../base-toggle-group';

import {
  BlockFrame,
  BlockSection,
  BlockText,
  type BlockProps,
} from './BlockLayout';

const defaultCopy = {
  title: 'Make Northwind yours',
  progress: 'Workspace setup',
  step: 'Step {current} of {total}',
  goalTitle: 'What brings you here?',
  goalDescription: 'Choose a starting point. You can change it later.',
  interestsTitle: 'Find your focus',
  interestsDescription: 'Pick the topics you want to see more of.',
  interestsLabel: 'Interests',
  preferencesTitle: 'Set your pace',
  preferencesDescription: 'Build a routine that fits your day.',
  minutes: 'Daily goal: {minutes} minutes',
  slider: 'Daily goal in minutes',
  notifications: 'Daily reminders',
  reminderDescription: 'A little encouragement at the right time.',
  back: 'Back',
  next: 'Next',
  finish: 'Get started',
  skip: 'Skip for now',
  errorTitle: 'Could not save your preferences',
};
export type OnboardingValues = {
  goal: string;
  interests: string[];
  minutes: number;
  reminders: boolean;
};
export type BaseOnboardingBlockProps = BlockProps & {
  /** Screen copy and accessible names. */
  copy?: Partial<typeof defaultCopy>;
  /** Goal options; values are caller-owned identifiers. */
  goals?: BaseRadioOption[];
  /** Multiple-selection interest chips, including optional icons. */
  interests?: BaseToggleItem[];
  /** Controlled answers. */
  values?: OnboardingValues;
  /** Initial answers, retained while navigating backward and forward. */
  defaultValues?: Partial<OnboardingValues>;
  /** Reports answer changes. */
  onValuesChange?: (values: OnboardingValues) => void;
  /** Controlled zero-based step. */
  step?: number;
  /** Initial step when uncontrolled. */
  defaultStep?: number;
  /** Reports step navigation. */
  onStepChange?: (step: number) => void;
  /** Completion callback with all answers. */
  onComplete?: (values: OnboardingValues) => void;
  /** Skip callback preserves current answers for the host. */
  onSkip?: (values: OnboardingValues) => void;
  /** Slider bounds. */
  minuteRange?: { min: number; max: number; step: number };
};
const defaultGoals: BaseRadioOption[] = [
  {
    value: 'organize',
    label: 'Get organized',
    description: 'Bring a little clarity to every day.',
  },
  {
    value: 'learn',
    label: 'Learn something new',
    description: 'Make space for your next idea.',
  },
  {
    value: 'team',
    label: 'Work better together',
    description: 'Keep everyone moving in the same direction.',
  },
];
const defaultInterests: BaseToggleItem[] = [
  { value: 'design', label: 'Design' },
  { value: 'technology', label: 'Technology' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'writing', label: 'Writing' },
  { value: 'business', label: 'Business' },
  { value: 'culture', label: 'Culture' },
];

/** Exit the old content before committing the new content and its entry pose. */
function StepPanel({
  step,
  theme,
  children,
}: {
  step: number;
  theme: BaseTheme;
  children: (shown: number) => React.ReactNode;
}) {
  const reduced = useBaseReducedMotion();
  const [shown, setShown] = useState(step);
  const generation = useRef(0);
  const direction = useRef(1);
  const previousShown = useRef(step);
  const opacity = useSharedValue(1);
  const offset = useSharedValue(0);
  const commit = useCallback((next: number, version: number) => {
    if (generation.current === version) setShown(next);
  }, []);
  useEffect(() => {
    const lifecycle = generation;
    const version = ++lifecycle.current;
    if (shown === step) {
      opacity.set(withTiming(1, timing(theme, 'panelIn', reduced)));
      offset.set(withTiming(0, timing(theme, 'panelIn', reduced)));
      return () => {
        lifecycle.current++;
        cancelAnimation(opacity);
        cancelAnimation(offset);
      };
    }
    direction.current = step > shown ? 1 : -1;
    if (reduced) {
      commit(step, version);
      return;
    }
    offset.set(withTiming(-24 * direction.current, timing(theme, 'panelOut')));
    opacity.set(
      withTiming(0, timing(theme, 'panelOut'), (finished) => {
        if (finished) scheduleOnRN(commit, step, version);
      }),
    );
    return () => {
      lifecycle.current++;
      cancelAnimation(opacity);
      cancelAnimation(offset);
    };
  }, [step, shown, theme, reduced, commit, offset, opacity]);
  useLayoutEffect(() => {
    if (previousShown.current === shown) return;
    previousShown.current = shown;
    opacity.set(reduced ? 1 : 0);
    offset.set(reduced ? 0 : 24 * direction.current);
  }, [shown, theme, reduced, opacity, offset]);
  const animated = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateX: reduced ? 0 : offset.get() }],
  }));
  return (
    <Animated.View
      pointerEvents={shown === step ? 'auto' : 'none'}
      style={animated}
    >
      {children(shown)}
    </Animated.View>
  );
}

export function BaseOnboardingBlock({
  copy,
  goals = defaultGoals,
  interests = defaultInterests,
  values: controlled,
  defaultValues,
  onValuesChange,
  step: controlledStep,
  defaultStep = 0,
  onStepChange,
  onComplete,
  onSkip,
  minuteRange = { min: 5, max: 60, step: 5 },
  loading = false,
  error,
  ...props
}: BaseOnboardingBlockProps) {
  const theme = useBaseTheme(props.theme);
  const t = { ...defaultCopy, ...copy };
  const [internal, setInternal] = useState<OnboardingValues>({
    goal: goals[0]?.value ?? '',
    interests: [],
    minutes: 15,
    reminders: true,
    ...defaultValues,
  });
  const values = controlled ?? internal;
  const [internalStep, setInternalStep] = useState(defaultStep);
  const step = Math.max(0, Math.min(2, controlledStep ?? internalStep));
  const update = (patch: Partial<OnboardingValues>) => {
    const next = { ...values, ...patch };
    if (controlled === undefined) setInternal(next);
    onValuesChange?.(next);
  };
  const navigate = (next: number) => {
    if (loading) return;
    if (controlledStep === undefined) setInternalStep(next);
    onStepChange?.(next);
  };
  return (
    <BlockFrame
      {...props}
      theme={theme}
      title={t.title}
      backLabel={props.backLabel ?? t.back}
    >
      <BlockSection>
        <BlockText muted medium>
          {t.step
            .replace('{current}', String(step + 1))
            .replace('{total}', '3')}
        </BlockText>
        <BaseProgress
          value={((step + 1) / 3) * 100}
          accessibilityLabel={t.progress}
        />
      </BlockSection>
      {error ? (
        <BaseAlert
          variant="destructive"
          title={t.errorTitle}
          description={error}
        />
      ) : null}
      <BlockSection index={1}>
        {loading ? (
          <View
            accessible
            accessibilityLabel={t.progress}
            accessibilityState={{ busy: true }}
            aria-busy={true}
          >
            <BaseSkeletonText lines={5} />
          </View>
        ) : (
          <StepPanel step={step} theme={theme}>
            {(shown) => (
              <View style={{ gap: theme.space[6] }}>
                <View style={{ gap: theme.space[2] }}>
                  <BlockText medium style={{ fontSize: 24, lineHeight: 32 }}>
                    {[t.goalTitle, t.interestsTitle, t.preferencesTitle][shown]}
                  </BlockText>
                  <BlockText muted>
                    {
                      [
                        t.goalDescription,
                        t.interestsDescription,
                        t.preferencesDescription,
                      ][shown]
                    }
                  </BlockText>
                </View>
                {shown === 0 ? (
                  <BaseRadioGroup
                    options={goals}
                    value={values.goal}
                    onValueChange={(goal) => update({ goal })}
                    testID="onboarding-goal"
                  />
                ) : shown === 1 ? (
                  <BaseToggleGroup
                    type="multiple"
                    variant="chip"
                    items={interests}
                    value={values.interests}
                    onValueChange={(next) => update({ interests: next })}
                    accessibilityLabel={t.interestsLabel}
                  />
                ) : (
                  <>
                    <BlockText medium>
                      {t.minutes.replace('{minutes}', String(values.minutes))}
                    </BlockText>
                    <BaseSlider
                      value={values.minutes}
                      {...minuteRange}
                      onValueChange={(minutes) => {
                        if (typeof minutes === 'number') update({ minutes });
                      }}
                      accessibilityLabel={t.slider}
                    />
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: theme.space[4],
                      }}
                    >
                      <View style={{ flex: 1, gap: theme.space[1] }}>
                        <BlockText medium>{t.notifications}</BlockText>
                        <BlockText muted>{t.reminderDescription}</BlockText>
                      </View>
                      <BaseSwitch
                        value={values.reminders}
                        onValueChange={(reminders) => update({ reminders })}
                        accessibilityLabel={t.notifications}
                      />
                    </View>
                  </>
                )}
              </View>
            )}
          </StepPanel>
        )}
      </BlockSection>
      <BlockSection index={2}>
        <BaseButton
          fullWidth
          loading={loading}
          disabled={step === 0 && !values.goal}
          testID={props.testID ?? 'base-onboarding-block'}
          onPress={() =>
            step === 2 ? onComplete?.(values) : navigate(step + 1)
          }
          style={{ minHeight: 48 }}
        >
          {step === 2 ? t.finish : t.next}
        </BaseButton>
        {step > 0 ? (
          <BaseButton
            fullWidth
            variant="outline"
            disabled={loading}
            onPress={() => navigate(step - 1)}
            style={{ minHeight: 48 }}
          >
            {t.back}
          </BaseButton>
        ) : null}
        <BaseButton
          fullWidth
          variant="ghost"
          disabled={loading}
          onPress={() => onSkip?.(values)}
          style={{ minHeight: 48 }}
        >
          {t.skip}
        </BaseButton>
      </BlockSection>
    </BlockFrame>
  );
}
export default BaseOnboardingBlock;

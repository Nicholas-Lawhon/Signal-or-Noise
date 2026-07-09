import type { Scenario } from './types';
import { validateScenarioOrThrow } from './validation';
import netflix from '../scenarios/active/scenario_netflix_2012_2017.json';
import apple from '../scenarios/active/scenario_apple_2007_2008.json';
import amazon from '../scenarios/active/scenario_amazon_1999_2001.json';
import microsoft from '../scenarios/active/scenario_microsoft_2014_2016.json';
import nvidia from '../scenarios/active/scenario_nvidia_2015_2017.json';
import visa from '../scenarios/active/scenario_visa_2011_2013.json';

/**
 * Explicit imports keep active scenarios bundle-friendly for the web app.
 * Do not use a dynamic filesystem reader here.
 * Samples are validated at module load so typed exports stay trustworthy.
 */
export const ACTIVE_SCENARIOS: Scenario[] = [
  netflix,
  apple,
  amazon,
  microsoft,
  nvidia,
  visa,
].map((raw) => validateScenarioOrThrow(raw));

export function getActiveScenarios(): Scenario[] {
  return ACTIVE_SCENARIOS;
}

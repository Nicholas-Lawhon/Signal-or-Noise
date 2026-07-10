import type { Scenario } from './types';
import { validateScenarioOrThrow } from './validation';
import adobe from '../scenarios/active/scenario_adobe_2019_2020.json';
import airbnb from '../scenarios/active/scenario_airbnb_2021_2022.json';
import alphabet from '../scenarios/active/scenario_alphabet_2022_2023.json';
import amd from '../scenarios/active/scenario_amd_2019_2020.json';
import applovin from '../scenarios/active/scenario_applovin_2022_2023.json';
import block from '../scenarios/active/scenario_block_2021_2022.json';
import boeing from '../scenarios/active/scenario_boeing_2019_2020.json';
import chipotle from '../scenarios/active/scenario_chipotle_2018_2019.json';
import cloudflare from '../scenarios/active/scenario_cloudflare_2020_2021.json';
import crowdstrike from '../scenarios/active/scenario_crowdstrike_2023_2024.json';
import datadog from '../scenarios/active/scenario_datadog_2021_2022.json';
import disney from '../scenarios/active/scenario_disney_2019_2020.json';
import docusign from '../scenarios/active/scenario_docusign_2020_2021.json';
import etsy from '../scenarios/active/scenario_etsy_2020_2021.json';
import fastly from '../scenarios/active/scenario_fastly_2020_2021.json';
import ford from '../scenarios/active/scenario_ford_2021_2022.json';
import intel from '../scenarios/active/scenario_intel_2021_2022.json';
import lemonade from '../scenarios/active/scenario_lemonade_2021_2022.json';
import lululemon from '../scenarios/active/scenario_lululemon_2019_2020.json';
import meta from '../scenarios/active/scenario_meta_2022_2023.json';
import mongodb from '../scenarios/active/scenario_mongodb_2020_2021.json';
import nike from '../scenarios/active/scenario_nike_2021_2022.json';
import okta from '../scenarios/active/scenario_okta_2021_2022.json';
import paypal from '../scenarios/active/scenario_paypal_2021_2022.json';
import peloton from '../scenarios/active/scenario_peloton_2020_2021.json';
import pinterest from '../scenarios/active/scenario_pinterest_2020_2021.json';
import roku from '../scenarios/active/scenario_roku_2020_2021.json';
import salesforce from '../scenarios/active/scenario_salesforce_2020_2021.json';
import seaLimited from '../scenarios/active/scenario_sea_limited_2021_2022.json';
import shopify from '../scenarios/active/scenario_shopify_2021_2022.json';
import snap from '../scenarios/active/scenario_snap_2020_2021.json';
import spotify from '../scenarios/active/scenario_spotify_2020_2021.json';
import starbucks from '../scenarios/active/scenario_starbucks_2020_2021.json';
import target from '../scenarios/active/scenario_target_2021_2022.json';
import tesla from '../scenarios/active/scenario_tesla_2020_2021.json';
import twilio from '../scenarios/active/scenario_twilio_2020_2021.json';
import uber from '../scenarios/active/scenario_uber_2022_2023.json';
import upstart from '../scenarios/active/scenario_upstart_2021_2022.json';
import walmart from '../scenarios/active/scenario_walmart_2022_2023.json';
import zoom from '../scenarios/active/scenario_zoom_2020_2021.json';

/** Explicit imports keep active scenarios bundle-friendly for the web app. */
export const ACTIVE_SCENARIOS: Scenario[] = [
  adobe, airbnb, alphabet, amd, applovin, block, boeing, chipotle, cloudflare,
  crowdstrike, datadog, disney, docusign, etsy, fastly, ford, intel, lemonade,
  lululemon, meta, mongodb, nike, okta, paypal, peloton, pinterest, roku,
  salesforce, seaLimited, shopify, snap, spotify, starbucks, target, tesla,
  twilio, uber, upstart, walmart, zoom,
].map((raw) => validateScenarioOrThrow(raw));

export function getActiveScenarios(): Scenario[] {
  return ACTIVE_SCENARIOS;
}

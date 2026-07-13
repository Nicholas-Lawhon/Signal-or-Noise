import { DatabaseDomainError } from './errors';
import { decimalToNumber as number } from './serviceUtils';
import type { TransactionClient } from './serviceUtils';

export type DraftScenarioSnapshot = {
  scenarioId: string;
  title: string;
  companyName: string;
  ticker: string;
  actualReturnPercent: number;
  decisionDateLabel: string;
  holdingPeriodLabel: string;
  companyDescription: string;
  macroContext: string;
  situation: string;
  longCase: string;
  shortCase: string;
  setupHints: string[];
  lookbackChart: Array<{ date: string; price: number }>;
};

export async function captureDraftSnapshot(client: TransactionClient, ids: string[]): Promise<DraftScenarioSnapshot[]> {
  const scenarios = await client.scenario.findMany({
    where: { id: { in: ids } },
    select: {
      id: true, title: true, companyName: true, ticker: true,
      actualReturnPercent: true, decisionDateLabel: true, holdingPeriodLabel: true,
      variants: { where: { difficulty: 'medium' }, select: { companyDescription: true, macroContext: true, situation: true, longCase: true, shortCase: true, setupHints: true } },
      marketPoints: { where: { phase: 'pre_decision' }, orderBy: { ordinal: 'asc' }, select: { pointDate: true, price: true } },
    },
  });
  const byId = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
  return ids.map((id) => {
    const scenario = byId.get(id);
    const variant = scenario?.variants[0];
    if (!scenario || !variant) throw new DatabaseDomainError('INVALID_STATE', 'Draft scenario content is missing');
    return {
      scenarioId: id,
      title: scenario.title,
      companyName: scenario.companyName,
      ticker: scenario.ticker,
      actualReturnPercent: number(scenario.actualReturnPercent),
      decisionDateLabel: scenario.decisionDateLabel,
      holdingPeriodLabel: scenario.holdingPeriodLabel,
      ...variant,
      lookbackChart: scenario.marketPoints.map((point) => ({ date: point.pointDate.toISOString().slice(0, 10), price: number(point.price) })),
    };
  });
}

export function parseDraftSnapshot(value: unknown, expected: number): DraftScenarioSnapshot[] {
  if (!Array.isArray(value) || value.length !== expected) {
    throw new DatabaseDomainError('INVALID_STATE', 'Draft scenario snapshot is invalid');
  }
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || typeof (entry as DraftScenarioSnapshot).scenarioId !== 'string'
      || typeof (entry as DraftScenarioSnapshot).actualReturnPercent !== 'number'
      || !Array.isArray((entry as DraftScenarioSnapshot).lookbackChart)) {
      throw new DatabaseDomainError('INVALID_STATE', 'Draft scenario snapshot is invalid');
    }
  }
  return value as DraftScenarioSnapshot[];
}

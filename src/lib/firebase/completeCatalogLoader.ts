import type { CloudTab } from './types';

export async function loadCompleteCatalogSeed(): Promise<CloudTab[]> {
  const mod = await import('./catalogSeedData.json');
  return mod.default as CloudTab[];
}

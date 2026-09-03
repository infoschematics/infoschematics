import type { RegionAppearanceConfig } from './appearance.ts'

export type ZoneConfig = {
  id: string;
  label: string;
  appearance?: RegionAppearanceConfig;
  x: number;
  width: number;
  fill: string;
};

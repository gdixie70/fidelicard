import brands from '../assets/brands.json';
import { normalizeBrandText } from './brandSearch';

const DEFAULT_COLOR = '#1E1E1E';

const colorByName: { [normalizedName: string]: string } = {};
for (const item of brands as { brand: string; color: string }[]) {
  colorByName[normalizeBrandText(item.brand)] = item.color;
}

export const getBrandColor = (name: string): string => {
  return colorByName[normalizeBrandText(name)] || DEFAULT_COLOR;
};

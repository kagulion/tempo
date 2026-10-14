import { CloudRain, Flame, Snowflake, type LucideIcon } from 'lucide-react';

import { createEmbers } from './renderers/embers';
import { createRain } from './renderers/rain';
import { createSnow } from './renderers/snow';
import type { EffectRenderer } from './renderers/types';

export type EffectId = 'embers' | 'rain' | 'snow';

export type Effect = {
	id: EffectId;
	label: string;
	icon: LucideIcon;
	create: () => EffectRenderer;
};

// Порядок здесь — порядок карточек в окне эффектов
export const effects: Effect[] = [
	{ id: 'embers', label: 'Огоньки', icon: Flame, create: createEmbers },
	{ id: 'rain', label: 'Дождь', icon: CloudRain, create: createRain },
	{ id: 'snow', label: 'Снег', icon: Snowflake, create: createSnow }
];

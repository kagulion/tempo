import {
	Cloud,
	CloudLightning,
	CloudRain,
	Flame,
	Flower2,
	Leaf,
	Snowflake,
	Sparkle,
	type LucideIcon
} from 'lucide-react';

import { createCloudShadows } from './renderers/cloudShadows';
import { createEmbers } from './renderers/embers';
import { createCherryBlossom, createLeaves } from './renderers/falling';
import { createFireflies } from './renderers/fireflies';
import { createHeavyRain, createRain } from './renderers/rain';
import { createSnow } from './renderers/snow';
import type { EffectRenderer } from './renderers/types';

export type EffectId =
	| 'embers'
	| 'rain'
	| 'heavy-rain'
	| 'snow'
	| 'leaves'
	| 'cherry-blossom'
	| 'fireflies'
	| 'cloud-shadows';

export type Effect = {
	id: EffectId;
	label: string;
	icon: LucideIcon;
	create: () => EffectRenderer;
	// front — поверх всего, включая окна; back — над обоями, но под окнами (тени не должны затемнять окна)
	layer: 'front' | 'back';
};

// Порядок здесь — порядок карточек в окне эффектов
export const effects: Effect[] = [
	{ id: 'embers', label: 'Огоньки', icon: Flame, create: createEmbers, layer: 'front' },
	{ id: 'rain', label: 'Дождь', icon: CloudRain, create: createRain, layer: 'front' },
	{
		id: 'heavy-rain',
		label: 'Ливень',
		icon: CloudLightning,
		create: createHeavyRain,
		layer: 'front'
	},
	{ id: 'snow', label: 'Снег', icon: Snowflake, create: createSnow, layer: 'front' },
	{ id: 'leaves', label: 'Листья', icon: Leaf, create: createLeaves, layer: 'front' },
	{
		id: 'cherry-blossom',
		label: 'Сакура',
		icon: Flower2,
		create: createCherryBlossom,
		layer: 'front'
	},
	{ id: 'fireflies', label: 'Светлячки', icon: Sparkle, create: createFireflies, layer: 'front' },
	{
		id: 'cloud-shadows',
		label: 'Тени облаков',
		icon: Cloud,
		create: createCloudShadows,
		layer: 'back'
	}
];

import type { EffectId } from '@/widgets/effects/effects';

// Готовая сцена для первого экрана: обои, фоновые звуки с громкостями и необязательный эффект
export type Scene = {
	id: string;
	title: string;
	description: string;
	// id из wallpapers.ts
	wallpaperId: string;
	// id из sounds.ts и громкость от 0 (исключая) до 1
	sounds: { id: string; volume: number }[];
	// id из effects.ts; пусто — все эффекты выключены
	effects: EffectId[];
};

// Эффекты сцены при её применении: с «уменьшить движение» сцена их не включает
export function sceneEffects(scene: Scene, reducedMotion: boolean): EffectId[] {
	return reducedMotion ? [] : scene.effects;
}

export const scenes: Scene[] = [
	{
		id: 'tavern',
		title: 'Таверна',
		description: 'Камин, гул голосов и тёплые огоньки',
		wallpaperId: 'horde/orcs-tavern',
		sounds: [
			{ id: 'fireplace', volume: 0.6 },
			{ id: 'tavern', volume: 0.45 }
		],
		effects: ['embers']
	},
	{
		id: 'rainy-evening',
		title: 'Дождливый вечер',
		description: 'Дождь за окном и тихий ветер',
		wallpaperId: 'japan/village',
		sounds: [
			{ id: 'rain', volume: 0.6 },
			{ id: 'wind', volume: 0.2 }
		],
		effects: ['rain']
	},
	{
		id: 'japanese-cafe',
		title: 'Японское кафе',
		description: 'Уютная кофейня и едва слышный дождь',
		wallpaperId: 'japan/cafe',
		sounds: [{ id: 'rain', volume: 0.25 }],
		effects: ['cherry-blossom']
	},
	{
		id: 'forest-trail',
		title: 'Лесная тропа',
		description: 'Шелест леса, птицы и светлячки',
		wallpaperId: 'warcraft/ashenvale',
		sounds: [
			{ id: 'forest', volume: 0.5 },
			{ id: 'birds', volume: 0.4 }
		],
		effects: ['fireflies']
	}
];

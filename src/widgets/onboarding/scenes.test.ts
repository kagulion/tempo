import { describe, expect, it } from 'vitest';

import { ambientSounds } from '@/widgets/ambience/sounds';
import { effects } from '@/widgets/effects/effects';
import { wallpapers } from '@/widgets/wallpaper/wallpapers';

import { sceneEffects, scenes } from './scenes';

describe('scenes', () => {
	it('сцен три или четыре, id не повторяются', () => {
		expect(scenes.length).toBeGreaterThanOrEqual(3);
		expect(scenes.length).toBeLessThanOrEqual(4);
		expect(new Set(scenes.map((scene) => scene.id)).size).toBe(scenes.length);
	});

	it.each(scenes)('сцена «$title» собрана из существующего', (scene) => {
		expect(wallpapers.some((item) => item.id === scene.wallpaperId)).toBe(true);
		expect(scene.sounds.length).toBeGreaterThanOrEqual(1);
		expect(scene.sounds.length).toBeLessThanOrEqual(3);
		for (const sound of scene.sounds) {
			const known = ambientSounds.find((item) => item.id === sound.id);
			// Звук без файла в сцене не заиграет
			expect(known?.source).toBeDefined();
			expect(sound.volume).toBeGreaterThan(0);
			expect(sound.volume).toBeLessThanOrEqual(1);
		}
		expect(new Set(scene.sounds.map((sound) => sound.id)).size).toBe(scene.sounds.length);
		for (const id of scene.effects) {
			expect(effects.some((item) => item.id === id)).toBe(true);
		}
	});
});

describe('sceneEffects', () => {
	it('с «уменьшить движение» эффекты сцены не включаются', () => {
		for (const scene of scenes) {
			expect(sceneEffects(scene, false)).toEqual(scene.effects);
			expect(sceneEffects(scene, true)).toEqual([]);
		}
	});
});

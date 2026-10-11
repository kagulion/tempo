import allianceTavern from '@/assets/wallpapers/alliance/alliance-tavern.jfif';
import dwarfsTavern from '@/assets/wallpapers/alliance/dwarfs-tavern.jfif';
import elfsTavern from '@/assets/wallpapers/alliance/elfs-tavern.jfif';
import bloodElfsTavern from '@/assets/wallpapers/horde/bloody-elfs-tavern.jfif';
import orcsTavern from '@/assets/wallpapers/horde/orcs-tavern.jfif';
import taurenTavern from '@/assets/wallpapers/horde/tauren-tavern.jfif';

export type Faction = 'alliance' | 'horde';

export type Wallpaper = {
	title: string;
	url: string;
};

export const factions: { value: Faction; label: string }[] = [
	{ value: 'alliance', label: 'Альянс' },
	{ value: 'horde', label: 'Орда' }
];

export const wallpapers: Record<Faction, Wallpaper[]> = {
	alliance: [
		{ title: 'Таверна Альянса', url: allianceTavern },
		{ title: 'Таверна у дворфов', url: dwarfsTavern },
		{ title: 'Таверна у эльфов', url: elfsTavern }
	],
	horde: [
		{ title: 'Таверна у орков', url: orcsTavern },
		{ title: 'Таверна у тауренов', url: taurenTavern },
		{ title: 'Таверна у эльфов крови', url: bloodElfsTavern }
	]
};

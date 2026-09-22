<script>
	import orcsTavern from '$lib/assets/wallpapers/orcs-tavern.png';
	import trollsTavern from '$lib/assets/wallpapers/trolls-tavern.png';

	import hearthsideLullaby from '$lib/assets/music/hearthside-lullaby.mp3';
	import tavernBeforeBattle from '$lib/assets/music/tavern-before-battle.mp3';
	import tavernTwilight from '$lib/assets/music/tavern-twilight.mp3';

	const backgrounds = [
		{
			title: 'Таверна у орков',
			url: orcsTavern
		},
		{
			title: 'Таверна у троллей',
			url: trollsTavern
		}
	];

	// Список треков для фона
	const playlist = [hearthsideLullaby, tavernBeforeBattle, tavernTwilight];
	let currentTrack = $state(0);
	/** @type {HTMLAudioElement | undefined} */
	let audioElement = $state();

	function nextTrack() {
		currentTrack = (currentTrack + 1) % playlist.length;
		queueMicrotask(() => {
			audioElement?.play().catch(() => {});
		});
	}

	$effect(() => {
		// Пробуем запустить воспроизведение сразу
		audioElement?.play().catch(() => {
			// Браузеры блокируют звук до первого клика — слушаем первое взаимодействие
			const startAudio = () => {
				audioElement?.play().catch(() => {});
				window.removeEventListener('click', startAudio);
				window.removeEventListener('keydown', startAudio);
			};

			window.addEventListener('click', startAudio);
			window.addEventListener('keydown', startAudio);
		});
	});

	let currentBg = $state(0);

	function nextBg() {
		currentBg = (currentBg + 1) % backgrounds.length;
	}

	function prevBg() {
		currentBg = (currentBg - 1 + backgrounds.length) % backgrounds.length;
	}
</script>

<!-- Фоновая музыка без элементов управления -->
<audio
	bind:this={audioElement}
	src={playlist[currentTrack]}
	onended={nextTrack}
></audio>

<main class="relative h-screen w-screen overflow-hidden bg-black text-white">
	<!-- Фоновое изображение -->
	<img
		src={backgrounds[currentBg].url}
		alt={backgrounds[currentBg].title}
		class="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out"
	/>
	<div class="absolute inset-0"></div>

	<!-- Панель управления -->
	<div
		class="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-white/10 bg-black/50 px-6 py-3 shadow-2xl backdrop-blur-md"
	>
		<button
			onclick={prevBg}
			class="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/20"
			>←</button
		>
		<button
			onclick={nextBg}
			class="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/20"
			>→</button
		>
	</div>
</main>

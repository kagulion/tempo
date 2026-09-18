<script>
	const backgrounds = [
		{
			title: 'Лесной туман',
			url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1920&q=80'
		},
		{
			title: 'Ночной Токио',
			url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1920&q=80'
		},
		{
			title: 'Уютная библиотека',
			url: 'https://images.unsplash.com/photo-1507842229452-7d84814d4580?auto=format&fit=crop&w=1920&q=80'
		}
	];

	let currentBg = $state(0);

	function nextBg() {
		currentBg = (currentBg + 1) % backgrounds.length;
	}

	function prevBg() {
		currentBg = (currentBg - 1 + backgrounds.length) % backgrounds.length;
	}
</script>

<main class="relative h-screen w-screen overflow-hidden bg-black text-white">
	<!-- Фоновое изображение -->
	<img
		src={backgrounds[currentBg].url}
		alt={backgrounds[currentBg].title}
		class="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out"
	/>
	<div class="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>

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

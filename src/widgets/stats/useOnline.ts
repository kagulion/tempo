import { useSyncExternalStore } from 'react';

import { afterFirstScreenMs, whenIdle } from '@/lib/idle';
import { createLiveStore } from '@/lib/liveStore';
import { storageKeys } from '@/lib/storage';

// Supabase Realtime Presence. Ключи задаются в .env (см. .env.example)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string | undefined;
const onlineEnabled = Boolean(supabaseUrl && supabaseKey);

const channelName = 'tempo:online';

// Один id на браузер: несколько вкладок одного человека считаются одним пользователем
function visitorId() {
	try {
		let id = localStorage.getItem(storageKeys.visitorId);
		if (!id) {
			id = crypto.randomUUID();
			localStorage.setItem(storageKeys.visitorId, id);
		}
		return id;
	} catch {
		return crypto.randomUUID();
	}
}

// Один канал на всю страницу: открывается при первом подписчике (окно статистики, хайлайты),
// закрывается, когда отписался последний. null — ещё подключаемся.
// Заглушка: пока Supabase не настроен, на сайте всегда 1 пользователь — сам посетитель
const onlineStore = createLiveStore<number | null>(
	() => (onlineEnabled ? null : 1),
	(set) => {
		if (!supabaseUrl || !supabaseKey) return () => {};
		let cancelled = false;
		let cleanup = () => {};

		// Клиент грузится отдельным чанком, только если сервис настроен, и не раньше простоя после загрузки страницы:
		// счётчик не нужен для первой отрисовки, а чанк и соединение отнимают у неё канал и процессор
		const cancelIdle = whenIdle(() => {
			import('@supabase/supabase-js').then(({ createClient }) => {
				if (cancelled) return;
				const supabase = createClient(supabaseUrl, supabaseKey);
				const channel = supabase.channel(channelName, {
					config: { presence: { key: visitorId() } }
				});

				channel
					.on('presence', { event: 'sync' }, () => {
						// Ключи состояния — id посетителей, вкладки одного браузера сгруппированы под одним ключом
						set(Object.keys(channel.presenceState()).length);
					})
					.subscribe((status) => {
						if (status === 'SUBSCRIBED') channel.track({ since: Date.now() });
					});

				cleanup = () => {
					supabase.removeChannel(channel);
				};
			});
		}, afterFirstScreenMs);

		return () => {
			cancelIdle();
			cancelled = true;
			cleanup();
		};
	}
);

// Сколько пользователей сейчас на сайте. null — ещё подключаемся
export function useOnline() {
	return useSyncExternalStore(onlineStore.subscribe, onlineStore.get);
}

// Держит присутствие на сайте включённым без React: посетитель виден другим, даже если счётчик нигде не показан.
// Вызывать один раз в App; возвращает отписку
export function keepOnlineRunning() {
	return onlineStore.subscribe(() => {});
}

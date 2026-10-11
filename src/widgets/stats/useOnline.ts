import { useEffect, useState } from 'react';

// Supabase Realtime Presence. Ключи задаются в .env (см. .env.example)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string | undefined;
const onlineEnabled = Boolean(supabaseUrl && supabaseKey);

const channelName = 'tempo:online';
const visitorKey = 'tempo:visitor-id';

// Один id на браузер: несколько вкладок одного человека считаются одним пользователем
function visitorId() {
	try {
		let id = localStorage.getItem(visitorKey);
		if (!id) {
			id = crypto.randomUUID();
			localStorage.setItem(visitorKey, id);
		}
		return id;
	} catch {
		return crypto.randomUUID();
	}
}

// Сколько пользователей сейчас на сайте. null — ещё подключаемся.
// Заглушка: пока Supabase не настроен, на сайте всегда 1 пользователь — сам посетитель
export function useOnline() {
	const [count, setCount] = useState<number | null>(onlineEnabled ? null : 1);

	useEffect(() => {
		if (!supabaseUrl || !supabaseKey) return;
		let cancelled = false;
		let cleanup = () => {};

		// Клиент грузится отдельным чанком, только если сервис настроен
		import('@supabase/supabase-js').then(({ createClient }) => {
			if (cancelled) return;
			const supabase = createClient(supabaseUrl, supabaseKey);
			const channel = supabase.channel(channelName, {
				config: { presence: { key: visitorId() } }
			});

			channel
				.on('presence', { event: 'sync' }, () => {
					// Ключи состояния — id посетителей, вкладки одного браузера сгруппированы под одним ключом
					setCount(Object.keys(channel.presenceState()).length);
				})
				.subscribe((status) => {
					if (status === 'SUBSCRIBED') channel.track({ since: Date.now() });
				});

			cleanup = () => {
				supabase.removeChannel(channel);
			};
		});

		return () => {
			cancelled = true;
			cleanup();
		};
	}, []);

	return count;
}

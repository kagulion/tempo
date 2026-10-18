// Edge Function (Deno): тонкий прокси к API «Радио Рекорд».
// У API нет заголовка Access-Control-Allow-Origin, поэтому из браузера его не вызвать.
// Проксируем ровно два пути, произвольные адреса не принимаем.

const upstream = 'https://www.radiorecord.ru';

// Путь запроса → путь апстрима и кэш ответа
const routes: Record<string, { path: string; cacheControl: string }> = {
	'/stations': { path: '/api/stations/', cacheControl: 'public, max-age=3600, s-maxage=86400' },
	'/now': { path: '/api/stations/now/', cacheControl: 'public, max-age=15' }
};

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info'
};

function json(body: unknown, status: number) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
	});
}

Deno.serve(async (req: Request) => {
	if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
	if (req.method !== 'GET') return json({ error: 'method not allowed' }, 405);

	// Функция живёт под /functions/v1/record, берём только хвост после её имени
	const { pathname } = new URL(req.url);
	const tail = pathname.replace(/^.*?\/record(?=\/|$)/, '').replace(/\/+$/, '') || '/';
	const route = routes[tail];
	if (!route) return json({ error: 'not found' }, 404);

	try {
		const res = await fetch(`${upstream}${route.path}`, {
			headers: { Accept: 'application/json' },
			signal: AbortSignal.timeout(5000)
		});
		if (!res.ok) return json({ error: `upstream HTTP ${res.status}` }, 502);

		return new Response(res.body, {
			status: 200,
			headers: {
				...corsHeaders,
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': route.cacheControl
			}
		});
	} catch {
		return json({ error: 'upstream unavailable' }, 502);
	}
});

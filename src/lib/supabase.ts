// Адрес проекта Supabase из VITE_SUPABASE_URL. В .env может лежать как полный URL,
// так и один ref проекта (gijbgtrqshfvfnulhldg), тогда адрес собираем сами
export function getSupabaseUrl(value: string | undefined): string | null {
	const raw = value?.trim();
	if (!raw) return null;
	if (/^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, '');
	return `https://${raw}.supabase.co`;
}

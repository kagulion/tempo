// id телеканалов и сообщения об ошибках. Чистый модуль без React: его легко тестировать

const wallpaperIdPattern = /^tv\/(.+)$/;

// id обоев в localStorage: tv/<id канала>
export function tvWallpaperId(channelId: string) {
	return `tv/${channelId}`;
}

// id канала из id обоев. Есть ли такой канал в списке, здесь не проверяется
export function parseTvWallpaperId(id: unknown): string | undefined {
	return typeof id === 'string' ? wallpaperIdPattern.exec(id)?.[1] : undefined;
}

// Канал, который не начал играть за это время, считаем недоступным
export const tvStartTimeoutMs = 15_000;

export const tvErrors = {
	unavailable: 'Канал недоступен',
	timeout: 'Канал не отвечает',
	unsupported: 'Браузер не умеет воспроизводить этот канал'
} as const;

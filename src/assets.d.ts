// Картинки, которых нет в vite/client. Сами файлы подключены через assetsInclude в vite.config.ts
declare module '*.jfif' {
	const src: string;
	export default src;
}

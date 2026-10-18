import { Play, Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
	CategoryButton,
	sectionTitleClass,
	tileActiveClass,
	tileClass,
	useSectionScroll
} from '@/widgets/gallery';
import { Widget, WidgetHeader } from '@/widgets/Widget';

import { channelsFor, topicsWithChannels } from './channels';
import { TwitchControls } from './TwitchControls';
import {
	type TwitchChannel,
	parseTwitchUrl,
	twitchErrors,
	twitchHints,
	twitchThumbUrl
} from './twitch';
import { setTwitchChannel, useTwitchChannel } from './useTwitch';
import { useTwitchPlayer } from './useTwitchPlayer';

type TwitchWidgetProps = {
	className?: string;
};

// Окно Twitch: видимый плеер 16:9 сверху, ниже поле для ссылки на канал, ряд тегов тем и каналы по темам.
// Это окно, а не фон: Twitch не играет, если плеер хоть чем-то перекрыт (см. docs/twitch.md).
// Клик по карточке переключает канал в плеере. Сразу при открытии окна эфир не запускается:
// сохранённый канал показывается превью с кнопкой ▶
export function TwitchWidget({ className }: TwitchWidgetProps) {
	const login = useTwitchChannel();
	// Сколько раз посетитель запускал эфир в этом сеансе; 0 — не запускал, плеера нет
	const [attempt, setAttempt] = useState(0);
	const { hostRef, areaRef, status, error, toggle } = useTwitchPlayer(login, attempt);
	const { scrollRef, sectionRef, scrollTo } = useSectionScroll();
	const [link, setLink] = useState('');
	const [linkError, setLinkError] = useState<string>();

	function start() {
		setAttempt((count) => count + 1);
	}

	// Тот же канал, пока эфир идёт или грузится, не перезапускаем
	function select(value: string) {
		const busy = status === 'loading' || status === 'playing' || status === 'paused';
		setTwitchChannel(value);
		if (value !== login || !busy) start();
	}

	function submit(event: FormEvent) {
		event.preventDefault();
		const parsed = parseTwitchUrl(link);
		if (!parsed) {
			setLinkError(twitchErrors.badLink);
			return;
		}
		select(parsed);
		setLink('');
		setLinkError(undefined);
	}

	const message = linkError ?? (status === 'error' ? error : undefined);
	const showPreview = status === 'idle' || status === 'error';

	return (
		// Без backdrop-blur: Twitch считает плеер неполностью видимым, если у его предка есть фильтр, и не запускает эфир.
		// Размытия нет, поэтому фон окна плотнее обычного
		<Widget
			aria-label="Twitch"
			className={cn('flex flex-col overflow-hidden bg-black/75 backdrop-blur-none', className)}
		>
			<div className="px-4 pt-4">
				<WidgetHeader title="Twitch">
					{login !== null && (
						<TwitchControls
							status={status}
							onTogglePause={status === 'idle' || status === 'error' ? start : toggle}
						/>
					)}
				</WidgetHeader>
			</div>

			{login !== null && (
				// Плеер ничем не перекрываем: поверх него только превью до запуска и при ошибке, пока iframe нет или он не нужен
				<div
					ref={areaRef}
					style={{ backgroundImage: `url(${twitchThumbUrl(login)})` }}
					className="relative mx-4 mt-3 aspect-video shrink-0 overflow-hidden rounded-xl bg-black bg-cover bg-center [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
				>
					<div ref={hostRef} className="absolute inset-0" />
					{showPreview && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/40">
							<Button
								type="button"
								variant="glass"
								size="icon-lg"
								onClick={start}
								hint={twitchHints.play}
								aria-label={twitchHints.play}
							>
								<Play />
							</Button>
						</div>
					)}
				</div>
			)}

			<form onSubmit={submit} className="flex flex-col gap-1.5 px-4 pt-3">
				<div className="flex gap-1.5">
					<Input
						variant="glass"
						type="text"
						inputMode="url"
						autoComplete="off"
						spellCheck={false}
						placeholder="Ссылка на канал Twitch"
						aria-label="Ссылка на канал Twitch"
						aria-invalid={message !== undefined}
						value={link}
						onChange={(event) => {
							setLink(event.target.value);
							setLinkError(undefined);
						}}
					/>
					<Button type="submit" variant="glass-solid" disabled={link.trim() === ''}>
						<Plus data-icon="inline-start" />
						Добавить
					</Button>
				</div>
				{message && (
					<p role="alert" className="text-xs text-red-300">
						{message}
					</p>
				)}
			</form>

			<div className="flex flex-wrap gap-1.5 px-4 pt-3">
				{topicsWithChannels.map((item) => (
					<CategoryButton key={item.id} onClick={() => scrollTo(item.id)}>
						{item.label}
					</CategoryButton>
				))}
			</div>

			<div
				ref={scrollRef}
				className="relative min-h-0 flex-1 scrollbar-glass overflow-y-auto px-4 pb-4"
			>
				{topicsWithChannels.map((item) => (
					<section key={item.id} ref={sectionRef(item.id)} aria-label={item.label}>
						<h3 className={sectionTitleClass}>{item.label}</h3>
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{channelsFor(item.id).map((channel) => (
								<ChannelCard
									key={channel.login}
									channel={channel}
									active={channel.login === login}
									onSelect={() => select(channel.login)}
								/>
							))}
						</div>
					</section>
				))}
			</div>
		</Widget>
	);
}

function ChannelCard({
	channel,
	active,
	onSelect
}: {
	channel: TwitchChannel;
	active: boolean;
	onSelect: () => void;
}) {
	// Превью не загрузилось — оставляем пустую плитку без значка сломанной картинки
	const [thumbFailed, setThumbFailed] = useState(false);

	return (
		<button
			type="button"
			onClick={onSelect}
			aria-pressed={active}
			title={`${channel.title} — ${channel.author}`}
			className="flex min-w-0 flex-col gap-1 text-left outline-none"
		>
			<span className={cn(tileClass, 'block w-full', active && tileActiveClass)}>
				{!thumbFailed && (
					<img
						src={twitchThumbUrl(channel.login)}
						alt=""
						loading="lazy"
						decoding="async"
						referrerPolicy="no-referrer"
						onError={() => setThumbFailed(true)}
						className="h-full w-full object-cover"
					/>
				)}
			</span>
			<span className="line-clamp-2 text-[0.7rem] leading-tight font-medium">{channel.title}</span>
			<span className="truncate text-[0.65rem] text-white/50">{channel.author}</span>
		</button>
	);
}

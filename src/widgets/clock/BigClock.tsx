import { Maximize2, Pause, PictureInPicture2, Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SoundBars } from '@/widgets/radio/SoundBars';
import {
	nowPlayingParts,
	toggleNowPlaying,
	useCanToggleNowPlaying,
	useNowPlaying
} from '@/widgets/radio/nowPlaying';

import { dateFormat, timeFormat } from './time';
import { useBigClock, useBigClockPosition } from './useBigClock';
import { useNow } from './useNow';

// Крупное время, включается кликом по часам на панели. Два варианта (где его ставит App):
// 'center' — посередине экрана, слой над обоями и задними эффектами, под окнами (z-10), клики не перехватывает;
// 'corner' — уменьшенное, первым элементом левого столбца окон (см. App.tsx), чтобы «Звуки» вставали ниже и сжимались.
// На телефоне позиция не действует: часы показываются только в фокусе и по центру.
// visibility задаёт режим фокуса: 'user' — по настройке, 'force' — показать всегда (и на телефоне), 'hide' — скрыть.
// Сохранённую настройку это не меняет. В 'force' часы стоят там, где их поставил пользователь
export type BigClockVariant = 'center' | 'corner';

type BigClockProps = {
	visibility: 'user' | 'force' | 'hide';
	variant: BigClockVariant;
	// Сколько места занимает угловой вариант в столбце: прижать к верху столбца, если сверху нет окон
	className?: string;
};

export function BigClock({ visibility, variant, className }: BigClockProps) {
	const { shown } = useBigClock();
	const { position } = useBigClockPosition();

	if (visibility === 'hide') return null;
	const forced = visibility === 'force';
	if (!forced && !shown) return null;
	// Угловой вариант — только если выбран угол. Центральный — если выбран центр, а при угле
	// остаётся лишь на телефоне в фокусе (на sm и выше его заменяет угловой)
	if (variant === 'corner' && position !== 'corner') return null;
	if (variant === 'center' && position === 'corner' && !forced) return null;
	return (
		<BigClockFace
			variant={variant}
			forced={forced}
			phoneOnly={variant === 'center' && position === 'corner'}
			className={className}
		/>
	);
}

type BigClockFaceProps = {
	variant: BigClockVariant;
	forced: boolean;
	// Центральный вариант, который виден только на телефоне
	phoneOnly: boolean;
	className?: string;
};

// Отдельный компонент, чтобы пока часы скрыты, таймер useNow не крутился
function BigClockFace({ variant, forced, phoneOnly, className }: BigClockFaceProps) {
	const now = useNow();
	const corner = variant === 'corner';

	const time = (
		<time
			dateTime={now.toISOString()}
			className={cn(
				'block font-light tracking-tight tabular-nums',
				corner ? 'text-6xl lg:text-7xl' : 'text-[min(15vw,10rem)]',
				// После размера шрифта: tailwind-merge иначе выкинул бы leading-none
				'leading-none'
			)}
		>
			{timeFormat.format(now)}
		</time>
	);
	const date = (
		<span className={cn('font-light text-white/80', corner ? 'text-sm' : 'text-lg lg:text-xl')}>
			{dateFormat.format(now)}
		</span>
	);

	if (corner) {
		return (
			<div
				className={cn(
					// Не сжимается: при нехватке высоты сжимаются окна под часами
					'group relative hidden shrink-0 text-white drop-shadow-[0_2px_24px_rgb(0_0_0/0.6)] select-none sm:flex sm:w-max sm:flex-col',
					// В фокусе клик по часам выходит из фокуса, поэтому ловят клики только кнопки
					forced ? 'pointer-events-none' : 'sm:pointer-events-auto',
					className
				)}
			>
				{/* День недели над цифрами, как и в центральном варианте */}
				<div className="mb-1">{date}</div>
				{/* Кнопка позиции в правом верхнем углу цифр, а не строки станции, которая шире */}
				<div className="relative w-max">
					{time}
					{!forced && <PositionButton />}
				</div>
				{/* Высота строки постоянная, чтобы окна ниже не прыгали. Ширина — как у окна «Звуки» под часами:
				    по ширине цифр от названия станции почти ничего не оставалось */}
				<div className="mt-1 flex h-8 w-[22rem] max-w-[calc(100vw-2rem)] items-center">
					<StationRow corner />
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				'pointer-events-none absolute inset-0 flex-col items-center justify-center text-white drop-shadow-[0_2px_24px_rgb(0_0_0/0.6)] select-none',
				// В фокусе слой над затемняющим слоем кликов (z-15), иначе кнопка станции не нажмётся
				forced ? 'z-[16] flex' : 'z-[5] hidden sm:flex',
				phoneOnly && 'sm:hidden'
			)}
		>
			{/* Центрируется только время: дата висит над ним, станция под ним, и они ничего не сдвигают */}
			<div className={cn('group relative', !forced && 'pointer-events-auto')}>
				<div className="pointer-events-none absolute bottom-full left-1/2 flex w-[min(80vw,28rem)] -translate-x-1/2 justify-center">
					{date}
				</div>
				{time}
				{!forced && <PositionButton />}
				<div className="pointer-events-none absolute top-full left-1/2 mt-3 flex h-8 w-[min(80vw,28rem)] -translate-x-1/2 items-center justify-center">
					<StationRow />
				</div>
			</div>
		</div>
	);
}

// Строка станции: полоски, название (с многоточием) и справа кнопка play/пауза.
// В углу шрифт всегда 14px (text-sm), в центре с lg крупнее
function StationRow({ corner = false }: { corner?: boolean }) {
	const playing = useNowPlaying();
	const canToggle = useCanToggleNowPlaying();

	if (!playing) return null;
	const { name } = nowPlayingParts(playing);
	const label = playing.playing ? 'Выключить радио' : 'Включить радио';

	return (
		<div
			className={cn(
				'flex max-w-full min-w-0 items-center gap-2 text-sm text-white/70',
				!corner && 'lg:text-base'
			)}
		>
			<SoundBars active={playing.audible} className="shrink-0" />
			<span className="min-w-0 truncate">{name}</span>
			{canToggle && (
				<Button
					variant="glass"
					size="icon-sm"
					className="pointer-events-auto shrink-0"
					onClick={(event) => {
						// В фокусе клик по экрану выходит из фокуса, по кнопке — не должен
						event.stopPropagation();
						toggleNowPlaying();
					}}
					title={label}
					aria-label={label}
				>
					{playing.playing ? <Pause /> : <Play />}
				</Button>
			)}
		</div>
	);
}

// Появляется при наведении на часы и при фокусе клавиатурой, а на сенсорных экранах видна всегда. Без translate: у Button при нажатии
// свой active:translate-y-px, он перебил бы сдвиг, и кнопка прыгала бы. Зазор слева — часть обёртки,
// чтобы наведение не терялось между цифрами и кнопкой
function PositionButton() {
	const { position, toggle } = useBigClockPosition();
	const label = position === 'center' ? 'Часы в угол' : 'Часы в центр';

	return (
		<div className="absolute top-0 left-full pl-2">
			<Button
				variant="glass"
				size="icon-sm"
				// На сенсорных экранах наведения нет (group-hover там не срабатывает) — кнопка видна всегда
				className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
				onClick={toggle}
				title={label}
				aria-label={label}
			>
				{position === 'center' ? <PictureInPicture2 /> : <Maximize2 />}
			</Button>
		</div>
	);
}

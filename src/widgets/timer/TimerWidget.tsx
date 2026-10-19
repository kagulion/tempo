import {
	Bell,
	BellOff,
	BrainCircuit,
	Coffee,
	Hourglass,
	Pause,
	Play,
	Repeat,
	RotateCcw,
	SkipForward,
	Sofa
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Widget, WidgetHeader } from '@/widgets/Widget';

import { SettingSlider } from './SettingSlider';
import { longBreakEvery, phaseText, pomodoroTotal, type TimerMode } from './phases';
import { useTimer } from './useTimer';

const modes: { value: TimerMode; label: string }[] = [
	{ value: 'pomodoro', label: 'Помидоро' },
	{ value: 'countdown', label: 'Отсчёт' },
	{ value: 'stopwatch', label: 'Секундомер' }
];

// 25 → «25 мин», 90 → «1 ч 30 мин»
function formatMinutes(minutes: number) {
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours === 0) return `${rest} мин`;
	return rest === 0 ? `${hours} ч` : `${hours} ч ${rest} мин`;
}

// Часы на циферблате: 05:00 или 1:05:00. Обратный отсчёт округляем вверх, чтобы 00:00 был концом
function formatClock(ms: number, roundUp: boolean) {
	const total = roundUp ? Math.ceil(ms / 1000) : Math.floor(ms / 1000);
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const seconds = total % 60;
	const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	return hours > 0 ? `${hours}:${mmss}` : mmss;
}

type TimerWidgetProps = {
	className?: string;
};

export function TimerWidget({ className }: TimerWidgetProps) {
	const timer = useTimer();
	const { settings, status, mode } = timer;
	const active = status !== 'idle';
	const pausedModes = new Set(timer.pausedModes);

	const clock =
		timer.remaining === null
			? formatClock(timer.elapsed, false)
			: formatClock(timer.remaining, true);

	const caption =
		mode === 'pomodoro'
			? timer.phase === 'work'
				? `${phaseText.work} · раунд ${timer.round} из ${settings.rounds}`
				: phaseText[timer.phase]
			: mode === 'countdown'
				? 'Обратный отсчёт'
				: 'Секундомер';

	// Идущий таймер: циферблат и управление. Одинаковый для всех режимов, кроме точек раундов
	const activeView = (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col items-center gap-1 pt-1">
				<span className="text-sm text-white/80">{caption}</span>
				<span
					role="timer"
					className={cn(
						'text-5xl font-semibold tracking-tight tabular-nums',
						status === 'paused' && 'animate-pulse text-white/80'
					)}
				>
					{clock}
				</span>
			</div>

			{mode === 'pomodoro' && (
				<div className="flex justify-center gap-1.5" aria-hidden>
					{Array.from({ length: settings.rounds }, (_, index) => {
						const round = index + 1;
						const done = round < timer.round || (round === timer.round && timer.phase !== 'work');
						const current = round === timer.round && timer.phase === 'work';
						return (
							<span
								key={round}
								className={cn(
									'size-1.5 rounded-full bg-white/20',
									done && 'bg-white/70',
									current && 'bg-white'
								)}
							/>
						);
					})}
				</div>
			)}

			{timer.remaining !== null && (
				<Progress value={timer.progress * 100} aria-label="Прогресс фазы" />
			)}

			<div className="flex items-center gap-2">
				<Button variant="glass" size="icon-lg" onClick={timer.reset} hint="Сбросить таймер">
					<RotateCcw />
				</Button>
				<Button
					variant="glass-solid"
					onClick={status === 'running' ? timer.pause : timer.resume}
					className="h-10 flex-1"
				>
					{status === 'running' ? (
						<Pause data-icon="inline-start" />
					) : (
						<Play data-icon="inline-start" />
					)}
					{status === 'running' ? 'Пауза' : 'Продолжить'}
				</Button>
				{mode === 'pomodoro' && (
					<Button variant="glass" size="icon-lg" onClick={timer.skip} hint="Пропустить фазу">
						<SkipForward />
					</Button>
				)}
			</div>
		</div>
	);

	const startButton = (
		<Button variant="glass-solid" onClick={timer.start} className="h-10 w-full">
			<Play data-icon="inline-start" />
			Старт
		</Button>
	);

	return (
		<Widget aria-label="Таймер" className={cn('flex flex-col gap-3 p-4', className)}>
			<WidgetHeader title="Таймер">
				<Button
					variant="glass"
					size="icon-sm"
					onClick={() => timer.changeSetting('sound', !settings.sound)}
					hint={settings.sound ? 'Выключить сигнал' : 'Включить сигнал'}
					aria-pressed={settings.sound}
				>
					{settings.sound ? <Bell /> : <BellOff />}
				</Button>
			</WidgetHeader>

			<Tabs value={mode} onValueChange={(value: TimerMode) => timer.changeSetting('mode', value)}>
				{/* Пока таймер идёт, другие режимы недоступны. На паузе можно уйти и вернуться к нему */}
				<TabsList>
					{modes.map((item) => (
						<TabsTrigger
							key={item.value}
							value={item.value}
							disabled={status === 'running' && item.value !== mode}
						>
							{item.label}
							{item.value !== mode && pausedModes.has(item.value) && (
								<span
									title="Таймер на паузе"
									aria-label="таймер на паузе"
									className="size-1.5 rounded-full bg-white/70"
								/>
							)}
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent value="pomodoro">
					{active ? (
						activeView
					) : (
						<div className="flex flex-col gap-2">
							<SettingSlider
								icon={BrainCircuit}
								label="Работа"
								value={settings.work}
								min={5}
								max={90}
								step={5}
								format={formatMinutes}
								onValueChange={(value) => timer.changeSetting('work', value)}
							/>
							<SettingSlider
								icon={Coffee}
								label="Короткий перерыв"
								value={settings.shortBreak}
								min={1}
								max={30}
								format={formatMinutes}
								onValueChange={(value) => timer.changeSetting('shortBreak', value)}
							/>
							<SettingSlider
								icon={Sofa}
								label="Длинный перерыв"
								value={settings.longBreak}
								min={5}
								max={60}
								step={5}
								format={formatMinutes}
								onValueChange={(value) => timer.changeSetting('longBreak', value)}
							/>
							<SettingSlider
								icon={Repeat}
								label="Раунды"
								value={settings.rounds}
								min={1}
								max={12}
								format={String}
								onValueChange={(value) => timer.changeSetting('rounds', value)}
							/>
							<p className="py-1 text-center text-xs text-white/80">
								Всего {formatMinutes(pomodoroTotal(settings) / 60_000)} · длинный перерыв раз в{' '}
								{longBreakEvery} раунда
							</p>
							{startButton}
						</div>
					)}
				</TabsContent>

				<TabsContent value="countdown">
					{active ? (
						activeView
					) : (
						<div className="flex flex-col gap-2">
							<SettingSlider
								icon={Hourglass}
								label="Длительность"
								value={settings.countdown}
								min={1}
								max={180}
								format={formatMinutes}
								onValueChange={(value) => timer.changeSetting('countdown', value)}
							/>
							{startButton}
						</div>
					)}
				</TabsContent>

				<TabsContent value="stopwatch">
					{active ? (
						activeView
					) : (
						<div className="flex flex-col gap-3">
							<span className="pt-1 text-center text-5xl font-semibold tracking-tight text-white/60 tabular-nums">
								00:00
							</span>
							{startButton}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</Widget>
	);
}

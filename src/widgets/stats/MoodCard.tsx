import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Hint } from '@/components/Hint';
import { cn } from '@/lib/utils';

import { maxNoteLength, monthAverage, monthGrid, moodLevels } from './mood';
import { StatCard, StatLabel, StatValue } from './StatCard';
import { useMood } from './useMood';

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const averageFormat = new Intl.NumberFormat('ru', { maximumFractionDigits: 1 });
const monthFormat = new Intl.DateTimeFormat('ru', { month: 'long', year: 'numeric' });
const dayFormat = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' });

function capitalize(text: string) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

// Ключ дня 2026-10-15 → дата по местному времени
function parseDay(day: string) {
	const [year, month, date] = day.split('-').map(Number);
	return new Date(year, month - 1, date);
}

// Трекер настроения: оценка дня смайликом, короткая заметка и календарь месяца
type MoodCardProps = {
	// Сегодняшний день в формате dayKey
	today: string;
};

export function MoodCard({ today: todayKey }: MoodCardProps) {
	const mood = useMood(todayKey);
	const { entries, today, day, view } = mood;

	const average = monthAverage(entries, view.year, view.month);
	const averageEmoji = average === null ? null : moodLevels[Math.round(average) - 1].emoji;
	const current = entries[day];

	return (
		<StatCard className="flex flex-col gap-3">
			<div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
				<div className="flex flex-col gap-0.5">
					<StatLabel>Настроение</StatLabel>
					<span className="text-xs text-white/80">
						{day === today ? 'Сегодня' : dayFormat.format(parseDay(day))}
					</span>
				</div>
				<div className="flex flex-col items-end gap-0.5">
					<StatLabel>За месяц</StatLabel>
					<StatValue>
						{average === null ? '—' : `${averageEmoji} ${averageFormat.format(average)}`}
					</StatValue>
				</div>
			</div>

			<div className="flex justify-between gap-1">
				{moodLevels.map(({ level, emoji, label }) => (
					<Hint key={level} label={label}>
						<button
							type="button"
							aria-label={label}
							aria-pressed={current?.level === level}
							onClick={() => mood.rate(level)}
							className={cn(
								'flex h-9 flex-1 items-center justify-center rounded-lg border border-transparent text-xl transition-colors outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-white/20',
								current?.level === level
									? 'border-white/30 bg-white/15'
									: 'opacity-70 hover:opacity-100'
							)}
						>
							{emoji}
						</button>
					</Hint>
				))}
			</div>

			{current && (
				// key: при смене дня или оценки поле читает заметку заново
				<Input
					key={`${day}-${current.level}`}
					variant="glass"
					placeholder="Заметка…"
					maxLength={maxNoteLength}
					defaultValue={current.note ?? ''}
					aria-label="Заметка о дне"
					onBlur={(event) => mood.saveNote(event.currentTarget.value)}
					onKeyDown={(event) => {
						if (event.key === 'Enter') event.currentTarget.blur();
					}}
				/>
			)}

			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<Button
						variant="glass"
						size="icon-sm"
						aria-label="Предыдущий месяц"
						onClick={() => mood.shiftMonth(-1)}
					>
						<ChevronLeft />
					</Button>
					<span className="text-sm font-medium">
						{capitalize(monthFormat.format(new Date(view.year, view.month, 1)))}
					</span>
					<Button
						variant="glass"
						size="icon-sm"
						aria-label="Следующий месяц"
						disabled={!mood.canGoForward}
						onClick={() => mood.shiftMonth(1)}
					>
						<ChevronRight />
					</Button>
				</div>

				<div className="grid grid-cols-7 gap-1 text-center">
					{weekdays.map((name) => (
						<StatLabel key={name} className="text-center">
							{name}
						</StatLabel>
					))}
					{monthGrid(view.year, view.month)
						.flat()
						.map((cell, index) => {
							if (!cell) return <span key={`empty-${index}`} />;

							const entry = entries[cell];
							const level = entry && moodLevels[entry.level - 1];
							const future = cell > today;
							const title = level
								? [level.label, entry.note].filter(Boolean).join(': ')
								: undefined;

							return (
								<button
									key={cell}
									type="button"
									title={title}
									disabled={future}
									aria-pressed={cell === day}
									onClick={() => mood.selectDay(cell)}
									className={cn(
										'flex aspect-square items-center justify-center rounded-md text-xs tabular-nums transition-colors outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:text-white/25',
										level && `${level.cell} text-black/80`,
										cell === today && 'ring-1 ring-white/70',
										cell === day && 'outline-2 outline-white'
									)}
								>
									{Number(cell.slice(8))}
								</button>
							);
						})}
				</div>
			</div>
		</StatCard>
	);
}

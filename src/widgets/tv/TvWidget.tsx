import { Tv } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import {
	CategoryButton,
	sectionTitleClass,
	tileActiveClass,
	tileCaptionClass,
	tileClass,
	useSectionScroll
} from '@/widgets/gallery';
import { useWallpaper } from '@/widgets/wallpaper/useWallpaper';
import { Widget, WidgetHeader } from '@/widgets/Widget';

import { type TvChannel, tvCategories, tvChannels } from './channels';
import { tvWallpaperId } from './tv';
import { TvControls } from './TvControls';

type TvWidgetProps = {
	className?: string;
};

// Окно ТВ: каналы по категориям. Клик по плитке сразу меняет фон, окно остаётся открытым.
// Если канал не открылся, фон остаётся прежним, а причина видна под заголовком
export function TvWidget({ className }: TvWidgetProps) {
	const wallpaper = useWallpaper();
	const { scrollRef, sectionRef, scrollTo } = useSectionScroll();

	return (
		<Widget aria-label="ТВ" className={cn('flex flex-col overflow-hidden', className)}>
			<div className="px-4 pt-4">
				<WidgetHeader title="ТВ">
					{/* Пауза и звук есть только у телеканала */}
					{wallpaper.current.kind === 'tv' && <TvControls />}
				</WidgetHeader>
			</div>

			{wallpaper.lastError && (
				<p role="alert" className="px-4 pt-3 text-xs text-red-300">
					{wallpaper.lastError}
				</p>
			)}

			<div className="flex flex-wrap gap-1.5 px-4 pt-3">
				{tvCategories.map((category) => (
					<CategoryButton key={category.value} onClick={() => scrollTo(category.value)}>
						{category.label}
					</CategoryButton>
				))}
			</div>

			<div
				ref={scrollRef}
				className="relative min-h-0 flex-1 scrollbar-glass overflow-y-auto px-4 pb-4"
			>
				{tvCategories.map((category) => (
					<section
						key={category.value}
						ref={sectionRef(category.value)}
						aria-label={category.label}
					>
						<h3 className={sectionTitleClass}>{category.label}</h3>
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{tvChannels
								.filter((channel) => channel.category === category.value)
								.map((channel) => {
									const id = tvWallpaperId(channel.id);
									const active = id === wallpaper.current.id;
									return (
										<button
											key={channel.id}
											type="button"
											onClick={() => wallpaper.select(id)}
											aria-pressed={active}
											title={channel.title}
											className={cn(tileClass, active && tileActiveClass)}
										>
											<Logo channel={channel} />
											<span className={tileCaptionClass}>{channel.title}</span>
										</button>
									);
								})}
						</div>
					</section>
				))}
			</div>
		</Widget>
	);
}

// Логотип канала по центру плитки. Нет логотипа или он не загрузился — значок телевизора
function Logo({ channel }: { channel: TvChannel }) {
	const [failed, setFailed] = useState(false);

	return (
		<span className="absolute inset-0 flex items-center justify-center p-3 pb-6">
			{channel.logo && !failed ? (
				<img
					src={channel.logo}
					alt=""
					loading="lazy"
					decoding="async"
					referrerPolicy="no-referrer"
					onError={() => setFailed(true)}
					className="max-h-full max-w-full object-contain"
				/>
			) : (
				<Tv className="size-6 text-white/40" aria-hidden />
			)}
		</span>
	);
}

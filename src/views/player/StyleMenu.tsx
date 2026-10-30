import { Disc3 } from 'lucide-react';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { discStyleLabels, discStyles, type DiscStyle } from './collection';

type StyleMenuProps = {
	value: DiscStyle;
	onChange: (style: DiscStyle) => void;
};

// Кнопка в углу, как «Горячие клавиши»: меню вида пластинок. Вид один на все пластинки, большую и в коллекции
export function StyleMenu({ value, onChange }: StyleMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				title="Вид пластинок"
				aria-label={`Вид пластинок: ${discStyleLabels[value]}`}
				className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/65 text-white/70 shadow-2xl backdrop-blur-md transition-colors outline-none hover:bg-white/15 hover:text-white focus-visible:ring-3 focus-visible:ring-white/20"
			>
				<Disc3 className="size-4" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" side="bottom">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Вид пластинок</DropdownMenuLabel>
					<DropdownMenuRadioGroup
						value={value}
						onValueChange={(next) => onChange(next as DiscStyle)}
					>
						{discStyles.map((style) => (
							<DropdownMenuRadioItem key={style} value={style}>
								{discStyleLabels[style]}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

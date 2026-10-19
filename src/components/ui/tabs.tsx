import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

import { cn } from '@/lib/utils';

// Вкладки base-nova на Base UI в стиле стеклянной панели (только горизонтальные)
function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
	return (
		<TabsPrimitive.Root
			data-slot="tabs"
			className={cn('flex flex-col gap-3', className)}
			{...props}
		/>
	);
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			className={cn(
				'flex h-9 w-full items-center rounded-lg border border-white/10 bg-white/5 p-[3px] text-white/60',
				className
			)}
			{...props}
		/>
	);
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
	return (
		<TabsPrimitive.Tab
			data-slot="tabs-trigger"
			className={cn(
				'inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-colors outline-none select-none hover:text-white focus-visible:ring-3 focus-visible:ring-white/60 disabled:pointer-events-none disabled:opacity-40 data-active:bg-white/15 data-active:text-white [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
				className
			)}
			{...props}
		/>
	);
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
	return (
		<TabsPrimitive.Panel
			data-slot="tabs-content"
			className={cn(
				'rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-white/60',
				className
			)}
			{...props}
		/>
	);
}

export { Tabs, TabsList, TabsTrigger, TabsContent };

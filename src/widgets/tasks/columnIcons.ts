import { Circle, CircleCheck, CircleDot, type LucideIcon } from 'lucide-react';

import type { ColumnId } from './board';

// Иконки секций: в заголовке секции и в пунктах меню «перенести в…»
export const columnIcons: Record<ColumnId, LucideIcon> = {
	todo: Circle,
	doing: CircleDot,
	done: CircleCheck
};

import { useEffect, useState } from 'react';

import { loadStored, saveStored, type Parse, type StorageKey } from '@/lib/storage';

// useState, который переживает перезагрузку: значение читается из localStorage и сохраняется туда при каждом изменении.
// Если то же состояние нужно нескольким компонентам, используй createPersistentStore из src/lib/storage.ts
export function usePersistentState<T>(key: StorageKey, fallback: T, parse: Parse<T>) {
	const [value, setValue] = useState(() => loadStored(key, fallback, parse));

	useEffect(() => saveStored(key, value), [key, value]);

	return [value, setValue] as const;
}

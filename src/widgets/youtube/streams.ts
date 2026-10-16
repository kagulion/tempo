export type StreamCollection = 'lofi' | 'fireplace' | 'rain' | 'nature' | 'cities' | 'space';

export type Stream = {
	videoId: string; // 11 символов
	title: string; // короткое русское название, до ~30 символов
	collection: StreamCollection;
};

export const streamCollections: { value: StreamCollection; label: string }[] = [
	{ value: 'lofi', label: 'Лоуфай' },
	{ value: 'fireplace', label: 'Камин' },
	{ value: 'rain', label: 'Дождь' },
	{ value: 'nature', label: 'Природа' },
	{ value: 'cities', label: 'Города' },
	{ value: 'space', label: 'Космос' }
];

// Круглосуточные трансляции. Проверено 16.10.2026: встраивание разрешено (oembed 200) и эфир идёт.
// Трансляции иногда перезапускают с новым id — тогда видео пропадёт, и его надо заменить.
// Без дат и сезонных тем в названии, без чёрного экрана
export const streams: Stream[] = [
	{ videoId: 'rFZHOHl-L8A', title: 'Lofi Girl', collection: 'lofi' },
	{ videoId: 'JD-kMIpDfnY', title: 'Lofi Girl: для сна', collection: 'lofi' },
	{ videoId: '4xDzrJKXOOY', title: 'Синтвейв-радио', collection: 'lofi' },
	{ videoId: 'F7eAMxl_OlY', title: 'Corgi Records', collection: 'lofi' },
	{ videoId: 'ta20G5ppoF4', title: 'Джаз-кафе', collection: 'lofi' },

	{ videoId: 'ZHTDr3LzS2A', title: 'Классический камин', collection: 'fireplace' },
	{ videoId: '-RbWy3E4cdE', title: 'Камин без музыки', collection: 'fireplace' },
	{ videoId: 'drvPk8eGke4', title: 'Уютный камин 4K', collection: 'fireplace' },
	{ videoId: 'WsE_jAnRx-w', title: 'Огонь 4K', collection: 'fireplace' },
	{ videoId: 'Yqu8yGD4N9k', title: 'Камин в хижине', collection: 'fireplace' },

	{ videoId: 'GOJxz_52W5w', title: 'Хижина в дождевом лесу', collection: 'rain' },
	{ videoId: 'i-5x8zaHulI', title: 'Дождь над Лас-Вегасом', collection: 'rain' },
	{ videoId: '2zW-DBUC8hw', title: 'Ночная гроза', collection: 'rain' },
	{ videoId: '4UkyiEm8Xzk', title: 'Метель за окном хижины', collection: 'rain' },

	{ videoId: 'OtNnW2hvaHA', title: 'Сафари в Масаи-Мара', collection: 'nature' },
	{ videoId: 'cnY-kGqUplI', title: 'Пруд при луне', collection: 'nature' },
	{ videoId: 'QaYGcw_2-cY', title: 'Сияние над Гренландией', collection: 'nature' },
	{ videoId: '_aISwVdb89M', title: 'Лес Борнео', collection: 'nature' },
	{ videoId: '5A7JI6saAp4', title: 'Озеро в Лапландии', collection: 'nature' },

	{ videoId: 'NzKkbwMHLK0', title: 'Нью-Йорк', collection: 'cities' },
	{ videoId: '6h4IGR61eUo', title: 'Йокогама', collection: 'cities' },
	{ videoId: 'tYgGEC-ESTw', title: 'Рейкьявик', collection: 'cities' },
	{ videoId: 'DMEHBuEixY0', title: 'Гонконг с пика Виктория', collection: 'cities' },
	{ videoId: 'wPCrbAjyl6U', title: 'Бостон', collection: 'cities' },
	{ videoId: 'vEdDmgAqAI0', title: 'Поезда в Синдзюку', collection: 'cities' },

	{ videoId: 'QrUisSNNwrA', title: 'Земля с МКС', collection: 'space' },
	{ videoId: 'I3sa2kiEpkA', title: 'Сияние с орбиты', collection: 'space' },
	{ videoId: '0Jiz0HZP2Dk', title: 'МКС в реальном времени', collection: 'space' },
	{ videoId: 'xG6xFnWxwVs', title: 'Луна', collection: 'space' },
	{ videoId: 'We7n039ol8o', title: 'Звёздное небо Хоккайдо', collection: 'space' }
];

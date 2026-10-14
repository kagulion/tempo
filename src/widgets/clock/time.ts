// Часы и минуты в формате системы: 19:11 или 07:11 PM
export const timeFormat = new Intl.DateTimeFormat(undefined, {
	hour: '2-digit',
	minute: '2-digit'
});

// День недели и дата под крупными часами: «вторник, 14 октября»
export const dateFormat = new Intl.DateTimeFormat(undefined, {
	weekday: 'long',
	day: 'numeric',
	month: 'long'
});

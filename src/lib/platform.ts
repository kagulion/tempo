// Определение платформы там, где у браузеров нет обходного пути через возможности

type NavigatorInfo = Pick<Navigator, 'userAgent' | 'maxTouchPoints'>;

// iPhone, iPad и iPod: всё, что работает на WebKit от Apple. Chrome, Firefox и Edge на iOS тоже WebKit,
// но у них те же ограничения звука, поэтому они тоже считаются. iPad в режиме «настольного сайта»
// называет себя Macintosh, его выдаёт только тач (у настоящего Mac maxTouchPoints равен 0)
export function isIosWebKit(info: NavigatorInfo) {
	if (/iPhone|iPad|iPod/.test(info.userAgent)) return true;
	return /Macintosh/.test(info.userAgent) && info.maxTouchPoints > 1;
}

// На iOS громкость <audio> только для чтения: ею управляют кнопки телефона.
// Web Audio при блокировке экрана тоже приостанавливается. Вне браузера (тесты) — false
export const iosWebKit = typeof navigator !== 'undefined' && isIosWebKit(navigator);

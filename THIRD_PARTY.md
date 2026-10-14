# Сторонние компоненты и материалы

Код этого проекта лицензирован по GPL-3.0-only. Это не меняет лицензии сторонних компонентов. Полный текст GPL находится в [LICENSE](LICENSE), публичная копия — в [public/legal/GPL-3.0.txt](public/legal/GPL-3.0.txt).

## Пакеты

Точный каталог версий и SPDX-обозначений из lock-файла: [lib/third-party.json](lib/third-party.json). Тексты лицензий установленных пакетов и встроенных в Next.js библиотек: [THIRD-PARTY-NOTICES.txt](public/legal/THIRD-PARTY-NOTICES.txt). Необязательные пакеты для других платформ перечислены в каталоге; при их установке сохраняйте поставляемые с ними лицензии.

Основные компоненты: Next.js, React, React DOM, Marked, Turndown, Turndown GFM и Zod — MIT; MapLibre GL JS — BSD-3-Clause; DOMPurify — Apache-2.0 OR MPL-2.0; Lucide — ISC с уведомлениями MIT для производных от Feather иконок. TypeScript — Apache-2.0; Prettier — MIT. Точные тексты и авторские уведомления имеют приоритет над кратким описанием.

Обновление каталога после изменения зависимостей:

```sh
npm ci
npm run licenses
```

Проверьте и закоммитьте `lib/third-party.json` и `public/legal/THIRD-PARTY-NOTICES.txt`. Генератор не скачивает лицензии и не заменяет юридическую проверку: он сохраняет сведения lock-файла и тексты из установленных пакетов. При добавлении внешнего ресурса обновите также страницу `app/licenses/page.tsx`.

## Карта и данные

- [OpenFreeMap](https://openfreemap.org/) — сервис тайлов и стиля Liberty. Атрибуция OpenFreeMap, OpenMapTiles и OpenStreetMap сохранена в карточке карты.
- [OpenMapTiles](https://openmaptiles.org/) — схема и картографическое оформление, BSD / CC BY; см. [лицензию проекта](https://github.com/openmaptiles/openmaptiles/blob/master/LICENSE.md).
- [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) — геоданные ODbL.
- [Open-Meteo](https://open-meteo.com/en/licence) — погодные данные CC BY 4.0. [Условия бесплатного API](https://open-meteo.com/en/terms) ограничивают его некоммерческим использованием; лицензия данных и условия сервиса — разные вещи.
- [GeoNames](https://www.geonames.org/) — географические данные CC BY 4.0, используемые геокодером Open-Meteo.

## Иконки, шрифт и содержание

- Выбранные SVG [Simple Icons](https://simpleicons.org/) — CC0 1.0, текст в [public/icons/LICENSE.txt](public/icons/LICENSE.txt). Лицензия не предоставляет права на товарные знаки.
- [Manrope](https://fonts.google.com/specimen/Manrope) — SIL OFL 1.1, текст и сведения об авторе в [public/legal/Manrope-OFL.txt](public/legal/Manrope-OFL.txt). Шрифт подключён через Google Fonts.
- Материалы в `public/media`, фотографии, логотипы, тексты и личные данные в начальном наполнении не лицензируются по GPL кода. Для своего портфолио используйте собственные материалы или получите разрешение правообладателей. Это ограничение относится к отдельному содержимому, а не к праву изменять и распространять программный код по GPL.

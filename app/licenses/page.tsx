import type { CSSProperties } from "react";
import { readState } from "../../lib/storage";
import { preferredTheme } from "../../lib/theme";
import dependencies from "../../lib/third-party.json";
import OpenSourceLinks from "../open-source-links";
export const dynamic = "force-dynamic";
export const metadata = { title: "Исходный код и лицензии" };
export default async function LicensesPage() {
  const doc = (await readState()).published;
  const theme = await preferredTheme(doc.theme);
  return (
    <div
      className={`site ${theme} legal-site`}
      style={{ "--accent": doc.accent } as CSSProperties}
    >
      <main className="legal-content">
        <a className="legal-back" href="/">
          ← На главную
        </a>
        <p className="legal-eyebrow">OPEN SOURCE / CREDITS</p>
        <h1>
          Код открыт.
          <br />
          Авторы указаны.
        </h1>
        <p className="legal-intro">
          Этот сайт — открытый проект. Вы можете изучать код, изменять его и
          создавать собственное портфолио на его основе.
        </p>
        <section>
          <h2>Код сайта · GNU GPL v3</h2>
          <p>
            Исходный код распространяется по GNU General Public License version
            3 (GPL-3.0-only). При распространении программы или её изменённой
            версии соблюдайте условия GPL v3, включая предоставление
            соответствующего исходного кода и сохранение уведомлений. Программа
            предоставляется без гарантий.
          </p>
          <div className="legal-actions">
            <a href="https://github.com/shalamovartem/artm-portfolio">
              Репозиторий на GitHub ↗
            </a>
            <a href="/legal/GPL-3.0.txt">Полный текст GPL v3</a>
          </div>
          <p>
            Лицензия кода не предоставляет права на личные фотографии, логотип,
            товарные знаки и авторское наполнение портфолио. Для своего сайта
            замените эти материалы собственными. Сторонние компоненты сохраняют
            свои лицензии.
          </p>
        </section>
        <section>
          <h2>Карта, погода и оформление</h2>
          <ul className="legal-credits">
            <li>
              <a href="https://openfreemap.org/">OpenFreeMap</a> — сервис карты;{" "}
              <a href="https://openmaptiles.org/">OpenMapTiles</a> — схема и
              оформление, BSD / CC BY;{" "}
              <a href="https://www.openstreetmap.org/copyright">
                © OpenStreetMap contributors
              </a>{" "}
              — геоданные ODbL. Атрибуция также доступна на самой карте.
            </li>
            <li>
              <a href="https://open-meteo.com/en/licence">Open-Meteo</a> —
              погодные данные, CC BY 4.0;{" "}
              <a href="https://www.geonames.org/">GeoNames</a> — поиск городов,
              CC BY 4.0.{" "}
              <a href="https://open-meteo.com/en/terms">
                Бесплатный API предназначен для некоммерческого использования
              </a>
              ; условия сервиса отличаются от лицензии данных.
            </li>
            <li>
              <a href="https://simpleicons.org/">Simple Icons</a> — иконки
              брендов, <a href="/icons/LICENSE.txt">CC0 1.0</a>. Права на
              товарные знаки остаются у их владельцев.
            </li>
            <li>
              <a href="https://lucide.dev/license">Lucide</a> — интерфейсные
              иконки, ISC; унаследованные иконки Feather — MIT. Уведомления
              включены в список ниже.
            </li>
            <li>
              <a href="https://fonts.google.com/specimen/Manrope">Manrope</a> —
              шрифт,{" "}
              <a href="/legal/Manrope-OFL.txt">SIL Open Font License 1.1</a>,
              загружается через Google Fonts.
            </li>
          </ul>
        </section>
        <section>
          <h2>Библиотеки и инструменты</h2>
          <p>
            Каталог сформирован из package-lock.json. В него включены прямые и
            транзитивные зависимости, инструменты разработки и необязательные
            пакеты для разных платформ. Дополнительные уведомления библиотек,
            встроенных в Next.js, находятся в полном тексте.
          </p>
          <a href="/legal/THIRD-PARTY-NOTICES.txt">
            Полные тексты лицензий и уведомления об авторах ↗
          </a>
          <div className="license-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Компонент</th>
                  <th>Версия</th>
                  <th>Лицензия</th>
                </tr>
              </thead>
              <tbody>
                {dependencies.map((d) => (
                  <tr key={`${d.name}@${d.version}`}>
                    <td>
                      <a href={`https://www.npmjs.com/package/${d.name}`}>
                        {d.name}
                      </a>
                      {d.development && <small>Разработка</small>}
                      {d.optional && <small>Необязательный</small>}
                    </td>
                    <td>{d.version}</td>
                    <td>{d.license}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <footer>
          <span>
            © {new Date().getFullYear()} {doc.copyrightText}
          </span>
          <OpenSourceLinks />
        </footer>
      </main>
    </div>
  );
}

import {
  ArrowUpRight,
  Send,
  Mail,
  Code2,
  MapPin,
  Globe,
  Camera,
  Music,
  Gamepad2,
  Cpu,
  Wrench,
  Heart,
} from "lucide-react";
import type { Card } from "../lib/document";
export const cardIcons: ReadonlyArray<readonly [Card["icon"], string]> = [
  ["none", "Без иконки"],
  ["send", "Telegram"],
  ["vk", "ВКонтакте"],
  ["steam", "Steam"],
  ["github", "GitHub"],
  ["youtube", "YouTube"],
  ["discord", "Discord"],
  ["twitch", "Twitch"],
  ["mail", "Почта"],
  ["globe", "Сайт"],
  ["camera", "Фотография"],
  ["music", "Музыка"],
  ["gamepad", "Игры"],
  ["cpu", "Электроника"],
  ["wrench", "Инструменты"],
  ["heart", "Сердце"],
  ["code", "Код"],
  ["arrow", "Стрелка"],
  ["diamond", "Ромб / CAD"],
  ["pin", "Метка"],
];
const brands = new Set([
  "vk",
  "steam",
  "github",
  "youtube",
  "discord",
  "twitch",
]);
const symbols = {
  send: Send,
  mail: Mail,
  code: Code2,
  arrow: ArrowUpRight,
  pin: MapPin,
  globe: Globe,
  camera: Camera,
  music: Music,
  gamepad: Gamepad2,
  cpu: Cpu,
  wrench: Wrench,
  heart: Heart,
};
export default function CardIcon({ name }: { name: Card["icon"] }) {
  if (name === "none") return null;
  if (brands.has(name))
    return (
      <span
        className="brand-icon"
        aria-hidden="true"
        style={{
          maskImage: `url(/icons/${name}.svg)`,
          WebkitMaskImage: `url(/icons/${name}.svg)`,
        }}
      />
    );
  if (name === "diamond") return <span aria-hidden="true">◇</span>;
  const Icon = symbols[name as keyof typeof symbols] || ArrowUpRight;
  return <Icon aria-hidden="true" />;
}

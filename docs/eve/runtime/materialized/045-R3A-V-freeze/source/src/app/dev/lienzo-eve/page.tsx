import { Manrope, Outfit } from "next/font/google";
import { EveCanvasPrototype } from "@/components/eve-canvas/EveCanvasPrototype";

const eveDisplay = Outfit({
  subsets: ["latin"],
  variable: "--font-eve-display",
  display: "swap",
});

const eveBody = Manrope({
  subsets: ["latin"],
  variable: "--font-eve-body",
  display: "swap",
});

export default function LienzoEveDevPage() {
  return (
    <div className={`${eveDisplay.variable} ${eveBody.variable}`}>
      <EveCanvasPrototype />
    </div>
  );
}

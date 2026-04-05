import { useMemo, useState } from "react";
import Header from "./components/layout/Header";
import FooterCTA from "./components/layout/FooterCTA";
import HeroSection from "./components/sections/HeroSection";
import ProductSection from "./components/sections/ProductSection";
import HowItWorksSection from "./components/sections/HowItWorksSection";
import DidacticLogSection from "./components/sections/DidacticLogSection";
import MvpSection from "./components/sections/MvpSection";
import VisionSection from "./components/sections/VisionSection";
import RoadmapSection from "./components/sections/RoadmapSection";
import { useSiteContent } from "./hooks/useSiteContent";
import { getTheme } from "./theme/getTheme";

export default function App() {
  const [lang, setLang] = useState("en");
  const [isDark, setIsDark] = useState(true);
  const t = useSiteContent(lang);
  const theme = useMemo(() => getTheme(isDark), [isDark]);

  return (
    <div className={`min-h-screen ${theme.shell}`}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className={`absolute inset-0 ${theme.bgGlow}`} />
        <div className={`absolute left-1/2 top-[-12rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full blur-3xl ${theme.cyanBlur}`} />
        <div className={`absolute bottom-[-8rem] right-[-6rem] h-[24rem] w-[24rem] rounded-full blur-3xl ${theme.violetBlur}`} />
      </div>
      <Header t={t} theme={theme} lang={lang} setLang={setLang} isDark={isDark} setIsDark={setIsDark} />
      <main className="relative z-10">
        <HeroSection t={t} theme={theme} />
        <ProductSection t={t} theme={theme} />
        <HowItWorksSection t={t} theme={theme} />
        <DidacticLogSection t={t} theme={theme} isDark={isDark} />
        <MvpSection t={t} theme={theme} />
        <VisionSection t={t} theme={theme} />
        <RoadmapSection t={t} theme={theme} />
        <FooterCTA t={t} theme={theme} />
      </main>
    </div>
  );
}

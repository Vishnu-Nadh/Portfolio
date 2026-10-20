import { portfolio as data } from "@/data/portfolio";
import { Cursor } from "@/components/overlays/Cursor";
import { Toast } from "@/components/overlays/Toast";
import { PageTransition } from "@/components/overlays/PageTransition";
import { Intro } from "@/components/overlays/Intro";
import { GlitchOverlay } from "@/components/overlays/GlitchOverlay";
import { SoundToggle } from "@/components/overlays/SoundToggle";
import { Scene3D } from "@/components/overlays/Scene3D";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Skills } from "@/components/sections/Skills";
import { ExperienceSection } from "@/components/sections/experience/ExperienceSection";
import { CloseUp } from "@/components/sections/CloseUp";
import { Hello } from "@/components/sections/Hello";
import { MotionEngine } from "@/components/motion/MotionEngine";

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {/* fixed layers */}
      <Cursor />
      <Toast />
      <PageTransition />
      <Intro brand={data.brand} role={data.role} place={data.place} />

      <Header brand={data.brand} place={data.place} nav={data.nav} />

      <main id="main" tabIndex={-1}>
        <Hero heroLines={data.heroLines} hero={data.hero} />
        <Skills skills={data.skills} />
        <ExperienceSection experience={data.experience} />
        <CloseUp closeUps={data.closeUps} closeSection={data.closeSection} toasts={data.toasts} artLabel={data.artLabel} />
        <Hello hello={data.hello} />
        <Footer footer={data.footer} place={data.place} toasts={data.toasts} />
      </main>

      {/* outside <main>: main is transformed during transitions and sits above the 3D stage */}
      <GlitchOverlay />
      <SoundToggle sound={data.sound} />
      <Scene3D />

      <MotionEngine data={data} />
    </>
  );
}

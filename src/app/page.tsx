import { portfolio as data } from "@/data/portfolio";
import { Cursor } from "@/components/overlays/Cursor";
import { Toast } from "@/components/overlays/Toast";
import { PageTransition } from "@/components/overlays/PageTransition";
import { Intro } from "@/components/overlays/Intro";
import { Scene3D } from "@/components/overlays/Scene3D";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { OrbitSkills } from "@/components/sections/OrbitSkills";
import { Trajectory } from "@/components/sections/Trajectory";
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
        <OrbitSkills skills={data.skills} />
        <Trajectory experience={data.experience} />
        <Hello hello={data.hello} />
        <Footer footer={data.footer} place={data.place} toasts={data.toasts} />
      </main>

      {/* the 3D stage sits under <main> (z-index 0 vs 1) */}
      <Scene3D />

      <MotionEngine data={data} />
    </>
  );
}

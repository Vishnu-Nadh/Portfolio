import type { PortfolioData } from "@/types/portfolio";

/** Floating pill with the sound on/off button; state and aria are managed by the sound module. */
export function SoundToggle({ sound }: Pick<PortfolioData, "sound">) {
  return (
    <div className="glx-sw">
      <button type="button" className="glx-snd" title={sound.label} aria-pressed="true" aria-label={sound.on}>
        <span className="glx-eq" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        {sound.label}
      </button>
    </div>
  );
}

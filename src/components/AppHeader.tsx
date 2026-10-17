import { Aperture, Check, ShieldCheck } from 'lucide-react';
const steps = ['Kamera', 'Edit foto', 'Watermark', 'Simpan'];
export function AppHeader({ step }: { step: 0 | 1 | 2 | 3 }) {
  return (
    <>
      <header className="brand-header">
        <div className="flex items-center gap-3">
          <span className="brand-mark">
            <Aperture size={24} strokeWidth={1.6} aria-hidden="true" />
          </span>
          <div translate="no">
            <p className="text-lg leading-tight font-semibold tracking-[-.6px]">
              GeoStamp<span className="text-primary">.</span>
            </p>
            <p className="mt-1 text-[9px] font-medium tracking-[.28em] text-muted-foreground">
              CAMERA
            </p>
          </div>
        </div>
        <span className="privacy-badge">
          <ShieldCheck size={13} aria-hidden="true" />
          Privasi utama
        </span>
      </header>
      <nav aria-label="Tahapan foto" className="workflow-nav">
        <ol className="grid grid-cols-4">
          {steps.map((label, index) => (
            <li
              key={label}
              aria-current={index === step ? 'step' : undefined}
              className={`workflow-step ${index === step ? 'is-current' : ''} ${index < step ? 'is-complete' : ''}`}
            >
              <span className="workflow-dot">
                {index < step ? (
                  <Check size={12} aria-hidden="true" />
                ) : (
                  `0${index + 1}`
                )}
              </span>
              <span className="relative z-1 text-[10px] font-medium">
                {label}
              </span>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

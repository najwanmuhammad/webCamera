import { usePhotoStore } from '@/features/editor/store/photo-store';
import { Button } from '@/components/ui/button';
import { defaultWatermark } from '../types';
import type { WatermarkSettings } from '../types';
export function WatermarkControls({
  settings,
}: {
  settings: WatermarkSettings;
}) {
  const update = usePhotoStore((state) => state.updateWatermark);
  return (
    <section aria-labelledby="watermark-controls" className="mt-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="watermark-controls" className="text-base font-medium">
          Tampilan watermark
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => update(defaultWatermark())}
        >
          Atur ulang
        </Button>
      </div>
      <label className="editor-label">
        Jenis huruf
        <select
          className="editor-field mt-2"
          value={settings.font}
          onChange={(event) =>
            update({ font: event.target.value as WatermarkSettings['font'] })
          }
        >
          <option value="sans">Sans serif</option>
          <option value="serif">Serif</option>
          <option value="mono">Monospace</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          className="size-4 accent-primary"
          type="checkbox"
          checked={settings.bold}
          onChange={(event) => update({ bold: event.target.checked })}
        />
        Huruf tebal
      </label>
      <label className="editor-label">
        Ukuran huruf · {Math.round(settings.fontSize * 1000)}
        <input
          className="mt-3 block w-full accent-primary"
          type="range"
          min={0.018}
          max={0.05}
          step={0.001}
          value={settings.fontSize}
          onChange={(event) => update({ fontSize: Number(event.target.value) })}
        />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="editor-label">
          Warna teks
          <input
            className="mt-2 block h-11 w-full rounded border border-border bg-secondary"
            type="color"
            value={settings.color}
            onChange={(event) => update({ color: event.target.value })}
          />
        </label>
        <label className="editor-label">
          Warna latar
          <input
            className="mt-2 block h-11 w-full rounded border border-border bg-secondary"
            type="color"
            value={settings.backgroundColor}
            onChange={(event) =>
              update({ backgroundColor: event.target.value })
            }
          />
        </label>
      </div>
      <label className="editor-label">
        Opasitas latar · {Math.round(settings.backgroundOpacity * 100)}%
        <input
          className="mt-3 block w-full accent-primary"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.backgroundOpacity}
          onChange={(event) =>
            update({ backgroundOpacity: Number(event.target.value) })
          }
        />
      </label>
      <fieldset>
        <legend className="editor-label">Perataan teks</legend>
        <div className="flex gap-2">
          {(['left', 'center', 'right'] as const).map((align, index) => (
            <Button
              key={align}
              variant={settings.align === align ? 'default' : 'outline'}
              className="flex-1"
              size="sm"
              aria-pressed={settings.align === align}
              onClick={() => update({ align })}
            >
              {['Kiri', 'Tengah', 'Kanan'][index]}
            </Button>
          ))}
        </div>
      </fieldset>
      <label className="editor-label">
        Posisi horizontal
        <input
          className="mt-3 block w-full accent-primary"
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={settings.x}
          onChange={(event) => update({ x: Number(event.target.value) })}
        />
      </label>
      <label className="editor-label">
        Posisi vertikal
        <input
          className="mt-3 block w-full accent-primary"
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={settings.y}
          onChange={(event) => update({ y: Number(event.target.value) })}
        />
      </label>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Geser watermark langsung pada foto. Teks panjang dibungkus dan
        diperkecil bila perlu agar seluruh watermark tetap di dalam foto.
      </p>
      <p className="rounded-xl border border-border bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground">
        Pratinjau menggunakan renderer Canvas yang sama dengan jalur ekspor.
        Lanjutkan ke simpan untuk memilih kualitas dan mengunduh JPG.
      </p>
    </section>
  );
}

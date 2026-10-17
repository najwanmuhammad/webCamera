import { Button } from '@/components/ui/button';
import type { AspectRatio } from '@/features/images/types';
const ratios: AspectRatio[] = ['3:4', '9:16'];
export function RatioSelector({
  value,
  onChange,
  disabled = false,
}: {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <p className="text-xs font-medium text-muted-foreground">Bingkai foto</p>
      <div role="group" aria-label="Rasio foto" className="ratio-control">
        {ratios.map((ratio) => (
          <Button
            key={ratio}
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-pressed={value === ratio}
            onClick={() => onChange(ratio)}
            className={`ratio-option ${value === ratio ? 'is-selected' : ''}`}
          >
            <span
              aria-hidden="true"
              className={`inline-block rounded-[2px] border ${ratio === '3:4' ? 'h-3.5 w-2.5' : 'h-4 w-2'}`}
            />
            {ratio}
          </Button>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useMode } from './ModeProvider';

export function CampsEmpty({ text }: { text: string }) {
  const { mode } = useMode();
  const isParents = mode === 'parents';
  return (
    <div
      className={
        'rounded-2xl p-8 text-center ' +
        (isParents
          ? 'border border-dashed border-cream-border bg-white/60'
          : 'border border-dashed border-white/20 bg-white/5 backdrop-blur')
      }
    >
      <p className={'text-sm ' + (isParents ? 'text-muted' : 'text-white/70')}>
        {text}
      </p>
    </div>
  );
}

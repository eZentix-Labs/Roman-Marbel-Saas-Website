import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Product } from '@/types';
import { imageUrl } from '@/lib/texture';
import { Icon } from '@/components/ui';
import { useI18n } from '@/i18n';

/**
 * PRD F-4.5 — full-screen pinch-zoom viewer.
 *
 * Implemented on raw pointer events rather than a gesture library: the whole
 * interaction is two pointers and a transform, and N-1.2 gives the initial
 * bundle a 150 KB budget that a gesture dependency would eat into for no gain.
 * Double-tap toggles 1x/2.5x for anyone who cannot pinch one-handed.
 */
export function PhotoViewer({
  product, startIndex, onClose,
}: {
  product: Product; startIndex: number; onClose: () => void;
}) {
  const { pick } = useI18n();
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const lastTap = useRef(0);

  const reset = useCallback(() => { setScale(1); setTx(0); setTy(0); }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') { setIndex((i) => Math.min(i + 1, product.images.length - 1)); reset(); }
      if (e.key === 'ArrowLeft') { setIndex((i) => Math.max(i - 1, 0)); reset(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, product.images.length, reset]);

  const dist = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      pinchStart.current = { dist: dist(), scale };
      panStart.current = null;
    } else if (pointers.current.size === 1) {
      panStart.current = { x: e.clientX, y: e.clientY, tx, ty };

      const now = Date.now();
      if (now - lastTap.current < 280) {
        if (scale > 1) reset(); else setScale(2.5);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const next = (dist() / pinchStart.current.dist) * pinchStart.current.scale;
      setScale(Math.min(5, Math.max(1, next)));
    } else if (pointers.current.size === 1 && panStart.current && scale > 1) {
      // Pan only while zoomed in; at 1x a drag should not move the image.
      const limit = 180 * (scale - 1);
      setTx(Math.max(-limit, Math.min(limit, panStart.current.tx + e.clientX - panStart.current.x)));
      setTy(Math.max(-limit, Math.min(limit, panStart.current.ty + e.clientY - panStart.current.y)));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) {
      panStart.current = null;
      if (scale <= 1.02) reset();
    }
  };

  const image = product.images[index];
  const SHOT_LABEL: Record<string, string> = {
    flat: 'Close-up', context: 'Laid as a floor', scale: 'Edge & thickness',
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-deep" role="dialog" aria-modal="true">
      <div className="flex shrink-0 items-center justify-between px-3 py-3 text-hi">
        <div className="min-w-0">
          <p className="truncate text-small font-medium">{pick(product.nameEn, product.nameBn)}</p>
          <p className="text-micro text-hi/60">{SHOT_LABEL[image.type]}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close viewer"
          className="grid h-11 w-11 place-items-center rounded-pill text-hi active:bg-surface/10"
        >
          <Icon name="close" />
        </button>
      </div>

      <div
        className="relative min-h-0 flex-1 touch-none overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          src={imageUrl({
            seed: image.cdnPublicId, material: product.material,
            hex: product.colourHexPrimary, type: image.type, sizeMm: product.sizeMm,
          }, 'zoom')}
          alt={pick(image.altEn, image.altBn)}
          className="absolute inset-0 h-full w-full select-none object-contain"
          style={{
            transform: 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')',
            transition: pointers.current.size ? 'none' : 'transform .18s ease-out',
          }}
          draggable={false}
        />
        {scale === 1 && (
          <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-micro text-hi/50">
            Pinch or double-tap to zoom
          </p>
        )}
      </div>

      <div className="flex shrink-0 justify-center gap-2 px-4 py-4" style={{ paddingBottom: 'calc(16px + var(--sab))' }}>
        {product.images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => { setIndex(i); reset(); }}
            aria-label={SHOT_LABEL[img.type]}
            aria-current={i === index}
            className={
              'h-14 w-14 overflow-hidden rounded-sm border-2 transition-colors ' +
              (i === index ? 'border-hi' : 'border-transparent opacity-60')
            }
            style={{ minHeight: 56, minWidth: 56 }}
          >
            <img
              src={imageUrl({
                seed: img.cdnPublicId, material: product.material,
                hex: product.colourHexPrimary, type: img.type, sizeMm: product.sizeMm,
              }, 'thumb')}
              alt="" width={56} height={56} className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}

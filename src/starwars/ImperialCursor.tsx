import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function ImperialCursor({ disabled }: { disabled: boolean }) {
  const cursor = useRef<HTMLDivElement>(null);
  const state = useRef({ disabled, hide: () => {} });
  state.current.disabled = disabled;
  useEffect(() => { if (disabled) state.current.hide(); }, [disabled]);
  useEffect(() => {
    const element = cursor.current;
    if (!element) return;
    const finePointer = matchMedia('(any-hover: hover) and (any-pointer: fine)');
    let position = { x: 0, y: 0 };
    const hide = () => {
      element.dataset.visible = 'false'; element.dataset.pressed = 'false'; element.dataset.interactive = 'false';
      document.documentElement.classList.remove('imperial-cursor-active');
    };
    state.current.hide = hide;
    const update = (target: Element | null) => {
      if (state.current.disabled || !finePointer.matches || !target || target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), iframe')) { hide(); return; }
      const action = target.closest('a[href], button, summary, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [data-cursor="action"]');
      // The center dot stays at the exact click point as the target locks around it.
      element.style.transform = `translate3d(${position.x - 18}px, ${position.y - 18}px, 0)`;
      element.dataset.visible = 'true';
      element.dataset.interactive = String(!!action && !action.matches(':disabled') && !action.closest('[aria-disabled="true"], [inert]'));
      document.documentElement.classList.add('imperial-cursor-active');
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') { hide(); return; }
      position = { x: event.clientX, y: event.clientY };
      update(event.target instanceof Element ? event.target : null);
    };
    const refresh = () => {
      if (element.dataset.visible === 'true') update(document.elementFromPoint(position.x, position.y));
    };
    const down = (event: PointerEvent) => { if (event.pointerType === 'mouse' && event.button === 0 && element.dataset.visible === 'true') element.dataset.pressed = 'true'; else if (event.pointerType !== 'mouse') hide(); };
    const up = () => { element.dataset.pressed = 'false'; };
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) hide(); };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', move, { passive: true });
    window.addEventListener('scroll', refresh, { passive: true, capture: true });
    window.addEventListener('pointerdown', down, { passive: true }); window.addEventListener('pointerup', up, { passive: true });
    window.addEventListener('pointerout', leave); window.addEventListener('pointercancel', hide);
    window.addEventListener('blur', hide); window.addEventListener('keydown', hide);
    document.addEventListener('visibilitychange', hide); finePointer.addEventListener('change', hide);
    return () => {
      hide(); state.current.hide = () => {};
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up);
      window.removeEventListener('pointerover', move); window.removeEventListener('scroll', refresh, true);
      window.removeEventListener('pointerout', leave); window.removeEventListener('pointercancel', hide);
      window.removeEventListener('blur', hide); window.removeEventListener('keydown', hide);
      document.removeEventListener('visibilitychange', hide); finePointer.removeEventListener('change', hide);
    };
  }, []);
  return createPortal(<div ref={cursor} className="imperial-cursor" data-visible="false" aria-hidden="true">
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none" focusable="false">
      <g className="imperial-cursor__station" stroke="currentColor" strokeWidth="1.1">
        <circle cx="18" cy="18" r="8.5" fill="#0a0a0a" fillOpacity=".7" />
        <circle cx="20.5" cy="14.1" r="2.5" />
        <path d="M20 12.3l1.8 1.8-1.8 1.8M9.7 18h5.8m5 0h5.8M10.1 20h15.8M13.2 22.5h4m1.5 2h3.2M14 12.4h2.5" opacity=".75" />
      </g>
      <g className="imperial-cursor__lock" stroke="currentColor" strokeWidth="1.2">
        <circle cx="18" cy="18" r="9" />
        <path d="M18 5v7m0 12v7M5 18h7m12 0h7" />
      </g>
      <path className="imperial-cursor__brackets" d="M7 12V7h5m12 0h5v5m0 12v5h-5m-12 0H7v-5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="square" />
      <circle className="imperial-cursor__point" cx="18" cy="18" r="1.35" fill="#ff6176" />
    </svg>
  </div>, document.body);
}

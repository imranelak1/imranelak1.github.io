import { useEffect, useRef, useState } from 'react';
import { Heart, X } from 'lucide-react';
import './secret-message.css';

export type SecretMode = 'closed' | 'code' | 'message';

export default function SecretMessage({ mode, onChange, disabled }: {
  mode: SecretMode;
  onChange: (mode: SecretMode) => void;
  disabled: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const [code, setCode] = useState('');
  const [incorrect, setIncorrect] = useState(false);

  useEffect(() => {
    if (disabled || mode !== 'closed') return;
    let firstDigitAt: number | null = null;
    const reset = () => { firstDigitAt = null; };
    const key = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], dialog, [role="dialog"]')) { reset(); return; }
      if (event.key === '8' && firstDigitAt !== null && performance.now() - firstDigitAt < 2500) {
        reset(); onChange('message');
      } else firstDigitAt = event.key === '1' ? performance.now() : null;
    };
    window.addEventListener('keydown', key);
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', reset);
    };
  }, [mode, disabled, onChange]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (mode === 'closed') {
      element.close(); setCode(''); setIncorrect(false); return;
    }
    if (!element.open) element.showModal();
    if (mode === 'code') input.current?.focus();
    else close.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [mode]);

  return <dialog ref={dialog} className="secret-dialog" aria-labelledby="secret-title" onClose={() => onChange('closed')} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onChange('closed');
  }}>
    <button ref={close} className="secret-close" type="button" aria-label="Close secret" onClick={() => onChange('closed')}><X aria-hidden="true" /></button>
    {mode === 'message' ? <div className="secret-reveal">
      <Heart className="secret-heart" aria-hidden="true" />
      <h2 id="secret-title">ily noha</h2>
    </div> : <form onSubmit={event => { event.preventDefault(); if (code === '18') onChange('message'); else { setIncorrect(true); input.current?.select(); } }}>
      <h2 id="secret-title">Secret code</h2>
      <label className="secret-code-label" htmlFor="secret-code">Enter the code</label>
      <input ref={input} id="secret-code" type="text" inputMode="numeric" pattern="[0-9]{2}" maxLength={2} autoComplete="off" enterKeyHint="go" value={code} aria-invalid={incorrect} aria-describedby={incorrect ? 'secret-error' : undefined} onChange={event => {
        const next = event.target.value.replace(/\D/g, '').slice(0, 2);
        setCode(next); setIncorrect(false);
        if (next === '18') onChange('message');
      }} />
      <p id="secret-error" className="secret-error" role="status">{incorrect ? 'Try again.' : ''}</p>
      <button className="secret-submit" type="submit">Open</button>
    </form>}
  </dialog>;
}

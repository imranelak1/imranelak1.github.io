import { useCallback, useEffect, useRef, useState } from 'react';
import { Heart, X } from 'lucide-react';
import { openSecret } from './secret-message';
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
  const request = useRef(0);
  const inFlight = useRef(false);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const attempt = useCallback(async (candidate: string, feedback: boolean) => {
    if (disabled || inFlight.current) return;
    const id = ++request.current;
    inFlight.current = true;
    setBusy(true); setError('');
    try {
      const revealed = await openSecret(candidate);
      if (id !== request.current) return;
      if (revealed !== null) {
        setMessage(revealed); setCode(''); onChange('message');
      } else if (feedback) {
        setError('Try again.'); input.current?.select();
      }
    } catch {
      if (id === request.current && feedback) setError('Could not load the message. Try again.');
    } finally {
      if (id === request.current) { inFlight.current = false; setBusy(false); }
    }
  }, [disabled, onChange]);

  useEffect(() => {
    setBusy(false);
    return () => { request.current++; inFlight.current = false; };
  }, [mode, disabled]);

  useEffect(() => {
    if (disabled || mode !== 'closed') return;
    let digits = '';
    let lastDigitAt = 0;
    const reset = () => { digits = ''; lastDigitAt = 0; };
    const key = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], dialog, [role="dialog"]')) { reset(); return; }
      if (!/^\d$/.test(event.key)) { reset(); return; }
      if (performance.now() - lastDigitAt >= 2500) reset();
      digits += event.key;
      lastDigitAt = performance.now();
      if (digits.length === 2) { void attempt(digits, false); reset(); }
    };
    window.addEventListener('keydown', key);
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', reset);
    };
  }, [mode, disabled, attempt]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (mode === 'closed') {
      element.close(); setCode(''); setMessage(''); setError(''); return;
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
      <h2 id="secret-title">{message}</h2>
    </div> : <form aria-busy={busy} onSubmit={event => { event.preventDefault(); void attempt(code, true); }}>
      <h2 id="secret-title">Secret code</h2>
      <label className="secret-code-label" htmlFor="secret-code">Enter the code</label>
      <input ref={input} id="secret-code" type="text" inputMode="numeric" pattern="[0-9]{2}" maxLength={2} required autoComplete="off" enterKeyHint="go" value={code} aria-invalid={!!error} aria-describedby={error ? 'secret-error' : undefined} onChange={event => {
        const next = event.target.value.replace(/\D/g, '').slice(0, 2);
        request.current++; inFlight.current = false; setBusy(false);
        setCode(next); setError('');
        if (next.length === 2) void attempt(next, true);
      }} />
      <p id="secret-error" className="secret-error" role="status">{error}</p>
      <button className="secret-submit" type="submit" disabled={busy}>{busy ? 'Opening…' : 'Open'}</button>
    </form>}
  </dialog>;
}

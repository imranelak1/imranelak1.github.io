type Envelope = { version: number; salt: string; iv: string; data: string };
let payload: Promise<Envelope> | undefined;

function loadPayload() {
  payload ??= fetch(`${import.meta.env.BASE_URL}secret-message.json`).then(async response => {
    if (!response.ok) throw new Error('Message unavailable');
    const value = await response.json() as Envelope;
    if (value.version !== 1) throw new Error('Unsupported message');
    return value;
  }).catch(error => { payload = undefined; throw error; });
  return payload;
}

// A short code provides casual hiding only; every possible code can be tried offline.
export async function openSecret(code: string): Promise<string | null> {
  const envelope = await loadPayload();
  const bytes = (value: string) => Uint8Array.from(atob(value), character => character.charCodeAt(0));
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: bytes(envelope.salt), iterations: 600000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  try {
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(envelope.iv) }, key, bytes(envelope.data));
    return new TextDecoder('utf-8', { fatal: true }).decode(plaintext);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'OperationError') return null;
    throw error;
  }
}

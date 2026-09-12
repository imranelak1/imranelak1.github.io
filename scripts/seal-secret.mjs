import { webcrypto } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// This only hides a short-code Easter egg from casual reading, not brute force.
export async function sealSecret(code, message) {
  if (!/^\d{2}$/.test(code) || typeof message !== 'string' || !message.trim()) {
    throw new Error('Expected a two-digit code and a nonempty message.');
  }
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const material = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveKey']);
  const key = await webcrypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const data = await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(message));
  const base64 = value => Buffer.from(value).toString('base64');
  return { version: 1, salt: base64(salt), iv: base64(iv), data: base64(data) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (!process.argv[2]) throw new Error('Missing private input file.');
    const { code, message } = JSON.parse(await readFile(process.argv[2], 'utf8'));
    const envelope = await sealSecret(code, message);
    await writeFile('public/secret-message.json', `${JSON.stringify(envelope)}\n`);
    console.log('Updated the encrypted payload. Keep the input file out of Git.');
  } catch {
    console.error('Could not create the payload. Supply a private JSON file containing a two-digit code and a message.');
    process.exitCode = 1;
  }
}

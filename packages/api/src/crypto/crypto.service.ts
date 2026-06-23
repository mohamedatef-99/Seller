import { Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

// AES-256-GCM encryption for secrets at rest (seller Bosta API keys).
// The 32-byte key is derived from COURIER_ENCRYPTION_KEY via SHA-256 so any
// passphrase format works. Ciphertext format: v1:<iv>:<tag>:<ct> (all base64).
@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor() {
    const secret = process.env.COURIER_ENCRYPTION_KEY ?? 'dev-insecure-secret';
    this.key = createHash('sha256').update(secret).digest(); // 32 bytes
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
  }

  decrypt(payload: string): string {
    const [version, ivB64, tagB64, ctB64] = payload.split(':');
    if (version !== 'v1' || !ivB64 || !tagB64 || !ctB64) {
      throw new Error('Invalid ciphertext format');
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const pt = Buffer.concat([
      decipher.update(Buffer.from(ctB64, 'base64')),
      decipher.final(),
    ]);
    return pt.toString('utf8');
  }

  // Safe display hint, e.g. "****cd09" — never returns the real key.
  maskTail(plain: string): string {
    return `****${plain.slice(-4)}`;
  }
}

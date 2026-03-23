// src/utils/encryption.ts
// Logic: AES-256-GCM encryption/decryption utility (Safe for Node.js/Next.js and Workers)

import * as crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Encrypt a string using AES-256-GCM.
 * @param text The plain text to encrypt
 * @param keyHex 64-character hex string (32 bytes)
 * @returns Combined string: iv.tag.encryptedData (all hex)
 */
export function encrypt(text: string, keyHex: string): string {
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('[Encryption] Invalid key. Expected 64-character hex string.');
  }

  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}.${authTag}.${encrypted}`;
}

/**
 * Decrypt a string using AES-256-GCM.
 * @param cipherText The iv.tag.encryptedData string
 * @param keyHex 64-character hex string (32 bytes)
 * @returns The original plain text
 */
export function decrypt(cipherText: string, keyHex: string): string {
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('[Encryption] Invalid key. Expected 64-character hex string.');
  }

  const key = Buffer.from(keyHex, 'hex');
  const parts = cipherText.split('.');

  if (parts.length !== 3) {
    throw new Error('[Encryption] Invalid format. Expected iv.tag.data');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

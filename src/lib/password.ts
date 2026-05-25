// src/lib/password.ts
// 密码工具 — 随机密码生成 + pbkdf2 哈希/验证

import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto';

const KEYLEN = 64;
const SALT_LEN = 32;
const ITERATIONS = 10000;

export function generateRandomPassword(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN);
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, 'sha512');
  return salt.toString('hex') + ':' + hash.toString('hex');
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const buf = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, 'sha512');
  if (buf.length !== expected.length) return false;
  return timingSafeEqual(buf, expected);
}

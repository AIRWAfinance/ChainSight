import bcrypt from 'bcryptjs';
import { getStorageBackend } from '../storage/index.js';
import type { UserRow } from '../storage/types.js';

const BCRYPT_COST = 10;

export async function registerUser(
  email: string,
  password: string,
): Promise<UserRow> {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Invalid email');
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const store = getStorageBackend();
  const existing = await store.findUserByEmail(normalized);
  if (existing) throw new Error('Email already registered');

  const hash = await bcrypt.hash(password, BCRYPT_COST);
  return store.createUser(normalized, hash);
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<UserRow | null> {
  const normalized = email.trim().toLowerCase();
  const store = getStorageBackend();
  const found = await store.findUserByEmail(normalized);
  if (!found) return null;
  const ok = await bcrypt.compare(password, found.passwordHash);
  return ok ? found.user : null;
}

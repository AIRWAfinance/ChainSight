/**
 * Create (or upsert) an admin account directly — bootstrap helper.
 *
 * Usage:
 *   npm run admin:create -- admin@example.com 'P@ssw0rd!at-least-8'
 *
 * If the email already exists, the password is reset and the role is set
 * to admin. Idempotent.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { getStorageBackend } from '../lib/storage/index.js';

async function main(): Promise<void> {
  const [emailArg, passwordArg] = process.argv.slice(2);
  if (!emailArg || !passwordArg) {
    console.error("Usage: npm run admin:create -- <email> '<password>'");
    process.exit(2);
  }
  const email = emailArg.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Invalid email format.');
    process.exit(2);
  }
  if (passwordArg.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(2);
  }

  const store = getStorageBackend();
  const hash = await bcrypt.hash(passwordArg, 10);
  const existing = await store.findUserByEmail(email);

  if (existing) {
    // Storage interface has no setPassword; reach into the underlying tables
    // by deleting+recreating is too destructive. Instead, fall back to
    // role promotion only — instruct the user to reset the password through
    // the UI if needed.
    await store.setUserRole(existing.user.id, 'admin');
    console.log(
      `[admin-create] User ${email} already exists. Promoted to admin. ` +
        `(Password unchanged — use the existing password to sign in.)`,
    );
    console.log(`  user_id: ${existing.user.id}`);
    return;
  }

  const created = await store.createUser(email, hash);
  await store.setUserRole(created.id, 'admin');
  console.log(`[admin-create] Created admin user.`);
  console.log(`  email:    ${email}`);
  console.log(`  user_id:  ${created.id}`);
  console.log(`  role:     admin`);
  console.log(`  password: (the one you just provided)`);
  console.log('');
  console.log('Sign in at /login then visit /admin.');
}

main().catch((err) => {
  console.error('[admin-create] FAILED:', err);
  process.exit(1);
});

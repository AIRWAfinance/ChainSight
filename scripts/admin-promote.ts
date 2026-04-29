/**
 * Promote (or demote) a user account by email — operator CLI.
 *
 * Usage:
 *   npm run admin:promote -- user@example.com         (default: admin)
 *   npm run admin:promote -- user@example.com user    (demote)
 *   npm run admin:promote -- user@example.com admin   (explicit)
 *
 * The command bootstraps the same StorageBackend the API uses, so it works
 * against either local SQLite or Postgres (via CHAINSIGHT_DB_URL).
 */
import 'dotenv/config';
import { getStorageBackend } from '../lib/storage/index.js';

async function main(): Promise<void> {
  const [emailArg, roleArg = 'admin'] = process.argv.slice(2);
  if (!emailArg) {
    console.error('Usage: npm run admin:promote -- <email> [admin|user]');
    process.exit(2);
  }
  if (roleArg !== 'admin' && roleArg !== 'user') {
    console.error(`Invalid role "${roleArg}" — must be "admin" or "user"`);
    process.exit(2);
  }
  const email = emailArg.trim().toLowerCase();
  const store = getStorageBackend();
  const found = await store.findUserByEmail(email);
  if (!found) {
    console.error(`No user found with email "${email}".`);
    console.error(
      'Register the account first via /register, then re-run this script.',
    );
    process.exit(1);
  }
  await store.setUserRole(found.user.id, roleArg);
  console.log(
    `[admin-promote] ${email} (${found.user.id}) → role=${roleArg}`,
  );
}

main().catch((err) => {
  console.error('[admin-promote] FAILED:', err);
  process.exit(1);
});

import 'dotenv/config';
import { getStorageBackend } from '../lib/storage/index.js';

const store = getStorageBackend();
const found = await store.findUserByEmail('admin@chainsight.local');
if (!found) {
  console.log('NOT FOUND in DB at', process.env['CHAINSIGHT_STORE_PATH'] ?? 'data/storage/chainsight.db');
  process.exit(1);
}
console.log('FOUND:', JSON.stringify(found.user, null, 2));

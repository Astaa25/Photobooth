import crypto from 'node:crypto';

const sessionSecret = crypto.randomBytes(32).toString('hex');
const encryptionKey = crypto.randomBytes(32).toString('base64');
const hmacPepper = crypto.randomBytes(32).toString('hex');

console.log('--- GENERATED SECRETS (Salin ke file .env Anda) ---');
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log(`HMAC_PEPPER=${hmacPepper}`);
console.log('----------------------------------------------------');

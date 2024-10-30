import * as crypto from 'crypto';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

export function decryptEnvironmentVariables() {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    return;
  }
  const encryptionPassword = 'xXArbuzArbuzPerniXx';
  // Read and decode the base64 content of .env.enc
  const encryptedEnv = fs.readFileSync('.env.enc', 'utf8');
  const encryptedBuffer = Buffer.from(encryptedEnv, 'base64');

  // Check for "Salted__" prefix and extract salt
  const saltPrefix = encryptedBuffer.subarray(0, 8).toString();
  if (saltPrefix !== 'Salted__') {
    throw new Error('Invalid encrypted file format');
  }

  const salt = encryptedBuffer.subarray(8, 16); // 8 bytes after "Salted__"
  const encryptedText = encryptedBuffer.subarray(16); // Remaining is the encrypted data

  // Derive key and IV using pbkdf2Sync
  const key = crypto.pbkdf2Sync(encryptionPassword, salt, 133712, 32, 'sha256');
  const iv = crypto.pbkdf2Sync(encryptionPassword, salt, 133712, 16, 'sha256');

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, undefined, 'utf8');

  decrypted += decipher.final('utf8');

  // Load decrypted environment variables into process.env
  const envConfig = dotenv.parse(decrypted);
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

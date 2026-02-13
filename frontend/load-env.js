#!/usr/bin/env node
/**
 * Runtime .env decryption loader for Frontend
 * Automatically decrypts .env.local.enc at build/runtime if .env.local doesn't exist
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 16;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Derive encryption key from password using PBKDF2
 */
function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Decrypt .env.local.enc to .env.local at runtime
 */
function decryptEnv(password = null) {
    const envEncPath = '.env.local.enc';
    const envPath = '.env.local';

    // If .env.local exists, skip decryption
    if (fs.existsSync(envPath)) {
        console.log('✅ .env.local already exists');
        return true;
    }

    // Check if .env.local.enc exists
    if (!fs.existsSync(envEncPath)) {
        console.warn('⚠️  Neither .env.local nor .env.local.enc found!');
        return false;
    }

    // Get password from environment variable
    if (password === null) {
        password = process.env.ENV_PASSWORD;
    }

    if (!password) {
        // In production (Vercel), use environment variable
        if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
            console.error('❌ ENV_PASSWORD not set in production environment!');
            console.error('Set ENV_PASSWORD in Vercel environment variables');
            return false;
        }

        // In development, fail - user should run decrypt manually
        console.error('❌ ENV_PASSWORD not set!');
        console.error('Run: node encrypt-env.js decrypt');
        return false;
    }

    try {
        // Read encrypted file
        const data = fs.readFileSync(envEncPath);

        // Extract components
        const salt = data.slice(0, SALT_LENGTH);
        const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const tag = data.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
        const encrypted = data.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

        // Derive key from password
        const key = deriveKey(password, salt);

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        // Decrypt data
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

        // Write decrypted file
        fs.writeFileSync(envPath, decrypted);

        console.log('✅ .env.local decrypted successfully');
        return true;
    } catch (error) {
        console.error(`❌ Decryption failed: ${error.message}`);
        return false;
    }
}

/**
 * Load environment variables with automatic decryption
 */
function loadEnvWithDecryption() {
    // Try to decrypt if needed
    const success = decryptEnv();

    if (!success) {
        console.warn('⚠️  Continuing without .env.local');
    }

    return success;
}

// Auto-run on import
if (require.main === module) {
    // Run standalone
    if (decryptEnv()) {
        console.log('✅ Ready to start application');
        process.exit(0);
    } else {
        console.error('❌ Failed to decrypt .env.local');
        process.exit(1);
    }
} else {
    // Run on import
    loadEnvWithDecryption();
}

module.exports = { decryptEnv, loadEnvWithDecryption };

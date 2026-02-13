#!/usr/bin/env node
/**
 * Encrypt/Decrypt .env files for secure storage (Frontend)
 * Usage:
 *   node encrypt-env.js encrypt    # Encrypt .env.local to .env.local.enc
 *   node encrypt-env.js decrypt    # Decrypt .env.local.enc to .env.local
 */

const crypto = require('crypto');
const fs = require('fs');
const readline = require('readline');

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
 * Encrypt file content
 */
function encryptFile(inputFile, outputFile, password) {
    try {
        // Read input file
        const data = fs.readFileSync(inputFile);

        // Generate random salt and IV
        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);

        // Derive key from password
        const key = deriveKey(password, salt);

        // Create cipher
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        // Encrypt data
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        const tag = cipher.getAuthTag();

        // Combine: salt + iv + tag + encrypted data
        const output = Buffer.concat([salt, iv, tag, encrypted]);

        // Write encrypted file
        fs.writeFileSync(outputFile, output);

        console.log(`✅ Encrypted ${inputFile} → ${outputFile}`);
        return true;
    } catch (error) {
        console.error(`❌ Encryption failed: ${error.message}`);
        return false;
    }
}

/**
 * Decrypt file content
 */
function decryptFile(inputFile, outputFile, password) {
    try {
        // Read encrypted file
        const data = fs.readFileSync(inputFile);

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
        fs.writeFileSync(outputFile, decrypted);

        console.log(`✅ Decrypted ${inputFile} → ${outputFile}`);
        return true;
    } catch (error) {
        console.error(`❌ Decryption failed: ${error.message}`);
        console.error('Incorrect password or corrupted file');
        return false;
    }
}

/**
 * Prompt for password
 */
function promptPassword(prompt) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Hide password input
        const stdin = process.stdin;
        stdin.on('data', (char) => {
            char = char.toString();
            if (char === '\n' || char === '\r' || char === '\u0004') {
                stdin.pause();
            } else {
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write(prompt + '*'.repeat(rl.line.length));
            }
        });

        rl.question(prompt, (password) => {
            rl.close();
            console.log(''); // New line after password
            resolve(password);
        });
    });
}

/**
 * Main function
 */
async function main() {
    const command = process.argv[2];

    if (!command) {
        console.log('Usage: node encrypt-env.js [encrypt|decrypt]');
        process.exit(1);
    }

    if (command === 'encrypt') {
        // Encrypt .env.local to .env.local.enc
        if (!fs.existsSync('.env.local')) {
            console.error('❌ .env.local file not found!');
            process.exit(1);
        }

        const password = await promptPassword('Enter encryption password: ');
        const confirm = await promptPassword('Confirm password: ');

        if (password !== confirm) {
            console.error('❌ Passwords don\'t match!');
            process.exit(1);
        }

        if (encryptFile('.env.local', '.env.local.enc', password)) {
            console.log('\n⚠️  IMPORTANT:');
            console.log('1. Keep .env.local.enc in your repository');
            console.log('2. Add .env.local to .gitignore (never commit plain .env.local)');
            console.log('3. Remember your password - you\'ll need it to decrypt!');
        } else {
            process.exit(1);
        }
    } else if (command === 'decrypt') {
        // Decrypt .env.local.enc to .env.local
        if (!fs.existsSync('.env.local.enc')) {
            console.error('❌ .env.local.enc file not found!');
            process.exit(1);
        }

        const password = await promptPassword('Enter decryption password: ');

        if (decryptFile('.env.local.enc', '.env.local', password)) {
            console.log('\n✅ .env.local file ready to use!');
        } else {
            process.exit(1);
        }
    } else {
        console.error(`❌ Unknown command: ${command}`);
        console.log('Usage: node encrypt-env.js [encrypt|decrypt]');
        process.exit(1);
    }
}

main().catch(console.error);

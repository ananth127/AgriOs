const fs = require('fs');
const path = require('path');

// Read the English translation file (source of truth)
const enPath = path.join(__dirname, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

// List of all language files to update
const languages = ['bn', 'gu', 'hi', 'kn', 'ml', 'mr', 'pa', 'ta', 'te'];

// Function to recursively get all keys from an object
function getAllKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            keys = keys.concat(getAllKeys(obj[key], fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

// Function to get value from nested object using dot notation
function getValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Function to set value in nested object using dot notation
function setValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
        if (!current[key]) current[key] = {};
        return current[key];
    }, obj);
    target[lastKey] = value;
}

// Get all keys from English file
const allEnglishKeys = getAllKeys(enData);

console.log(`Total keys in English file: ${allEnglishKeys.length}`);

// Process each language file
languages.forEach(lang => {
    const langPath = path.join(__dirname, `${lang}.json`);

    try {
        // Read existing translation file
        let langData = {};
        if (fs.existsSync(langPath)) {
            langData = JSON.parse(fs.readFileSync(langPath, 'utf-8'));
        }

        // Get existing keys
        const existingKeys = getAllKeys(langData);
        const missingKeys = allEnglishKeys.filter(key => !existingKeys.includes(key));

        console.log(`\n${lang.toUpperCase()}: ${existingKeys.length} existing, ${missingKeys.length} missing`);

        // Add missing keys with English values (to be translated later)
        missingKeys.forEach(key => {
            const englishValue = getValue(enData, key);
            setValue(langData, key, englishValue);
        });

        // Write updated file
        fs.writeFileSync(langPath, JSON.stringify(langData, null, 4), 'utf-8');
        console.log(`✓ Updated ${lang}.json`);

    } catch (error) {
        console.error(`✗ Error processing ${lang}.json:`, error.message);
    }
});

console.log('\n✓ All language files synchronized!');

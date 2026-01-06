const fs = require('fs');
try {
    const content = fs.readFileSync('src/messages/hi.json', 'utf8');
    JSON.parse(content);
    console.log('JSON is valid');
} catch (e) {
    console.error('Invalid JSON:', e.message);
    process.exit(1);
}

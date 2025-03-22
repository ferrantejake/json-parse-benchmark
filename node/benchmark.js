const fs = require('fs');
const path = require('path');
const { parse_json } = require('../build/Release/json_parser.node');

// Read sample.json
const jsonContent = fs.readFileSync(path.join(__dirname, '../sample.json'), 'utf8');

// Test 1: Single parse
console.log('Test 1: Single parse');
console.time('Node JSON.parse');
const nodeResult = JSON.parse(jsonContent);
console.timeEnd('Node JSON.parse');

console.time('Rust parse');
const rustResult = parse_json(Buffer.from(jsonContent));
console.timeEnd('Rust parse');

// Test 2: 1000 iterations
console.log('\nTest 2: 1000 iterations');
console.time('Node JSON.parse (1000x)');
for (let i = 0; i < 1000; i++) {
    JSON.parse(jsonContent);
}
console.timeEnd('Node JSON.parse (1000x)');

console.time('Rust parse (1000x)');
for (let i = 0; i < 1000; i++) {
    parse_json(Buffer.from(jsonContent));
}
console.timeEnd('Rust parse (1000x)'); 
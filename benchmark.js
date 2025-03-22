const fs = require('fs');
const path = require('path');
const addon = require('./build/index.node');

// Read all sample files
const files = ['sample.json', 'sample-big-array.json', 'sample-big-object.json'];
const iterations = 1000;

// Calculate column widths
const fileNameWidth = 25;  // Fixed width for consistent alignment
const operationWidth = 15;
const timeWidth = 13;      // Increased to accommodate larger numbers
const diffWidth = 15;

// Create separator line
const separator = `|-${'-'.repeat(fileNameWidth-1)}|-${'-'.repeat(operationWidth-1)}|-${'-'.repeat(timeWidth-1)}|-${'-'.repeat(timeWidth-1)}|-${'-'.repeat(diffWidth-1)}|`;

// Table header
console.log('\nJSON Parsing Performance Comparison\n');
console.log(`|${'File'.padEnd(fileNameWidth)}|${'Operation'.padEnd(operationWidth)}|${'Node.js (ms)'.padEnd(timeWidth)}|${'Rust (ms)'.padEnd(timeWidth)}|${'Difference'.padEnd(diffWidth)}|`);
console.log(separator);

for (const file of files) {
    const jsonContent = fs.readFileSync(path.join(__dirname, file), 'utf8');
    
    // Single parse
    const nodeStart = process.hrtime.bigint();
    const nodeResult = JSON.parse(jsonContent);
    const nodeEnd = process.hrtime.bigint();
    const nodeSingleTime = Number(nodeEnd - nodeStart) / 1_000_000; // Convert to ms
    
    const rustStart = process.hrtime.bigint();
    const rustResult = addon.parseJson(jsonContent);
    const rustEnd = process.hrtime.bigint();
    const rustSingleTime = Number(rustEnd - rustStart) / 1_000_000; // Convert to ms
    
    const singleDiff = ((rustSingleTime - nodeSingleTime) / nodeSingleTime * 100).toFixed(1);
    console.log(
        `|${file.padEnd(fileNameWidth)}|` +
        `${'Single Parse'.padEnd(operationWidth)}|` +
        `${nodeSingleTime.toFixed(3).padStart(timeWidth)}|` +
        `${rustSingleTime.toFixed(3).padStart(timeWidth)}|` +
        `${singleDiff}% slower`.padEnd(diffWidth) + '|'
    );
    
    // Multiple iterations
    const nodeMultiStart = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        JSON.parse(jsonContent);
    }
    const nodeMultiEnd = process.hrtime.bigint();
    const nodeMultiTime = Number(nodeMultiEnd - nodeMultiStart) / 1_000_000; // Convert to ms
    
    const rustMultiStart = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        addon.parseJson(jsonContent);
    }
    const rustMultiEnd = process.hrtime.bigint();
    const rustMultiTime = Number(rustMultiEnd - rustMultiStart) / 1_000_000; // Convert to ms
    
    const multiDiff = ((rustMultiTime - nodeMultiTime) / nodeMultiTime * 100).toFixed(1);
    console.log(
        `|${file.padEnd(fileNameWidth)}|` +
        `${iterations} Iterations`.padEnd(operationWidth) + '|' +
        `${nodeMultiTime.toFixed(3).padStart(timeWidth)}|` +
        `${rustMultiTime.toFixed(3).padStart(timeWidth)}|` +
        `${multiDiff}% slower`.padEnd(diffWidth) + '|'
    );
    console.log(separator);
} 
const fs = require('fs');
const path = require('path');
const addon = require('./build/index.node');
const simdjson = require('simdjson');

// Read all sample files
const files = ['sample.json', 'sample-big-array.json', 'sample-big-object.json'];
const iterations = 1000;

console.log('\nJSON Parsing Performance Comparison\n');

// Print header with fixed-width columns
console.log('File                      Operation       JSON.parse    JS SIMD       Rust Serde    Rust SIMD     Difference vs best JS');
console.log('-'.repeat(130));

for (const file of files) {
    const jsonContent = fs.readFileSync(path.join(__dirname, file), 'utf8');
    
    // Single parse - JSON.parse
    const nativeStart = process.hrtime.bigint();
    const nativeResult = JSON.parse(jsonContent);
    const nativeEnd = process.hrtime.bigint();
    const nativeSingleTime = Number(nativeEnd - nativeStart) / 1_000_000; // Convert to ms
    
    // Single parse - JS SIMD
    const jsStart = process.hrtime.bigint();
    const jsResult = simdjson.parse(jsonContent);
    const jsEnd = process.hrtime.bigint();
    const jsSingleTime = Number(jsEnd - jsStart) / 1_000_000; // Convert to ms
    
    // Single parse - Rust Serde
    const serdeStart = process.hrtime.bigint();
    const serdeResult = addon.parseJsonSerde(jsonContent);
    const serdeEnd = process.hrtime.bigint();
    const serdeSingleTime = Number(serdeEnd - serdeStart) / 1_000_000; // Convert to ms
    
    // Single parse - Rust SIMD
    const simdStart = process.hrtime.bigint();
    const simdResult = addon.parseJsonSimd(jsonContent);
    const simdEnd = process.hrtime.bigint();
    const simdSingleTime = Number(simdEnd - simdStart) / 1_000_000; // Convert to ms
    
    // Find the fastest JS time
    const jsAllTimes = [nativeSingleTime, jsSingleTime];
    const jsMethods = ["JSON.parse", "JS SIMD"];
    const fastestJsTime = Math.min(...jsAllTimes);
    const fastestJsIndex = jsAllTimes.indexOf(fastestJsTime);
    const fastestJsMethod = jsMethods[fastestJsIndex];
    
    // Find the fastest Rust time
    const rustAllTimes = [serdeSingleTime, simdSingleTime];
    const rustMethods = ["Rust Serde", "Rust SIMD"];
    const fastestRustTime = Math.min(...rustAllTimes);
    const fastestRustIndex = rustAllTimes.indexOf(fastestRustTime);
    const fastestRustMethod = rustMethods[fastestRustIndex];
    
    // Calculate difference between fastest JS and fastest Rust
    const singleDiff = ((fastestJsTime - fastestRustTime) / fastestJsTime * 100).toFixed(1);
    
    console.log(
        `${file.padEnd(25)} ${'Single Parse'.padEnd(15)} ` +
        `${nativeSingleTime.toFixed(3).padStart(8).padEnd(13)} ` +
        `${jsSingleTime.toFixed(3).padStart(8).padEnd(13)} ` +
        `${serdeSingleTime.toFixed(3).padStart(8).padEnd(13)} ` +
        `${simdSingleTime.toFixed(3).padStart(8).padEnd(13)} ` +
        `${Math.abs(singleDiff)}% ${Number(singleDiff) > 0 ? 'faster' : 'slower'} (${fastestRustMethod})`
    );
    
    // Multiple iterations - JSON.parse
    const nativeMultiStart = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        JSON.parse(jsonContent);
    }
    const nativeMultiEnd = process.hrtime.bigint();
    const nativeMultiTime = Number(nativeMultiEnd - nativeMultiStart) / 1_000_000; // Convert to ms
    
    // Multiple iterations - JS SIMD
    const jsMultiStart = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        simdjson.parse(jsonContent);
    }
    const jsMultiEnd = process.hrtime.bigint();
    const jsMultiTime = Number(jsMultiEnd - jsMultiStart) / 1_000_000; // Convert to ms
    
    // Multiple iterations - Rust Serde
    const serdeMultiStart = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        addon.parseJsonSerde(jsonContent);
    }
    const serdeMultiEnd = process.hrtime.bigint();
    const serdeMultiTime = Number(serdeMultiEnd - serdeMultiStart) / 1_000_000; // Convert to ms
    
    // Multiple iterations - Rust SIMD
    const simdMultiStart = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        addon.parseJsonSimd(jsonContent);
    }
    const simdMultiEnd = process.hrtime.bigint();
    const simdMultiTime = Number(simdMultiEnd - simdMultiStart) / 1_000_000; // Convert to ms
    
    // Find the fastest JS multi time
    const jsMultiAllTimes = [nativeMultiTime, jsMultiTime];
    const fastestJsMultiTime = Math.min(...jsMultiAllTimes);
    const fastestJsMultiIndex = jsMultiAllTimes.indexOf(fastestJsMultiTime);
    const fastestJsMultiMethod = jsMethods[fastestJsMultiIndex];
    
    // Find the fastest Rust multi time
    const rustMultiAllTimes = [serdeMultiTime, simdMultiTime];
    const fastestRustMultiTime = Math.min(...rustMultiAllTimes);
    const fastestRustMultiIndex = rustMultiAllTimes.indexOf(fastestRustMultiTime);
    const fastestRustMultiMethod = rustMethods[fastestRustMultiIndex];
    
    // Calculate difference between fastest JS and fastest Rust for multi
    const multiDiff = ((fastestJsMultiTime - fastestRustMultiTime) / fastestJsMultiTime * 100).toFixed(1);
    
    console.log(
        `${file.padEnd(25)} ${`${iterations} Iterations`.padEnd(15)} ` +
        `${nativeMultiTime.toFixed(3).padStart(8).padEnd(13)} ` +
        `${jsMultiTime.toFixed(3).padStart(8).padEnd(13)} ` +
        `${serdeMultiTime.toFixed(3).padStart(8).padEnd(13)} ` +
        `${simdMultiTime.toFixed(3).padStart(8).padEnd(13)} ` +
        `${Math.abs(multiDiff)}% ${Number(multiDiff) > 0 ? 'faster' : 'slower'} (${fastestRustMultiMethod})`
    );
    console.log('-'.repeat(130));
} 
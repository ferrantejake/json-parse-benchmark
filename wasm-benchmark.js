// This script will be used to benchmark WASM implementations
// It needs to be run in a browser environment or with a WASM-compatible Node.js setup

const fs = require('fs');
const path = require('path');

// Import the WASM module
async function runBenchmark() {
    // Load the WASM modules
    const wasmSerde = await import('./wasm/web/json_parser_neon.js');
    await wasmSerde.default();
    
    // Load the native implementations for comparison
    const nativeAddon = require('./build/index.node');
    const simdjson = require('simdjson');
    
    // Read all sample files
    const files = ['sample.json', 'sample-big-array.json', 'sample-big-object.json'];
    const iterations = 1000;
    
    console.log('\nJSON Parsing Performance Comparison (Including WASM)\n');
    
    // Print header with fixed-width columns
    console.log('File                      Operation       JSON.parse    JS SIMD       Rust Serde    Rust SIMD     WASM Serde    WASM SIMD     Best vs. Rest');
    console.log('-'.repeat(160));
    
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
        
        // Single parse - Rust Serde (Native)
        const serdeStart = process.hrtime.bigint();
        const serdeResult = nativeAddon.parseJsonSerde(jsonContent);
        const serdeEnd = process.hrtime.bigint();
        const serdeSingleTime = Number(serdeEnd - serdeStart) / 1_000_000; // Convert to ms
        
        // Single parse - Rust SIMD (Native)
        const simdStart = process.hrtime.bigint();
        const simdResult = nativeAddon.parseJsonSimd(jsonContent);
        const simdEnd = process.hrtime.bigint();
        const simdSingleTime = Number(simdEnd - simdStart) / 1_000_000; // Convert to ms
        
        // Single parse - WASM Serde
        const wasmSerdeStart = process.hrtime.bigint();
        const wasmSerdeResult = wasmSerde.wasm_parse_json_serde(jsonContent);
        const wasmSerdeEnd = process.hrtime.bigint();
        const wasmSerdeSingleTime = Number(wasmSerdeEnd - wasmSerdeStart) / 1_000_000; // Convert to ms
        
        // Single parse - WASM SIMD
        const wasmSimdStart = process.hrtime.bigint();
        const wasmSimdResult = wasmSerde.wasm_parse_json_simd(jsonContent);
        const wasmSimdEnd = process.hrtime.bigint();
        const wasmSimdSingleTime = Number(wasmSimdEnd - wasmSimdStart) / 1_000_000; // Convert to ms
        
        // Find the fastest time
        const allTimes = [nativeSingleTime, jsSingleTime, serdeSingleTime, simdSingleTime, wasmSerdeSingleTime, wasmSimdSingleTime];
        const methods = ["JSON.parse", "JS SIMD", "Rust Serde", "Rust SIMD", "WASM Serde", "WASM SIMD"];
        const fastestTime = Math.min(...allTimes);
        const fastestIndex = allTimes.indexOf(fastestTime);
        const fastestMethod = methods[fastestIndex];
        
        // Find difference compared to fastest method
        const differences = allTimes.map(time => ((time - fastestTime) / fastestTime * 100).toFixed(1));
        const diffStr = `Best: ${fastestMethod} (${differences.filter((_, i) => i !== fastestIndex).map((diff, i) => {
            const idx = i >= fastestIndex ? i + 1 : i;
            return `${methods[idx]} +${diff}%`;
        }).join(', ')})`;
        
        console.log(
            `${file.padEnd(25)} ${'Single Parse'.padEnd(15)} ` +
            `${nativeSingleTime.toFixed(3).padStart(8).padEnd(13)} ` +
            `${jsSingleTime.toFixed(3).padStart(8).padEnd(13)} ` +
            `${serdeSingleTime.toFixed(3).padStart(8).padEnd(13)} ` +
            `${simdSingleTime.toFixed(3).padStart(8).padEnd(13)} ` +
            `${wasmSerdeSingleTime.toFixed(3).padStart(8).padEnd(13)} ` +
            `${wasmSimdSingleTime.toFixed(3).padStart(8).padEnd(13)} ` +
            diffStr
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
        
        // Multiple iterations - Rust Serde (Native)
        const serdeMultiStart = process.hrtime.bigint();
        for (let i = 0; i < iterations; i++) {
            nativeAddon.parseJsonSerde(jsonContent);
        }
        const serdeMultiEnd = process.hrtime.bigint();
        const serdeMultiTime = Number(serdeMultiEnd - serdeMultiStart) / 1_000_000; // Convert to ms
        
        // Multiple iterations - Rust SIMD (Native)
        const simdMultiStart = process.hrtime.bigint();
        for (let i = 0; i < iterations; i++) {
            nativeAddon.parseJsonSimd(jsonContent);
        }
        const simdMultiEnd = process.hrtime.bigint();
        const simdMultiTime = Number(simdMultiEnd - simdMultiStart) / 1_000_000; // Convert to ms
        
        // Multiple iterations - WASM Serde
        const wasmSerdeMultiStart = process.hrtime.bigint();
        for (let i = 0; i < iterations; i++) {
            wasmSerde.wasm_parse_json_serde(jsonContent);
        }
        const wasmSerdeMultiEnd = process.hrtime.bigint();
        const wasmSerdeMultiTime = Number(wasmSerdeMultiEnd - wasmSerdeMultiStart) / 1_000_000; // Convert to ms
        
        // Multiple iterations - WASM SIMD
        const wasmSimdMultiStart = process.hrtime.bigint();
        for (let i = 0; i < iterations; i++) {
            wasmSerde.wasm_parse_json_simd(jsonContent);
        }
        const wasmSimdMultiEnd = process.hrtime.bigint();
        const wasmSimdMultiTime = Number(wasmSimdMultiEnd - wasmSimdMultiStart) / 1_000_000; // Convert to ms
        
        // Find the fastest multi time
        const allMultiTimes = [nativeMultiTime, jsMultiTime, serdeMultiTime, simdMultiTime, wasmSerdeMultiTime, wasmSimdMultiTime];
        const fastestMultiTime = Math.min(...allMultiTimes);
        const fastestMultiIndex = allMultiTimes.indexOf(fastestMultiTime);
        const fastestMultiMethod = methods[fastestMultiIndex];
        
        // Find difference compared to fastest method
        const multiDifferences = allMultiTimes.map(time => ((time - fastestMultiTime) / fastestMultiTime * 100).toFixed(1));
        const multiDiffStr = `Best: ${fastestMultiMethod} (${multiDifferences.filter((_, i) => i !== fastestMultiIndex).map((diff, i) => {
            const idx = i >= fastestMultiIndex ? i + 1 : i;
            return `${methods[idx]} +${diff}%`;
        }).join(', ')})`;
        
        console.log(
            `${file.padEnd(25)} ${`${iterations} Iterations`.padEnd(15)} ` +
            `${nativeMultiTime.toFixed(3).padStart(8).padEnd(13)} ` +
            `${jsMultiTime.toFixed(3).padStart(8).padEnd(13)} ` +
            `${serdeMultiTime.toFixed(3).padStart(8).padEnd(13)} ` +
            `${simdMultiTime.toFixed(3).padStart(8).padEnd(13)} ` +
            `${wasmSerdeMultiTime.toFixed(3).padStart(8).padEnd(13)} ` +
            `${wasmSimdMultiTime.toFixed(3).padStart(8).padEnd(13)} ` +
            multiDiffStr
        );
        console.log('-'.repeat(160));
    }
}

runBenchmark().catch(console.error); 
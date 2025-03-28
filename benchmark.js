const fs = require('fs');
const path = require('path');
const addon = require('./build/index.node');
const simdjson = require('simdjson');

// For WASM support
async function loadWasmModule() {
    try {
        // Set up Node.js compatibility for browser-targeted WASM
        global.TextEncoder = require('util').TextEncoder;
        global.TextDecoder = require('util').TextDecoder;
        
        // Check if WASM files exist
        const wasmBinPath = path.join(__dirname, 'wasm/web/json_parser_neon_bg.wasm');
        const wasmJsPath = path.join(__dirname, 'wasm/web/json_parser_neon.js');
        
        if (!fs.existsSync(wasmBinPath) || !fs.existsSync(wasmJsPath)) {
            console.error('WASM files not found. Run npm run build:wasm first.');
            return null;
        }
        
        // Read the WASM binary
        const wasmBinary = fs.readFileSync(wasmBinPath);
        
        // Create a CommonJS version of the WASM JS glue code
        const wasmJsContent = fs.readFileSync(wasmJsPath, 'utf8');
        const cjsCode = `
            const module = {};
            let exports = {};
            
            ${wasmJsContent
                .replace(/export function/g, 'function')
                .replace(/export default/g, 'const init =')
                .replace(/export \{[^}]*\};/g, '')}
            
            module.exports = {
                wasm_parse_json_serde,
                wasm_parse_json_simd,
                init
            };
        `;
        
        // Write temporary file
        const tempFile = path.join(__dirname, 'temp-wasm-module.js');
        fs.writeFileSync(tempFile, cjsCode);
        
        // Load the module
        const wasmModule = require('./temp-wasm-module.js');
        
        // Setup fetch for wasm binary loading
        global.fetch = () => Promise.resolve({
            arrayBuffer: () => wasmBinary
        });
        
        // Initialize the module
        await wasmModule.init();
        
        // Clean up
        fs.unlinkSync(tempFile);
        
        return wasmModule;
    } catch (error) {
        console.error('Error loading WASM module:', error);
        return null;
    }
}

async function runBenchmarks() {
    // Try to load the WASM module
    console.log("Loading WASM module...");
    const wasmModule = await loadWasmModule();
    const wasmAvailable = wasmModule !== null;
    
    if (wasmAvailable) {
        console.log("WASM module loaded successfully.");
    } else {
        console.log("WASM module not available. Benchmarking without WASM.");
    }

    // Read all sample files
    const files = ['sample.json', 'sample-big-array.json', 'sample-big-object.json'];
    const iterations = 1000;

    console.log('\nJSON Parsing Performance Comparison\n');

    // Print header with fixed-width columns
    let header = 'File                      Operation       JSON.parse    JS SIMD       Rust Serde    Rust SIMD     ';
    if (wasmAvailable) {
        header += 'WASM Serde    WASM SIMD     ';
    }
    header += 'Difference vs best JS';
    console.log(header);
    console.log('-'.repeat(header.length));

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
        
        // Single parse - WASM Serde (if available)
        let wasmSerdeSingleTime = 0;
        let wasmSimdSingleTime = 0;
        
        if (wasmAvailable) {
            const wasmSerdeStart = process.hrtime.bigint();
            const wasmSerdeResult = wasmModule.wasm_parse_json_serde(jsonContent);
            const wasmSerdeEnd = process.hrtime.bigint();
            wasmSerdeSingleTime = Number(wasmSerdeEnd - wasmSerdeStart) / 1_000_000;
            
            const wasmSimdStart = process.hrtime.bigint();
            const wasmSimdResult = wasmModule.wasm_parse_json_simd(jsonContent);
            const wasmSimdEnd = process.hrtime.bigint();
            wasmSimdSingleTime = Number(wasmSimdEnd - wasmSimdStart) / 1_000_000;
        }
        
        // Find the fastest JS time
        const jsAllTimes = [nativeSingleTime, jsSingleTime];
        const jsMethods = ["JSON.parse", "JS SIMD"];
        const fastestJsTime = Math.min(...jsAllTimes);
        const fastestJsIndex = jsAllTimes.indexOf(fastestJsTime);
        const fastestJsMethod = jsMethods[fastestJsIndex];
        
        // Find the fastest Rust/WASM time
        const rustAllTimes = [serdeSingleTime, simdSingleTime];
        const rustMethods = ["Rust Serde", "Rust SIMD"];
        
        if (wasmAvailable) {
            rustAllTimes.push(wasmSerdeSingleTime, wasmSimdSingleTime);
            rustMethods.push("WASM Serde", "WASM SIMD");
        }
        
        const fastestRustTime = Math.min(...rustAllTimes);
        const fastestRustIndex = rustAllTimes.indexOf(fastestRustTime);
        const fastestRustMethod = rustMethods[fastestRustIndex];
        
        // Calculate difference between fastest JS and fastest Rust
        const singleDiff = ((fastestJsTime - fastestRustTime) / fastestJsTime * 100).toFixed(1);
        
        let output = 
            `${file.padEnd(25)} ${'Single Parse'.padEnd(15)} ` +
            `${nativeSingleTime.toFixed(3).padStart(8).padEnd(13)} ` +
            `${jsSingleTime.toFixed(3).padStart(8).padEnd(13)} ` +
            `${serdeSingleTime.toFixed(3).padStart(8).padEnd(13)} ` +
            `${simdSingleTime.toFixed(3).padStart(8).padEnd(13)} `;
            
        if (wasmAvailable) {
            output += 
                `${wasmSerdeSingleTime.toFixed(3).padStart(8).padEnd(13)} ` +
                `${wasmSimdSingleTime.toFixed(3).padStart(8).padEnd(13)} `;
        }
        
        output += `${Math.abs(singleDiff)}% ${Number(singleDiff) > 0 ? 'faster' : 'slower'} (${fastestRustMethod})`;
        console.log(output);
        
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
        
        // Multiple iterations - WASM (if available)
        let wasmSerdeMultiTime = 0;
        let wasmSimdMultiTime = 0;
        
        if (wasmAvailable) {
            const wasmSerdeMultiStart = process.hrtime.bigint();
            for (let i = 0; i < iterations; i++) {
                wasmModule.wasm_parse_json_serde(jsonContent);
            }
            const wasmSerdeMultiEnd = process.hrtime.bigint();
            wasmSerdeMultiTime = Number(wasmSerdeMultiEnd - wasmSerdeMultiStart) / 1_000_000;
            
            const wasmSimdMultiStart = process.hrtime.bigint();
            for (let i = 0; i < iterations; i++) {
                wasmModule.wasm_parse_json_simd(jsonContent);
            }
            const wasmSimdMultiEnd = process.hrtime.bigint();
            wasmSimdMultiTime = Number(wasmSimdMultiEnd - wasmSimdMultiStart) / 1_000_000;
        }
        
        // Find the fastest JS multi time
        const jsMultiAllTimes = [nativeMultiTime, jsMultiTime];
        const fastestJsMultiTime = Math.min(...jsMultiAllTimes);
        const fastestJsMultiIndex = jsMultiAllTimes.indexOf(fastestJsMultiTime);
        const fastestJsMultiMethod = jsMethods[fastestJsMultiIndex];
        
        // Find the fastest Rust multi time
        const rustMultiAllTimes = [serdeMultiTime, simdMultiTime];
        const rustMultiMethods = ["Rust Serde", "Rust SIMD"];
        
        if (wasmAvailable) {
            rustMultiAllTimes.push(wasmSerdeMultiTime, wasmSimdMultiTime);
            rustMultiMethods.push("WASM Serde", "WASM SIMD");
        }
        
        const fastestRustMultiTime = Math.min(...rustMultiAllTimes);
        const fastestRustMultiIndex = rustMultiAllTimes.indexOf(fastestRustMultiTime);
        const fastestRustMultiMethod = rustMultiMethods[fastestRustMultiIndex];
        
        // Calculate difference between fastest JS and fastest Rust for multi
        const multiDiff = ((fastestJsMultiTime - fastestRustMultiTime) / fastestJsMultiTime * 100).toFixed(1);
        
        let multiOutput = 
            `${file.padEnd(25)} ${`${iterations} Iterations`.padEnd(15)} ` +
            `${nativeMultiTime.toFixed(3).padStart(8).padEnd(13)} ` +
            `${jsMultiTime.toFixed(3).padStart(8).padEnd(13)} ` +
            `${serdeMultiTime.toFixed(3).padStart(8).padEnd(13)} ` +
            `${simdMultiTime.toFixed(3).padStart(8).padEnd(13)} `;
            
        if (wasmAvailable) {
            multiOutput += 
                `${wasmSerdeMultiTime.toFixed(3).padStart(8).padEnd(13)} ` +
                `${wasmSimdMultiTime.toFixed(3).padStart(8).padEnd(13)} `;
        }
        
        multiOutput += `${Math.abs(multiDiff)}% ${Number(multiDiff) > 0 ? 'faster' : 'slower'} (${fastestRustMultiMethod})`;
        console.log(multiOutput);
        
        console.log('-'.repeat(header.length));
    }
}

// Run the benchmarks
runBenchmarks().catch(error => {
    console.error('Error running benchmarks:', error);
}); 
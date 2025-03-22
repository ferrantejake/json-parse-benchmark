# JSON Parser Benchmark

A simple project comparing JSON parsing performance between Node.js's native `JSON.parse` and a Rust implementation using Neon bindings.

## Prerequisites

- Node.js (v16+)
- Rust (stable)

## Quick Start

```bash
git clone <repository-url>
cd json-parser-neon
npm install
npm run benchmark
```

## Scripts

- `npm run build` - Build the Rust code and generate Node.js bindings
- `npm run benchmark` - Build and run performance tests
- `npm run clean` - Clean build artifacts

## Sample Results

```
Test 1: Single parse
Node JSON.parse: 0.08ms
Rust parse: 0.023ms

Test 2: 1000 iterations
Node JSON.parse (1000x): 2.902ms
Rust parse (1000x): 6.322ms
```

Single operations are ~3.5x faster in Rust, but bulk operations are ~2.2x faster in Node.js, possibly due to binding overhead.

## Project Structure

- `src/lib.rs` - Rust implementation
- `benchmark.js` - Benchmark script
- `sample.json` - Test data
- `build/` - Compiled output


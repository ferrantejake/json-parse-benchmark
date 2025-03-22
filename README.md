# JSON Parser vs. Rust JSON Parse Benchmark

A simple project comparing JSON parsing performance between Node.js's native `JSON.parse` and a Rust implementation using Neon bindings.

## Prerequisites

- Node.js (v16+)
- Rust (stable)

## Quick Start

```bash
npm install
npm run benchmark
```

## Scripts

- `npm run build` - Build the Rust code and generate Node.js bindings
- `npm run benchmark` - Build and run performance tests
- `npm run clean` - Clean build artifacts

## Sample Results

```
> json-parser-neon@0.1.0 build
> cargo build --release && mkdir -p build && cp target/release/libjson_parser_neon.dylib build/index.node

    Finished `release` profile [optimized] target(s) in 0.01s

JSON Parsing Performance Comparison

|File                     |Operation      |Node.js (ms) |Rust (ms)    |Difference     |
|-------------------------|---------------|-------------|-------------|---------------|
|sample.json              |Single Parse   |        0.027|        0.020|26.8% faster   |
|sample.json              |1000 Iterations|        2.675|        0.925|65.4% faster   |
|-------------------------|---------------|-------------|-------------|---------------|
|sample-big-array.json    |Single Parse   |        3.181|        1.225|61.5% faster   |
|sample-big-array.json    |1000 Iterations|     2358.425|     1069.909|54.6% faster   |
|-------------------------|---------------|-------------|-------------|---------------|
|sample-big-object.json   |Single Parse   |        0.192|        0.112|41.8% faster   |
|sample-big-object.json   |1000 Iterations|      109.829|       71.124|35.2% faster   |
|-------------------------|---------------|-------------|-------------|---------------|
```

Single operations are ~3.5x faster in Rust, but bulk operations are ~2.2x faster in Node.js, possibly due to binding overhead.

## Project Structure

- `src/lib.rs` - Rust implementation
- `benchmark.js` - Benchmark script
- `sample.json` - Test data
- `build/` - Compiled output


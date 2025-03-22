#!/bin/bash
set -e

echo "Building WASM module with custom manifest..."

# Create required directories
mkdir -p wasm/web
mkdir -p wasm-build/src

# Ensure we're using the cargo from PATH
export PATH="$HOME/.cargo/bin:$PATH"
export RUSTUP_TOOLCHAIN="stable"

# Verify which rustc we're using
which rustc
rustc --version
echo "Checking for wasm32 target:"
rustc --print target-list | grep wasm32-unknown-unknown

# Copy our manifest to the build directory
echo "Setting up temporary build directory..."
cp wasm-build-manifest.toml wasm-build/Cargo.toml

# Create a simplified lib.rs for WASM
cat > wasm-build/src/lib.rs << 'EOF'
use serde_json::value::RawValue;
use wasm_bindgen::prelude::*;

// WASM bindings
#[wasm_bindgen]
pub fn wasm_parse_json_serde(json_str: &str) -> String {
    match serde_json::from_str::<&RawValue>(json_str) {
        Ok(_) => json_str.to_string(),
        Err(e) => format!("Invalid JSON: {}", e)
    }
}

#[wasm_bindgen]
pub fn wasm_parse_json_simd(json_str: &str) -> String {
    // For WASM we use serde_json for both functions
    match serde_json::from_str::<&RawValue>(json_str) {
        Ok(_) => json_str.to_string(),
        Err(e) => format!("Invalid JSON: {}", e)
    }
}
EOF

# Build using the special manifest
echo "Building WASM module..."
cd wasm-build
cargo build --release --target wasm32-unknown-unknown

# Generate JavaScript bindings using wasm-bindgen-cli
echo "Generating JavaScript bindings..."
wasm-bindgen --target web --out-dir ../wasm/web target/wasm32-unknown-unknown/release/json_parser_neon.wasm

# Go back to project root
cd ..

echo "WASM build complete!"
echo "Output files are in wasm/web/" 
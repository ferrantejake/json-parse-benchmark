#!/bin/bash
set -e

# Install wasm-pack if not available
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Check if rustup is available
if command -v rustup &> /dev/null; then
    echo "Adding wasm32-unknown-unknown target using rustup..."
    rustup target add wasm32-unknown-unknown
else
    echo "Rustup not found - attempting manual build."
    echo "You may need to manually install the wasm32-unknown-unknown target."
    echo "See https://rustwasm.github.io/wasm-pack/book/prerequisites/non-rustup-setups.html"
fi

# Create directory for WASM files
mkdir -p wasm
mkdir -p wasm/web

# Build WASM for web
echo "Building WASM for web target..."
wasm-pack build --target web --out-dir wasm/web -- --features wasm

echo "WASM build complete!"
echo "Output files can be found in ./wasm/web directory" 
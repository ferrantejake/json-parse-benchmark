#[macro_use]
extern crate napi_derive;

use serde_json::value::RawValue;

// Conditionally include wasm-bindgen when targeting wasm
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

// NAPI bindings for Node.js
#[napi]
pub fn parse_json(json_str: String) -> String {
    // Use serde_json as it's proven to be the fastest
    match serde_json::from_str::<&RawValue>(&json_str) {
        Ok(_) => json_str,
        Err(e) => format!("Invalid JSON: {}", e)
    }
}

#[napi]
pub fn parse_json_serde(json_str: String) -> String {
    match serde_json::from_str::<&RawValue>(&json_str) {
        Ok(_) => json_str,
        Err(e) => format!("Invalid JSON: {}", e)
    }
}

// Only include simd-json for non-wasm targets
#[cfg(not(target_arch = "wasm32"))]
#[napi]
pub fn parse_json_simd(json_str: String) -> String {
    // Create a mutable copy as simd-json requires a mutable buffer
    let mut json_data = json_str.clone().into_bytes();
    
    match simd_json::to_owned_value(&mut json_data) {
        Ok(_) => json_str,
        Err(e) => format!("Invalid JSON: {}", e)
    }
}

// For wasm32, provide a fallback that uses serde_json
#[cfg(target_arch = "wasm32")]
#[napi]
pub fn parse_json_simd(json_str: String) -> String {
    // Fallback to serde_json for WASM since simd-json is not supported
    match serde_json::from_str::<&RawValue>(&json_str) {
        Ok(_) => json_str,
        Err(e) => format!("Invalid JSON: {}", e)
    }
}

// WASM bindings
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn wasm_parse_json_serde(json_str: &str) -> String {
    match serde_json::from_str::<&RawValue>(json_str) {
        Ok(_) => json_str.to_string(),
        Err(e) => format!("Invalid JSON: {}", e)
    }
}

// For wasm32, the SIMD binding also uses serde_json
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn wasm_parse_json_simd(json_str: &str) -> String {
    // Fallback to serde_json for WASM since simd-json is not supported
    match serde_json::from_str::<&RawValue>(json_str) {
        Ok(_) => json_str.to_string(),
        Err(e) => format!("Invalid JSON: {}", e)
    }
}

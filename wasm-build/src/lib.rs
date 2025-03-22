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

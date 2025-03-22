#[macro_use]
extern crate napi_derive;

use serde_json::value::RawValue;

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

#[napi]
pub fn parse_json_simd(json_str: String) -> String {
    // Create a mutable copy as simd-json requires a mutable buffer
    let mut json_data = json_str.clone().into_bytes();
    
    match simd_json::to_owned_value(&mut json_data) {
        Ok(_) => json_str,
        Err(e) => format!("Invalid JSON: {}", e)
    }
}

#[macro_use]
extern crate napi_derive;

use napi::{
    bindgen_prelude::*,
    JsString,
};
use serde_json::value::RawValue;

#[napi(js_name = "parseJson")]
pub fn parse_json(_env: Env, json_str: JsString) -> Result<JsString> {
    // Get string content
    let utf8 = json_str.into_utf8()?;
    let str_ref = utf8.as_str()?;
    
    // Use RawValue for zero-copy validation
    match serde_json::from_str::<&RawValue>(str_ref) {
        Ok(_) => Ok(json_str),  // Return original string if valid
        Err(e) => Err(Error::from_reason(e.to_string()))
    }
}

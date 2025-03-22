#[macro_use]
extern crate napi_derive;

use napi::{
    bindgen_prelude::*,
    JsString,
};

#[napi(js_name = "parseJson")]
pub fn parse_json(env: Env, json_str: JsString) -> Result<JsString> {
    // Get the string content
    let utf8 = json_str.into_utf8()?;
    let json_str = utf8.as_str()?;
    
    // Parse and validate JSON without converting to Value
    serde_json::from_str::<serde_json::Value>(json_str)
        .map(|_| env.create_string(json_str).unwrap())
        .map_err(|e| Error::from_reason(e.to_string()))
}

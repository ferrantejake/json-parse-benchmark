use napi_derive::napi;
use napi::Result;
use serde_json::Value;

#[napi]
pub fn parse_json(json_str: String) -> Result<String> {
    match serde_json::from_str::<Value>(&json_str) {
        Ok(value) => Ok(value.to_string()),
        Err(e) => Err(napi::Error::from_reason(e.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = parse_json(String::from("{\"test\": 123}"));
        assert!(result.is_ok());
    }
} 
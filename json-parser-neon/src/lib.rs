use neon::prelude::*;
use serde_json::Value;
use std::borrow::Cow;

fn parse_json(mut cx: FunctionContext) -> JsResult<JsString> {
    let json_str = cx.argument::<JsString>(0)?.value(&mut cx);
    match serde_json::from_str::<Value>(&json_str) {
        Ok(value) => {
            // Use a pre-allocated buffer for better performance
            let mut buffer = String::with_capacity(json_str.len());
            serde_json::to_writer(std::io::Write::by_ref(&mut buffer), &value)
                .map_err(|e| cx.throw_error(e.to_string()))?;
            Ok(cx.string(buffer))
        }
        Err(e) => cx.throw_error(e.to_string())
    }
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("parse_json", parse_json)?;
    Ok(())
}

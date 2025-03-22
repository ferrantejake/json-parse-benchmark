use neon::prelude::*;
use serde_json::Value;

fn parse_json(mut cx: FunctionContext) -> JsResult<JsString> {
    let json_str = cx.argument::<JsString>(0)?.value(&mut cx);
    
    match serde_json::from_str::<Value>(&json_str) {
        Ok(value) => {
            match serde_json::to_string_pretty(&value) {
                Ok(result) => Ok(cx.string(result)),
                Err(e) => cx.throw_error(e.to_string())
            }
        },
        Err(e) => cx.throw_error(e.to_string())
    }
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("parse_json", parse_json)?;
    Ok(())
}

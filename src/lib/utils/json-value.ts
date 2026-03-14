interface JSONObject {
  [x: string]: JSONValue | undefined
}

interface JSONArray extends Array<JSONValue> {}
type JSONValue = null | string | number | boolean | JSONObject | JSONArray

export type { JSONArray, JSONObject, JSONValue }

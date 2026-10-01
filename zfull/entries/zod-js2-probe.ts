import "../shims/dom-globals.js";
import { object, string, number, union, literal, array } from "zod-js";

/* Variant B of the zod-js probe: named-import form instead of the `z`
 * namespace member access. The A/B pair pinpoints whether the `any`
 * inference comes from namespace-member access or from the function
 * surface itself. */
export function zod_js2_probe_parse(): string {
  const S = object({ name: string(), age: number() });
  const ok = S.safeParse({ name: "zcode", age: 7 });
  const bad = S.safeParse({ name: 5, age: -1 });
  let out = "ok:" + (ok.success ? ok.data.name + "/" + ok.data.age : "FAIL");
  out += ";bad:" + (bad.success ? "FAIL" : "rejected");
  return out;
}

export function zod_js2_probe_union(): string {
  const U = union([literal("a"), literal("b")]);
  const A = array(U);
  const r = A.safeParse(["a", "b"]);
  return "union:" + (r.success ? r.data.join("") : "FAIL");
}
import "../shims/dom-globals.js";
import { z } from "zod-js";

/* Same probes as zod-probe.ts but through the pure-JS (inference) copy of
 * zod's shipped ESM dist. Runs side by side in lib-matrix for a direct
 * error-surface comparison against the TS-source route. */
export function zod_js_probe_parse(): string {
  const S = z.object({ name: z.string(), age: z.number() });
  const ok = S.safeParse({ name: "zcode", age: 7 });
  const bad = S.safeParse({ name: 5, age: -1 });
  let out = "ok:" + (ok.success ? ok.data.name + "/" + ok.data.age : "FAIL");
  out += ";bad:" + (bad.success ? "FAIL" : "rejected");
  return out;
}

export function zod_js_probe_union(): string {
  const U = z.union([z.literal("a"), z.literal("b")]);
  const A = z.array(U);
  const r = A.safeParse(["a", "b"]);
  return "union:" + (r.success ? r.data.join("") : "FAIL");
}
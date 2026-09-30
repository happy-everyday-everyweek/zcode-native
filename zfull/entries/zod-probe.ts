import "../shims/dom-globals.js";
import { z } from "zod";

/* Probe entry for the zod static-compilation experiments. Covers the
 * classic zod surface ZCode leans on: object/string/number schemas,
 * literals, unions, arrays, safeParse. */
export function zod_probe_parse(): string {
  const S = z.object({ name: z.string(), age: z.number() });
  const ok = S.safeParse({ name: "zcode", age: 7 });
  const bad = S.safeParse({ name: 5, age: -1 });
  let out = "ok:" + (ok.success ? ok.data.name + "/" + ok.data.age : "FAIL");
  out += ";bad:" + (bad.success ? "FAIL" : "rejected");
  return out;
}

export function zod_probe_union(): string {
  const U = z.union([z.literal("a"), z.literal("b")]);
  const A = z.array(U);
  const r = A.safeParse(["a", "b"]);
  return "union:" + (r.success ? r.data.join("") : "FAIL");
}
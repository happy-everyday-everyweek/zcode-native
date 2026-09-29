import "../shims/dom-globals.js";
import { Emitter, DisposableStore, Event } from "@zcode/rpc";

/* Probe entry for the rpc package: a tiny, deterministic surface that
 * exercises the modified collection semantics and gives the native
 * archive real ABI symbols to export. */

export function rpc_probe_emitter(): string {
  let out = "";
  const e = new Emitter<number>();
  const d = e.event((n) => {
    out += "x" + n;
  });
  e.fire(1);
  d.dispose();
  e.fire(2);
  return out;
}

export function rpc_probe_store(): string {
  const order: string[] = [];
  const store = new DisposableStore();
  const a = { dispose: () => { order.push("a"); } };
  const b = { dispose: () => { order.push("b"); } };
  store.add(a);
  store.add(a);
  store.add(b);
  store.dispose();
  return order.join(",");
}

export function rpc_probe_once(): string {
  const e = new Emitter<string>();
  const rec: string[] = [];
  Event.once(e.event)((s) => {
    rec.push("once:" + s);
  });
  e.fire("a");
  e.fire("b");
  return rec.join(",");
}
// scriptc 无 lowering 的标准库助手（原生环境下的同义实现）。
export function isArray(v: any): boolean {
  return typeof v === "object" && v !== null && typeof v.length === "number" && typeof v.slice === "function";
}

export function hasOwnKey(o: any, k: string): boolean {
  if (o === null || o === undefined) return false;
  return Object.prototype.hasOwnProperty.call(o, k);
}

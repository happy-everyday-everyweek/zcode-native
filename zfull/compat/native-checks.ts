// scriptc 无 lowering 的标准库助手（原生环境下的同义实现）。
export function isArray(v: any): boolean {
  return typeof v === "object" && v !== null && typeof v.length === "number" && typeof v.slice === "function";
}

export function hasOwnKey(o: any, k: string): boolean {
  if (o === null || o === undefined) return false;
  return Object.prototype.hasOwnProperty.call(o, k);
}

/** Object.is 的等价实现（scriptc 没有 Object.is 的 lowering）。 */
export function sameValue(a: any, b: any): boolean {
  if (a === b) return true;
  // NaN === NaN 为假，Object.is 为真；JSON 值域内只有这一处差异需要保住。
  if (typeof a === "number" && typeof b === "number" && a !== a && b !== b) return true;
  return false;
}

// scriptc 无 lowering 的标准库助手（原生环境下的同义实现）。
export function isArray(v: any): v is any[] {
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

/**
 * Object.freeze 的替身：原生侧没有对象冻结语义，取值恒等。
 * 之所以保留成**调用**形态而不是直接把 `Object.freeze(` 换成 `(`：
 * 调用参数允许尾逗号，而 `(x,)` 是语法错误，直接换括号会制造非法语法。
 */
export function identityOf(v: any): any {
  return v;
}

/** 索引签名对象的「删掉某个键后复制」——替掉 rest 解构
 *  (`const { k: _k, ...rest } = rec`)，scriptc 不支持在索引签名上做 rest 绑定。 */
export function omitKey<T>(rec: Record<string, T>, key: string): Record<string, T> {
  const out: Record<string, T> = {};
  for (const k of Object.keys(rec)) {
    if (k !== key) {
      out[k] = rec[k];
    }
  }
  return out;
}

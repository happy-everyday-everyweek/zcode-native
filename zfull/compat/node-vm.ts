// 原生构建没有 V8 虚拟机：这里提供编译期占位，运行时调用会明确失败。
export type Context = any;

export function createContext(sandbox?: any): any {
  return sandbox === undefined || sandbox === null ? {} : sandbox;
}

export function runInContext(code: string, context: any, options?: any): any {
  throw new Error("node:vm is not available in the native build");
}

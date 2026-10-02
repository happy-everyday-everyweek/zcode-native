// 原生构建没有 node:sqlite：编译期占位，运行时调用会明确失败。
export class DatabaseSync {
  constructor(path?: any) {
    throw new Error("node:sqlite is not available in the native build");
  }
  prepare(sql: any): any {
    throw new Error("node:sqlite is not available in the native build");
  }
  exec(sql: any): any {
    throw new Error("node:sqlite is not available in the native build");
  }
  close(): void {
    throw new Error("node:sqlite is not available in the native build");
  }
}

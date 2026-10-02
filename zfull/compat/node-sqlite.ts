// 原生构建没有 node:sqlite：编译期占位，运行时调用会明确失败。
// 说明符在 ZCode 侧被改写为 `@zcode/node-sqlite`（scriptc 拒绝 `node:` 前缀的内建模块）。
export type SQLInputValue = any;
export type SQLOutputValue = any;

export class StatementSync {
  constructor(..._args: any[]) {
    throw new Error("node:sqlite is not available in the native build");
  }
}

export class DatabaseSync {
  /** 与 node:sqlite 的 DatabaseSync 同名成员，保持调用点类型可编译。 */
  isTransaction: boolean = false;

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

// 微探针：Map<string, () => ...> / 数组存闭包 / 记录存闭包 的当前本地诊断。
type Provider = () => Record<string, number>;

export function mapOfFunc(): number {
  const providers = new Map<string, Provider>();
  providers.set("a", (): Record<string, number> => ({ a: 1 }));
  return providers.size;
}

export function arrayOfFunc(): number {
  const providers: Provider[] = [];
  providers.push((): Record<string, number> => ({ a: 1 }));
  return providers.length;
}

export function arrayOfRecordWithFunc(): number {
  const entries: { name: string; provider: Provider }[] = [];
  entries.push({ name: "a", provider: (): Record<string, number> => ({ a: 1 }) });
  return entries.length;
}

export function recordOfFunc(): number {
  const providers: Record<string, Provider> = {};
  providers["a"] = (): Record<string, number> => ({ a: 1 });
  return providers["a"] === undefined ? 0 : 1;
}

// 顶层调用保证四个函数体都被 lowering（未可达的函数会被剪枝）。
export function main(): number {
  return mapOfFunc() + arrayOfFunc() + arrayOfRecordWithFunc() + recordOfFunc();
}

main();

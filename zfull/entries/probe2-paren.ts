// 探针 2：缩小「Expression expected」的最小触发条件
interface Model { modelId: string }

const models: Model[] = [{ modelId: "a" }];

// v1 箭头体括号对象，无尾逗号，无外层括号
export function v1(): any {
  const a = models.map((m) => ({ id: m.modelId }));
  return a;
}

// v2 外层括号，无尾逗号
export function v2(): any {
  const b = (models.map((m) => ({ id: m.modelId })));
  return b;
}

// v3 尾逗号，无外层括号
export function v3(): any {
  const c = models.map((m) => ({ id: m.modelId }), );
  return c;
}

// v4 多行 + 尾逗号
export function v4(): any {
  const d = models.map((m) =>
    ({ id: m.modelId }),
  );
  return d;
}

// v5 多行 + 尾逗号 + 外层括号
export function v5(): any {
  const e = (
    models.map((m) =>
      ({ id: m.modelId }),
    ),
  );
  return e;
}
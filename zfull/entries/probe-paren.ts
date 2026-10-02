// 探针：验证 scriptc 对以下三种写法的接受度（b24 把 Object.freeze(x) 换成 (x) 后出现的报错是否由此而来）
interface Model { modelId: string }
interface Provider { models: Model[] }

const providers: Provider[] = [{ models: [{ modelId: "a" }] }];

// 形式 1：箭头函数体是裸括号对象（b24 之后 registry.ts 的写法）
export function form1(): any {
  const out = providers.map((provider) => {
    return {
      models: (
        provider.models.map((model) =>
          ({ modelId: model.modelId }),
        ),
      ),
    };
  });
  return out;
}

// 形式 2：箭头函数体是括号对象（无外层对象属性）
export function form2(): any {
  const out = providers.map((p) => ({ models: p.models }));
  return out;
}

// 形式 3：普通对象属性值为括号表达式
export function form3(): any {
  const models = providers[0].models;
  const out = { id: "x", models: (models) };
  return out;
}

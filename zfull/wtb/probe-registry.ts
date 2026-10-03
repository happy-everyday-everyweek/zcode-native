// 微探针 v2：memoryDiagnostics 计划改法（索引签名记录 + recordKeys）的可编译性。
type Provider = () => Record<string, number>;

function recordKeys<T>(rec: Record<string, T>): string[] {
  return Object.keys(rec);
}

interface Registry {
  register(name: string, provider: Provider): { dispose(): void };
  collect(): Record<string, number>;
}

export function createRegistry(): Registry {
  const providers: Record<string, Provider> = {};
  return {
    register(name, provider) {
      providers[name] = provider;
      return {
        dispose() {
          if (providers[name] === provider) {
            delete providers[name];
          }
        },
      };
    },
    collect() {
      const result: Record<string, number> = {};
      const keysOf: Record<string, unknown> = providers;
      for (const name of recordKeys(keysOf)) {
        const provider = providers[name]!;
        try {
          for (const [key, value] of Object.entries(provider())) {
            if (typeof value === "number" && Number.isFinite(value)) {
              result[`${name}.${key}`] = value;
            }
          }
        } catch {
          // probe
        }
      }
      return result;
    },
  };
}

export function main(): number {
  const registry = createRegistry();
  const handle = registry.register("probe", (): Record<string, number> => ({ count: 1 }));
  const collected = registry.collect();
  handle.dispose();
  return collected["probe.count"] === undefined ? -1 : 1;
}

main();

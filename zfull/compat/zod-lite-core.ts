// ============================================================
// zod-lite-core.ts
// A minimal, scriptc-friendly reimplementation of the `zod` surface
// used by ZCode: runtime validation, coercion and light transforms.
// Behavior (messages, issue shapes, semantics) is aligned with the
// reference baseline captured from zod 4.6.5 (zcheck/zref).
// ============================================================

// ---------- public types ----------

export interface ZodIssue {
  code: string;
  message: string;
  path: (string | number)[];
  expected?: string;
  received?: string;
  origin?: string;
  minimum?: number;
  maximum?: number;
  inclusive?: boolean;
  values?: unknown[];
  keys?: string[];
  errors?: ZodIssue[][];
  note?: string;
  discriminator?: string;
  options?: string[];
  format?: string;
  pattern?: string;
  params?: any;
}

export interface RefineOpts {
  message?: string;
  path?: (string | number)[];
  params?: any;
}

export interface IssueInput {
  code?: string;
  message?: string;
  path?: (string | number)[];
  expected?: string;
  received?: string;
  origin?: string;
  minimum?: number;
  maximum?: number;
  inclusive?: boolean;
  exact?: boolean;
  divisor?: number;
  values?: unknown[];
  keys?: string[];
  format?: string;
  pattern?: string;
  params?: any;
  prefix?: string;
  suffix?: string;
  note?: string;
  discriminator?: string;
  options?: string[];
  errors?: ZodIssue[][];
}

export interface RefinementCtx {
  path: (string | number)[];
  addIssue(issue: IssueInput): void;
}

export interface ParseCtx {
  path: (string | number)[];
  issues: ZodIssue[];
}

export type ZodTypeAny = ZodType;
export type ZodOptional<T extends ZodType = ZodType> = ZodType<T["_output"] | undefined>;
export type ZodNullable<T extends ZodType = ZodType> = ZodType<T["_output"] | null>;
export type ZodDefault<T extends ZodType = ZodType> = ZodType<T["_output"]>;
export type ZodCatch<T extends ZodType = ZodType> = ZodType<T["_output"]>;
export type ZodEffects<T extends ZodType = ZodType, O = T["_output"], I = unknown> = ZodType<O>;
export type ZodTransform = ZodType<any>;
export type ZodPipe<A extends ZodType = ZodType, B extends ZodType = ZodType> = ZodType<B["_output"]>;
export type ZodNonOptional<T extends ZodType = ZodType> = ZodType<T["_output"]>;
export type ZodObject<T extends ZodRawShape = ZodRawShape> = ZodType<any>;
export type ZodArray<T extends ZodType = ZodType> = ZodType<T["_output"][]>;
export type ZodRecord<V extends ZodType = ZodType> = ZodType<Record<string, V["_output"]>>;
export type ZodUnion<T extends readonly ZodType[] = readonly ZodType[]> = ZodType<T[number]["_output"]>;
export type ZodDiscriminatedUnion = ZodType<any>;
export type ZodEnum<T extends readonly string[] = readonly string[]> = ZodType<T[number]>;
export type ZodLiteral<T extends string | number | boolean = string> = ZodType<T>;
export type ZodParsedType = string;
export const ZodFirstPartyTypeKind = {
  ZodString: "ZodString",
  ZodNumber: "ZodNumber",
  ZodBoolean: "ZodBoolean",
  ZodBigInt: "ZodBigInt",
  ZodDate: "ZodDate",
  ZodSymbol: "ZodSymbol",
  ZodUndefined: "ZodUndefined",
  ZodNull: "ZodNull",
  ZodAny: "ZodAny",
  ZodUnknown: "ZodUnknown",
  ZodNever: "ZodNever",
  ZodVoid: "ZodVoid",
  ZodArray: "ZodArray",
  ZodObject: "ZodObject",
  ZodUnion: "ZodUnion",
  ZodDiscriminatedUnion: "ZodDiscriminatedUnion",
  ZodIntersection: "ZodIntersection",
  ZodTuple: "ZodTuple",
  ZodRecord: "ZodRecord",
  ZodMap: "ZodMap",
  ZodSet: "ZodSet",
  ZodFunction: "ZodFunction",
  ZodLazy: "ZodLazy",
  ZodLiteral: "ZodLiteral",
  ZodEnum: "ZodEnum",
  ZodEffects: "ZodEffects",
  ZodNativeEnum: "ZodNativeEnum",
  ZodOptional: "ZodOptional",
  ZodNullable: "ZodNullable",
  ZodDefault: "ZodDefault",
  ZodCatch: "ZodCatch",
  ZodPromise: "ZodPromise",
  ZodBranded: "ZodBranded",
  ZodPipeline: "ZodPipeline",
  ZodReadonly: "ZodReadonly",
};

export type ZodRawShape = Record<string, ZBase>;
export type OutOf1<T extends ZodType> = T["_output"];
export type ShapeOut<T extends ZodRawShape> = { [K in keyof T]: unknown };



export type SafeParseSuccess<T> = { success: true; readonly data: T };
export type SafeParseError<T = unknown> = { success: false; error: ZodError; data?: T };
export type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseError<T>;

export type OutputOf<T extends ZodType> = T["_output"];
export type SafeParseSuccessOf<T extends ZodType> = { success: true; data: T["_output"] };
export type SafeParseResultOf<T extends ZodType> = SafeParseSuccessOf<T> | SafeParseError;

// ---------- internal helpers ----------

/** Array.isArray 在 scriptc 下无 lowering，用自实现的判定替代。 */
function isArrayLike(v: any): boolean {
  return typeof v === "object" && v !== null && typeof v.length === "number" && typeof v.slice === "function";
}

function isDateLikeValue(v: any): boolean {
  if (v === null || typeof v !== "object") return false;
  return typeof (v as any).getTime === "function";
}

function parsedType(v: any): string {
  const t = typeof v;
  if (t === "number") {
    const n: number = v as number;
    if (n !== n) return "NaN";
    return "number";
  }
  if (t === "string") return "string";
  if (t === "boolean") return "boolean";
  if (t === "function") return "function";
  if (t === "undefined") return "undefined";
  if (v === null) return "null";
  if (isArrayLike(v)) return "array";
  if (isDateLikeValue(v)) return "Date";
  return "object";
}

function failType(ctx: ParseCtx, expected: string, input: any): void {
  const r = parsedType(input);
  const message = "Invalid input: expected " + expected + ", received " + r;
  const path = ctx.path.slice();
  if (r === "NaN") {
    const nanIssue: ZodIssue = { expected: expected, code: "invalid_type", received: "NaN", path: path, message: message };
    ctx.issues.push(nanIssue);
  } else {
    const issue: ZodIssue = { expected: expected, code: "invalid_type", path: path, message: message };
    ctx.issues.push(issue);
  }
}

function failIssue(ctx: ParseCtx, make: () => ZodIssue): void {
  ctx.issues.push(make());
}

function refineMsg(message?: string | RefineOpts): string | undefined {
  if (message === undefined) {
    return undefined;
  }
  if (typeof message === "string") {
    return message;
  }
  const m = message.message;
  return m;
}

function childCtx(parent: ParseCtx, key: string | number): ParseCtx {
  const path = parent.path.slice();
  path.push(key);
  const c: ParseCtx = { path: path, issues: parent.issues };
  return c;
}

function isRecord(v: any): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !isArrayLike(v);
}

// Returns ok=true if schema parsed without producing issues.
function attempt(schema: ZBase, input: any, ctx: ParseCtx): { ok: boolean; value: unknown } {
  const sub: ZodIssue[] = [];
  const subCtx: ParseCtx = { path: ctx.path, issues: sub };
  const value = schema._parse(input, subCtx);
  if (sub.length === 0) {
    return { ok: true, value: value };
  }
  return { ok: false, value: undefined };
}

// ---------- issue codes ----------

export const ZodIssueCode = {
  invalid_type: "invalid_type",
  too_small: "too_small",
  too_big: "too_big",
  invalid_value: "invalid_value",
  invalid_format: "invalid_format",
  unrecognized_keys: "unrecognized_keys",
  invalid_union: "invalid_union",
  custom: "custom",
};

export type ZodIssueCode = string;

// ---------- error ----------

export class ZodError {
  name: string = "ZodError";
  message: string = "";
  issues: ZodIssue[];
  constructor(issues: ZodIssue[]) {
    this.name = "ZodError";
    this.issues = issues;
    const plain: unknown[] = issues;
    this.message = JSON.stringify(plain, null, 2);
  }
  get errors(): ZodIssue[] {
    return this.issues;
  }
  format(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const issue of this.issues) {
      let cursor = result;
      for (let i = 0; i < issue.path.length; i++) {
        const seg = String(issue.path[i]);
        let next = cursor[seg];
        if (!isRecord(next)) {
          const created: Record<string, unknown> = {};
          cursor[seg] = created;
          next = created;
        }
        cursor = next as Record<string, unknown>;
      }
      const bucket = cursor._errors;
      if (isArrayLike(bucket)) {
        (bucket as string[]).push(issue.message);
      } else {
        cursor._errors = [issue.message];
      }
    }
    return result;
  }
  flatten(): Record<string, unknown> {
    const formErrors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of this.issues) {
      if (issue.path.length === 0) {
        formErrors.push(issue.message);
      } else {
        const key = String(issue.path[0]);
        const arr = fieldErrors[key];
        if (arr === undefined) {
          fieldErrors[key] = [issue.message];
        } else {
          arr.push(issue.message);
        }
      }
    }
    return { formErrors: formErrors, fieldErrors: fieldErrors };
  }
}

// ---------- base type ----------

export class ZBase {
  _description?: string;
  _wrap: string = "";
  _innerIdx: number = -1;
  _fn: ((value: any, ctx: RefinementCtx) => unknown) | undefined = undefined;
  _value: string | number | boolean | null = null;
  _objIdx: number = -1;
  _msg: string | undefined = undefined;
  _checks2: ArrCheck[] = [];
  _strChecks: StrCheck[] = [];
  _numChecks: NumCheck[] = [];
  _shapeIdxs: Record<string, number> | undefined = undefined;
  _shapeObjs: Record<string, ZBase> = {};
  _unk: string = "";
  _optIdxs: number[] = [];
  _disc: string = "";
  _discVals: string[] = [];
  _discIdxs: number[] = [];
  _litVal: string = "";
  _litMap: Record<string, string> | undefined = undefined;

  get shape(): any {
    return this._shapeObjs;
  }

  _parse(input: any, ctx: ParseCtx): unknown {
    const w = this._wrap;
    if (w === "") {
      return input;
    }
    if (w === "optional") {
      if (input === undefined) return undefined;
      if (this._innerIdx < 0) return undefined;
      return schemaAt(this._innerIdx)._parse(input, ctx);
    }
    if (w === "nullable") {
      if (input === null) return null;
      if (this._innerIdx < 0) return undefined;
      return schemaAt(this._innerIdx)._parse(input, ctx);
    }
    if (w === "default") {
      if (input === undefined) return this._value;
      if (this._innerIdx < 0) return undefined;
      return schemaAt(this._innerIdx)._parse(input, ctx);
    }
    if (w === "catch") {
      const sub: ZodIssue[] = [];
      const subCtx: ParseCtx = { path: ctx.path, issues: sub };
      if (this._innerIdx < 0) return this._value;
      const v = schemaAt(this._innerIdx)._parse(input, subCtx);
      if (sub.length === 0) return v;
      return this._value;
    }
    if (w === "refine") {
      const before = ctx.issues.length;
      if (this._innerIdx < 0) return undefined;
      const value = schemaAt(this._innerIdx)._parse(input, ctx);
      if (ctx.issues.length > before) return undefined;
      const fn = this._fn;
      const ret = fn !== undefined ? fn(value, makeRefineCtx(ctx)) : true;
      if (ret === false) {
        const msg = this._msg !== undefined ? this._msg : "Invalid input";
        failIssue(ctx, () => {
          const issue: ZodIssue = { code: "custom", path: ctx.path.slice(), message: msg };
          return issue;
        });
        return undefined;
      }
      if (typeof ret === "string") {
        const msg2 = ret as string;
        failIssue(ctx, () => {
          const issue: ZodIssue = { code: "custom", path: ctx.path.slice(), message: msg2 };
          return issue;
        });
        return undefined;
      }
      return value;
    }
    if (w === "superRefine") {
      const before2 = ctx.issues.length;
      if (this._innerIdx < 0) return undefined;
      const value2 = schemaAt(this._innerIdx)._parse(input, ctx);
      if (ctx.issues.length > before2) return undefined;
      const fn2 = this._fn;
      if (fn2 !== undefined) {
        fn2(value2, makeRefineCtx(ctx));
      }
      return value2;
    }
    if (w === "transform") {
      const before3 = ctx.issues.length;
      if (this._innerIdx < 0) return undefined;
      const value3 = schemaAt(this._innerIdx)._parse(input, ctx);
      if (ctx.issues.length > before3) return undefined;
      const fn3 = this._fn;
      if (fn3 !== undefined) {
        return fn3(value3, makeRefineCtx(ctx));
      }
      return value3;
    }
    if (w === "pipe") {
      const before4 = ctx.issues.length;
      if (this._innerIdx < 0) return undefined;
      const value4 = schemaAt(this._innerIdx)._parse(input, ctx);
      if (ctx.issues.length > before4) return undefined;
      if (this._objIdx >= 0) {
        return schemaAt(this._objIdx)._parse(value4, ctx);
      }
      return value4;
    }
    if (w === "array") {
      if (this._innerIdx < 0) return undefined;
      const cks = this._checks2;
      return runArrayParse(this._innerIdx, cks, input, ctx);
    }
    if (w === "object") {
      const shape = this._shapeIdxs;
      if (shape === undefined || !isRecord(input)) {
        failType(ctx, "object", input);
        return undefined;
      }
      const out: Record<string, unknown> = {};
      const shapeKeys = Object.keys(shape);
      for (const key of shapeKeys) {
        const childIdx = shape[key];
        const hasKey = key in input;
        const val = input[key];
        const subCtx = childCtx(ctx, key);
        const before = ctx.issues.length;
        const parsed = schemaAt(childIdx)._parse(val, subCtx);
        const ok = ctx.issues.length === before;
        if (ok) {
          if (hasKey) {
            out[key] = parsed;
          } else if (parsed !== undefined) {
            out[key] = parsed;
          }
        }
      }
      if (this._unk === "strict") {
        const inputKeys = Object.keys(input);
        for (const k of inputKeys) {
          if (!(k in shape)) {
            const msg = "Unrecognized key: " + '"' + k + '"';
            failIssue(ctx, () => {
              const issue: ZodIssue = { code: "unrecognized_keys", keys: [k], path: ctx.path.slice(), message: msg };
              return issue;
            });
          }
        }
      } else if (this._unk === "passthrough") {
        const inputKeys = Object.keys(input);
        for (const k of inputKeys) {
          if (!(k in shape)) {
            out[k] = input[k];
          }
        }
      }
      return out;
    }
    if (w === "record") {
      if (!isRecord(input)) {
        failType(ctx, "record", input);
        return undefined;
      }
      if (this._innerIdx < 0) return undefined;
      const out2: Record<string, unknown> = {};
      const ks = Object.keys(input);
      for (const k of ks) {
        const subCtx2 = childCtx(ctx, k);
        const before2r = ctx.issues.length;
        const v2 = schemaAt(this._innerIdx)._parse(input[k], subCtx2);
        if (ctx.issues.length === before2r) {
          out2[k] = v2;
        }
      }
      return out2;
    }
    if (w === "partialRecord") {
      if (!isRecord(input)) {
        failType(ctx, "object", input);
        return undefined;
      }
      if (this._innerIdx < 0) return undefined;
      const out3: Record<string, unknown> = {};
      const ks2 = Object.keys(input);
      for (const k2 of ks2) {
        const subCtx3 = childCtx(ctx, k2);
        const v3 = schemaAt(this._innerIdx)._parse(input[k2], subCtx3);
        out3[k2] = v3;
      }
      return out3;
    }
    if (w === "union") {
      const errs: ZodIssue[][] = [];
      const optsU = this._optIdxs;
      for (let i = 0; i < optsU.length; i++) {
        const sub2: ZodIssue[] = [];
        const subCtxU: ParseCtx = { path: ctx.path, issues: sub2 };
        const vu = schemaAt(optsU[i])._parse(input, subCtxU);
        if (sub2.length === 0) {
          return vu;
        }
        errs.push(sub2);
      }
      failIssue(ctx, () => {
        const issue: ZodIssue = { code: "invalid_union", errors: errs, path: ctx.path.slice(), message: "Invalid input" };
        return issue;
      });
      return undefined;
    }
    if (w === "du") {
      if (!isRecord(input)) {
        failType(ctx, "object", input);
        return undefined;
      }
      const disc = this._disc;
      const dv = String(input[disc]);
      const vals = this._discVals;
      const fns = this._discIdxs;
      for (let i2 = 0; i2 < vals.length; i2++) {
        if (vals[i2] === dv) {
          const beforeD = ctx.issues.length;
          const vd = schemaAt(fns[i2])._parse(input, ctx);
          const okD = ctx.issues.length === beforeD;
          if (okD) {
            return vd;
          }
          return undefined;
        }
      }
      const msgD = "Invalid discriminator value. Expected " + formatOptions(vals);
      const pathD = ctx.path.slice();
      pathD.push(disc);
      failIssue(ctx, () => {
        const issue: ZodIssue = { code: "invalid_union", errors: [], note: "No matching discriminator", discriminator: disc, options: vals, path: pathD, message: msgD };
        return issue;
      });
      return undefined;
    }
    if (w === "string") {
      return runStringParse(this, coerceIf(this, input), ctx);
    }
    if (w === "number") {
      return runNumberParse(this, coerceIf(this, input), ctx);
    }
    if (w === "boolean") {
      return runBooleanParse(this, coerceIf(this, input), ctx);
    }
    if (w === "unknown") {
      return runUnknownParse(this, coerceIf(this, input), ctx);
    }
    if (w === "never") {
      return runNeverParse(this, coerceIf(this, input), ctx);
    }
    if (w === "undefined") {
      return runUndefinedParse(this, coerceIf(this, input), ctx);
    }
    if (w === "date") {
      return runDateParse(this, coerceIf(this, input), ctx);
    }
    if (w === "nullish") {
      if (input === undefined) return undefined;
      if (input === null) return null;
      if (this._innerIdx < 0) return undefined;
      return schemaAt(this._innerIdx)._parse(input, ctx);
    }
    if (w === "literal") {
      const litVal = this._value;
      if (litVal !== null && !sameLiteral(litVal, input)) {
        const msgL = "Invalid input: expected " + this._litVal;
        failIssue(ctx, () => {
          const valsL: unknown[] = [litVal];
          const issue: ZodIssue = { code: "invalid_value", values: valsL, path: ctx.path.slice(), message: msgL };
          return issue;
        });
        return undefined;
      }
      return input;
    }
    if (w === "enum") {
      const valsE = this._discVals;
      if (typeof input === "string") {
        for (let iE = 0; iE < valsE.length; iE++) {
          if (valsE[iE] === input) return input;
        }
      }
      const msgE = this._msg !== undefined ? this._msg : "Invalid option";
      failIssue(ctx, () => {
        const valuesE: unknown[] = [];
        for (let jE = 0; jE < valsE.length; jE++) {
          valuesE.push(valsE[jE]);
        }
        const issue: ZodIssue = { code: "invalid_value", values: valuesE, path: ctx.path.slice(), message: msgE };
        return issue;
      });
      return undefined;
    }
    if (w === "preprocess") {
      const fn4 = this._fn;
      const pre = fn4 !== undefined ? fn4(input, makeRefineCtx(ctx)) : input;
      if (this._innerIdx < 0) return undefined;
      return schemaAt(this._innerIdx)._parse(pre, ctx);
    }
    return input;
  }
}

export class ZodType<O = any> extends ZBase {
  get _output(): O {
    throw new Error("phantom");
  }
  get _input(): O {
    throw new Error("phantom");
  }
  parse(input: any): O {
    const r = this.safeParse(input);
    if (r.success) {
      return r.data;
    }
    throw r.error;
  }

  safeParse(input: any): SafeParseResult<O> {
    const issues: ZodIssue[] = [];
    const ctx: ParseCtx = { path: [], issues: issues };
    const value = this._parse(input, ctx);
    if (issues.length > 0) {
      return { success: false, error: new ZodError(issues) };
    }
    return { success: true, data: value as O };
  }


  optional(): ZodType<any> {
    const w = new ZodType<O>();
    w._wrap = "optional";
    w._innerIdx = registerSchema(this);
    return castTo<ZodType<any>>(w);
  }

  nullable(): ZodType<any> {
    const w = new ZodType<O>();
    w._wrap = "nullable";
    w._innerIdx = registerSchema(this);
    return castTo<ZodType<any>>(w);
  }

  array(): ZodType<O> {
    const w = new ZodType<O>();
    w._wrap = "array";
    w._innerIdx = registerSchema(this);
    return w;
  }

  default(value: O | null | undefined): ZodType<O> {
    const w = new ZodType<O>();
    w._wrap = "default";
    w._innerIdx = registerSchema(this);
    w._value = primOf(value);
    return w;
  }

  catch(value: O | null | undefined): ZodType<O> {
    const w = new ZodType<O>();
    w._wrap = "catch";
    w._innerIdx = registerSchema(this);
    w._value = primOf(value);
    return w;
  }

  describe(text: string): this {
    this._description = text;
    return this;
  }

  refine(fn: (value: any, ctx: RefinementCtx) => unknown, message?: string | RefineOpts): ZodType<O> {
    const w = new ZodType<O>();
    w._wrap = "refine";
    w._innerIdx = registerSchema(this);
    w._fn = makeFn(fn);
    w._msg = refineMsg(message);
    return w;
  }

  superRefine(fn: (value: any, ctx: RefinementCtx) => unknown): ZodType<O> {
    const w = new ZodType<O>();
    w._wrap = "superRefine";
    w._innerIdx = registerSchema(this);
    w._fn = makeFn(fn);
    return w;
  }

  transform(fn: (value: any, ctx: RefinementCtx) => any): ZodType<any> {
    const w = new ZodType<any>();
    w._wrap = "transform";
    w._innerIdx = registerSchema(this);
    w._fn = makeFn(fn);
    return w;
  }

  pipe(target: ZBase): ZodType<any> {
    const w = new ZodType<any>();
    w._wrap = "pipe";
    w._innerIdx = registerSchema(this);
    w._objIdx = registerSchema(target);
    return w;
  }
  trim(): ZodType<O> {
    return this._addStr({ kind: "trim" });
  }
  toLowerCase(): ZodType<O> {
    return this._addStr({ kind: "lower" });
  }
  toUpperCase(): ZodType<O> {
    return this._addStr({ kind: "upper" });
  }
  regex(pattern: RegExp, message?: string): ZodType<O> {
    const text = "/" + pattern.source + "/";
    return this._addStr({ kind: "regex", pattern: pattern, patternText: text, message: message });
  }
  startsWith(prefix: string, message?: string): ZodType<O> {
    return this._addStr({ kind: "startsWith", prefix: prefix, message: message });
  }
  endsWith(suffix: string, message?: string): ZodType<O> {
    return this._addStr({ kind: "endsWith", suffix: suffix, message: message });
  }
  includes(chunk: string, message?: string): ZodType<O> {
    return this._addStr({ kind: "includes", chunk: chunk, message: message });
  }
  email(message?: string): ZodType<O> {
    return this._addStr({ kind: "email", message: message });
  }
  url(message?: string): ZodType<O> {
    return this._addStr({ kind: "url", message: message });
  }
  uuid(message?: string): ZodType<O> {
    return this._addStr({ kind: "uuid", message: message });
  }
  gt(n: number, message?: string): ZodType<O> {
    return this._addNum({ kind: "gt", a: n, message: message });
  }
  gte(n: number, message?: string): ZodType<O> {
    return this._addNum({ kind: "min", a: n, message: message });
  }
  lt(n: number, message?: string): ZodType<O> {
    return this._addNum({ kind: "lt", a: n, message: message });
  }
  lte(n: number, message?: string): ZodType<O> {
    return this._addNum({ kind: "max", a: n, message: message });
  }
  int(message?: string): ZodType<O> {
    return this._addNum({ kind: "int", message: message });
  }
  positive(message?: string): ZodType<O> {
    return this._addNum({ kind: "gt", a: 0, message: message });
  }
  nonnegative(message?: string): ZodType<O> {
    return this._addNum({ kind: "min", a: 0, message: message });
  }
  negative(message?: string): ZodType<O> {
    return this._addNum({ kind: "lt", a: 0, message: message });
  }
  nonpositive(message?: string): ZodType<O> {
    return this._addNum({ kind: "max", a: 0, message: message });
  }
  multipleOf(n: number, message?: string): ZodType<O> {
    return this._addNum({ kind: "multipleOf", a: n, message: message });
  }
  step(n: number, message?: string): ZodType<O> {
    return this._addNum({ kind: "multipleOf", a: n, message: message });
  }
  finite(message?: string): ZodType<O> {
    return this._addNum({ kind: "finite", message: message });
  }
  safe(message?: string): ZodType<O> {
    return this._addNum({ kind: "safe", message: message });
  }

  cloneSelf(): ZodType<O> {
    const w = new ZodType<O>();
    copyState(this, w);
    return w;
  }

  _addStr(check: StrCheck): ZodType<O> {
    const w = this.cloneSelf();
    w._strChecks.push(check);
    return w;
  }

  _addNum(check: NumCheck): ZodType<O> {
    const w = this.cloneSelf();
    w._numChecks.push(check);
    return w;
  }
  _addArr(check: ArrCheck): ZodType<O> {
    const w = this.cloneSelf();
    w._checks2.push(check);
    return w;
  }

  min(n: number, message?: string): ZodType<O> {
    const b = this._wrap;
    if (b === "array") return this._addArr({ kind: "min", a: n, message: message });
    if (b === "number" || b === "date") return this._addNum({ kind: "min", a: n, message: message });
    return this._addStr({ kind: "min", a: n, message: message });
  }

  max(n: number, message?: string): ZodType<O> {
    const b2 = this._wrap;
    if (b2 === "array") return this._addArr({ kind: "max", a: n, message: message });
    if (b2 === "number" || b2 === "date") return this._addNum({ kind: "max", a: n, message: message });
    return this._addStr({ kind: "max", a: n, message: message });
  }

  length(n: number, message?: string): ZodType<O> {
    const b3 = this._wrap;
    if (b3 === "array") return this._addArr({ kind: "length", a: n, message: message });
    return this._addStr({ kind: "length", a: n, message: message });
  }

  nonempty(message?: string): ZodType<O> {
    return this.min(1, message);
  }



  get options(): string[] {
    return this._discVals;
  }

  exclude(values: string[]): ZodType<any> {
    const w = this.cloneSelf();
    const keep: string[] = [];
    for (let i = 0; i < w._discVals.length; i++) {
      const v = w._discVals[i];
      let drop = false;
      for (let j = 0; j < values.length; j++) {
        if (values[j] === v) drop = true;
      }
      if (!drop) keep.push(v);
    }
    w._discVals = keep;
    return castTo<ZodType<any>>(w);
  }

  nullish(): ZodType<O> {
    const w = new ZodType<O>();
    w._wrap = "nullish";
    w._innerIdx = registerSchema(this);
    return w;
  }

  datetime(message?: string): ZodType<O> {
    return this._addStr({ kind: "datetime", message: message });
  }

  readonly(): ZodType<O> {
    return this.cloneSelf();
  }

  pick(keys: readonly string[] | Record<string, boolean>): ZodType<O> {
    const w = this.cloneSelf();
    const ks = keysList(keys);
    w._shapeIdxs = pickShape(this._shapeIdxs, ks);
    w._litMap = pickLit(this._litMap, ks);
    w._shapeObjs = pickObjs(this._shapeObjs, ks);
    return w;
  }

  omit(keys: readonly string[] | Record<string, boolean>): ZodType<O> {
    const w = this.cloneSelf();
    const ks = keysList(keys);
    w._shapeIdxs = omitShape(this._shapeIdxs, ks);
    w._litMap = omitLit(this._litMap, ks);
    w._shapeObjs = omitObjs(this._shapeObjs, ks);
    return w;
  }

  extract(values: string[]): ZodType<any> {
    const w = this.cloneSelf();
    const keep: string[] = [];
    for (let i = 0; i < w._discVals.length; i++) {
      const v = w._discVals[i];
      let hit = false;
      for (let j = 0; j < values.length; j++) {
        if (values[j] === v) hit = true;
      }
      if (hit) keep.push(v);
    }
    w._discVals = keep;
    w._msg = enumMessage(keep);
    return castTo<ZodType<any>>(w);
  }

  keyof(): ZodType<string> {
    return keyofNode(this);
  }

  partial(): ZodType<O> {
    const w = this.cloneSelf();
    const src = this._shapeIdxs;
    if (src === undefined) return w;
    const ks = Object.keys(src);
    const idxs: Record<string, number> = {};
    for (const k of ks) {
      const ci = src[k];
      if (ci === undefined) continue;
      const opt = new ZodType<unknown>();
      opt._wrap = "optional";
      opt._innerIdx = ci;
      idxs[k] = regOne(opt);
    }
    w._shapeIdxs = idxs;
    return w;
  }

  strict(): ZodType<O> {
    const w = this.cloneSelf();
    w._unk = "strict";
    return w;
  }

  passthrough(): ZodType<O> {
    const w = this.cloneSelf();
    w._unk = "passthrough";
    return w;
  }

  catchall(schema: ZBase): ZodType<O> {
    const w = this.cloneSelf();
    w._unk = "catchall";
    w._innerIdx = registerSchema(schema);
    return w;
  }

  extend(shape: ZodRawShape): ZodType<any> {
    const w = new ZodType<any>();
    copyState(this, w);
    w._shapeIdxs = mergeShape(this._shapeIdxs, shapeIdxsOf(shape));
    w._litMap = mergeLit(this._litMap, litMapOf(shape));
    w._shapeObjs = mergeObjs(this._shapeObjs, copyShapeObjs(shape));
    return w;
  }

  merge(other: ZBase): ZodType<O> {
    const w = new ZodType<O>();
    copyState(this, w);
    const o = other;
    w._shapeIdxs = mergeShape(this._shapeIdxs, o._shapeIdxs);
    w._litMap = mergeLit(this._litMap, o._litMap);
    w._shapeObjs = mergeObjs(this._shapeObjs, o._shapeObjs);
    return w;
  }

  strip(): ZodType<O> {
    const w = this.cloneSelf();
    w._unk = "";
    return w;
  }

}


function wrapIdx(src: ZBase, kind: string): ZBase {
  const w = new ZBase();
  w._wrap = kind;
  w._innerIdx = registerSchema(src);
  return w;
}

function extendNode(src: ZBase, shape: ZodRawShape): ZBase {
  const w = new ZBase();
  copyState(src, w);
  w._shapeIdxs = mergeShape(src._shapeIdxs, shapeIdxsOf(shape));
  w._litMap = mergeLit(src._litMap, litMapOf(shape));
  w._shapeObjs = mergeObjs(src._shapeObjs, copyShapeObjs(shape));
  return w;
}

export const ZodObject: (shape: ZodRawShape) => ZodType<any> = object;

const SCHEMA_MAP = new Map<number, ZBase>();
let SCHEMA_COUNT = 0;

function registerSchema(s: ZBase): number {
  const i = SCHEMA_COUNT;
  SCHEMA_MAP.set(i, s);
  SCHEMA_COUNT = i + 1;
  return i;
}

function litDisplay(v: string | number | boolean): string {
  if (typeof v === "string") return '"' + v + '"';
  return String(v);
}

function strArrOf(values: readonly string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < values.length; i++) {
    out.push(values[i]);
  }
  return out;
}

function enumMessage(opts: string[]): string {
  let joined = "";
  for (let i = 0; i < opts.length; i++) {
    if (i > 0) joined += "|";
    joined += '"' + opts[i] + '"';
  }
  return "Invalid option: expected one of " + joined;
}

function cloneChecks(src: StrCheck[]): StrCheck[] {
  const out: StrCheck[] = [];
  for (const c of src) out.push(c);
  return out;
}

function cloneNumChecks(src: NumCheck[]): NumCheck[] {
  const out: NumCheck[] = [];
  for (const c of src) out.push(c);
  return out;
}

function copyState(src: ZBase, dst: ZBase): void {
  dst._description = src._description;
  dst._wrap = src._wrap;
  dst._innerIdx = src._innerIdx;
  dst._fn = src._fn;
  dst._value = src._value;
  dst._objIdx = src._objIdx;
  dst._msg = src._msg;
  dst._checks2 = cloneNumChecks(src._checks2);
  dst._strChecks = cloneChecks(src._strChecks);
  dst._numChecks = cloneNumChecks(src._numChecks);
  dst._shapeIdxs = src._shapeIdxs;
  dst._shapeObjs = src._shapeObjs;
  dst._unk = src._unk;
  dst._optIdxs = src._optIdxs;
  dst._disc = src._disc;
  dst._discVals = src._discVals;
  dst._discIdxs = src._discIdxs;
  dst._litVal = src._litVal;
  dst._litMap = src._litMap;
}

function copyShapeObjs(shape: Record<string, ZBase>): Record<string, ZBase> {
  const out: Record<string, ZBase> = {};
  const ks = Object.keys(shape);
  for (const k of ks) {
    out[k] = shape[k];
  }
  return out;
}

function mergeObjs(a: Record<string, ZBase>, b: Record<string, ZBase>): Record<string, ZBase> {
  const out: Record<string, ZBase> = {};
  const ka = Object.keys(a);
  for (const k of ka) out[k] = a[k];
  const kb = Object.keys(b);
  for (const k2 of kb) out[k2] = b[k2];
  return out;
}

function keysOfMap(m: Record<string, boolean>): string[] {
  const ks = Object.keys(m);
  const out: string[] = [];
  for (const x of ks) out.push(x);
  return out;
}

function keysList(k: any): string[] {
  if (k !== null && k !== undefined && typeof k.length === "number") {
    const arr: readonly string[] = k;
    return strArrOf(arr);
  }
  const m: Record<string, boolean> = k;
  return keysOfMap(m);
}

function keyofNode(s: ZBase): ZodType<string> {
  const w = new ZodType<string>();
  w._wrap = "enum";
  const idxs = s._shapeIdxs;
  const vals: string[] = [];
  if (idxs !== undefined) {
    const ks = Object.keys(idxs);
    for (const k of ks) vals.push(k);
  }
  w._discVals = vals;
  w._msg = enumMessage(vals);
  return w;
}

function pickShape(a: Record<string, number> | undefined, keys: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  if (a === undefined) return out;
  for (const k of keys) {
    const v = a[k];
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function pickLit(a: Record<string, string> | undefined, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  if (a === undefined) return out;
  for (const k of keys) {
    const v = a[k];
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function pickObjs(a: Record<string, ZBase>, keys: readonly string[]): Record<string, ZBase> {
  const out: Record<string, ZBase> = {};
  for (const k of keys) {
    const v = a[k];
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function omitShape(a: Record<string, number> | undefined, keys: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  if (a === undefined) return out;
  const ks = Object.keys(a);
  for (const k of ks) {
    if (containsStr2(keys, k)) continue;
    out[k] = a[k];
  }
  return out;
}

function omitLit(a: Record<string, string> | undefined, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  if (a === undefined) return out;
  const ks = Object.keys(a);
  for (const k of ks) {
    if (containsStr2(keys, k)) continue;
    out[k] = a[k];
  }
  return out;
}

function omitObjs(a: Record<string, ZBase>, keys: readonly string[]): Record<string, ZBase> {
  const out: Record<string, ZBase> = {};
  const ks = Object.keys(a);
  for (const k of ks) {
    if (containsStr2(keys, k)) continue;
    out[k] = a[k];
  }
  return out;
}

function containsStr2(arr: readonly string[], v: string): boolean {
  for (const a of arr) {
    if (a === v) return true;
  }
  return false;
}

function mergeShape(a: Record<string, number> | undefined, b: Record<string, number> | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (a !== undefined) {
    const ka = Object.keys(a);
    for (const k of ka) out[k] = a[k];
  }
  if (b !== undefined) {
    const kb = Object.keys(b);
    for (const k2 of kb) out[k2] = b[k2];
  }
  return out;
}

function mergeLit(a: Record<string, string> | undefined, b: Record<string, string> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (a !== undefined) {
    const ka = Object.keys(a);
    for (const k of ka) out[k] = a[k];
  }
  if (b !== undefined) {
    const kb = Object.keys(b);
    for (const k2 of kb) out[k2] = b[k2];
  }
  return out;
}

function coerceStr(v: any): unknown {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return v;
}

function coerceNum(v: any): unknown {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v);
  if (typeof v === "boolean") return v ? 1 : 0;
  return v;
}

function coerceBool(v: any): unknown {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.length > 0;
  if (typeof v === "number") return v !== 0;
  return v;
}

function coerceDate(v: any): unknown {
  return v;
}

function coerceIf(s: ZBase, input: any): unknown {
  if (s._disc !== "coerce") return input;
  const kind = s._wrap;
  if (kind === "string") return coerceStr(input);
  if (kind === "number") return coerceNum(input);
  if (kind === "boolean") return coerceBool(input);
  if (kind === "date") return coerceDate(input);
  return input;
}

function sameLiteral(lit: string | number | boolean | null, input: any): boolean {
  if (typeof lit === "string") {
    if (typeof input === "string") return input === lit;
    return false;
  }
  if (typeof lit === "number") {
    if (typeof input === "number") return input === lit;
    return false;
  }
  if (typeof lit === "boolean") {
    if (typeof input === "boolean") return input === lit;
    return false;
  }
  return input === null;
}

function regAny(v: unknown): number {
  const b = v as ZBase;
  return registerSchema(b);
}

function discValAny(v: unknown, disc: string): string {
  const b = v as ZBase;
  return discValOf(b, disc);
}

function regOne(x: ZBase): number {
  return registerSchema(x);
}

function regAll(arr: readonly ZBase[]): number[] {
  const out: number[] = [];
  for (const e of arr) {
    out.push(regOne(e));
  }
  return out;
}

function discValOfT(opt: ZBase, disc: string): string {
  return discValOf(opt, disc);
}

function discValsAll(arr: readonly ZBase[], disc: string): string[] {
  const out: string[] = [];
  for (const e of arr) {
    out.push(discValOfT(e, disc));
  }
  return out;
}

function discValOf(opt: ZBase, disc: string): string {
  const m = opt._litMap;
  if (m !== undefined && disc in m) {
    return m[disc];
  }
  return "";
}

function primOf(v: any): string | number | boolean | null {
  return v as string | number | boolean | null;
}

function castTo<X>(v: unknown): X {
  return v as X;
}

function okOf(value: any): SafeParseResult<any> {
  const ok: SafeParseSuccess<any> = { success: true, data: value };
  return ok;
}

function makeFn(f: (v: any, ctx: RefinementCtx) => unknown): (value: any, ctx: RefinementCtx) => unknown {
  return (value: any, ctx: RefinementCtx): unknown => f(value, ctx);
}

function preFnOf(f: (value: any) => unknown): (value: any, ctx: RefinementCtx) => unknown {
  return (value: any, ctx: RefinementCtx): unknown => f(value);
}

function schemaAt(i: number): ZBase {
  const v = SCHEMA_MAP.get(i);
  if (v === undefined) throw new Error("bad schema index");
  return v;
}

function shapeIdxsOf(shape: Record<string, ZBase>): Record<string, number> {
  const out: Record<string, number> = {};
  const ks = Object.keys(shape);
  for (const k of ks) {
    out[k] = registerSchema(shape[k]);
  }
  return out;
}

function litMapOf(shape: Record<string, ZBase>): Record<string, string> {
  const out: Record<string, string> = {};
  const ks = Object.keys(shape);
  for (const k of ks) {
    const m = shape[k];
    if (m._wrap === "literal") {
      out[k] = m._litVal;
    }
  }
  return out;
}

function makeRefineCtx(ctx: ParseCtx): RefinementCtx {
  const issuesRef = ctx.issues;
  const basePath = ctx.path.slice();
  const rctx: RefinementCtx = {
    path: basePath,
    addIssue(issue: IssueInput): void {
      const rel = issue.path !== undefined ? issue.path : [];
      const abs = basePath.concat(rel);
      const code = issue.code !== undefined ? issue.code : "custom";
      const message = issue.message !== undefined ? issue.message : "Invalid input";
      const full: ZodIssue = { code: code, path: abs, message: message };
      issuesRef.push(full);
    },
  };
  return rctx;
}

function runArrayParse(elementIdx: number, checks: ArrCheck[], input: any, ctx: ParseCtx): unknown {
  if (!isArrayLike(input)) {
    failType(ctx, "array", input);
    return undefined;
  }
  const arr: any[] = input;
  const len = arr.length;
  for (const check of checks) {
    const kind = check.kind;
    if (kind === "min") {
      const n = check.a !== undefined ? check.a : 0;
      if (len < n) {
        const msg = check.message !== undefined ? check.message : "Too small: expected array to have >=" + n + " items";
        failIssue(ctx, () => {
          const issue: ZodIssue = { origin: "array", code: "too_small", minimum: n, inclusive: true, path: ctx.path.slice(), message: msg };
          return issue;
        });
        return undefined;
      }
      continue;
    }
    if (kind === "max") {
      const n = check.a !== undefined ? check.a : 0;
      if (len > n) {
        const msg = check.message !== undefined ? check.message : "Too big: expected array to have <=" + n + " items";
        failIssue(ctx, () => {
          const issue: ZodIssue = { origin: "array", code: "too_big", maximum: n, inclusive: true, path: ctx.path.slice(), message: msg };
          return issue;
        });
        return undefined;
      }
      continue;
    }
    if (kind === "length") {
      const n = check.a !== undefined ? check.a : 0;
      if (len !== n) {
        const msg = check.message !== undefined ? check.message : "Invalid array: must contain " + n + " element(s)";
        failIssue(ctx, () => {
          const issue: ZodIssue = { origin: "array", code: "invalid_format", format: "length", path: ctx.path.slice(), message: msg };
          return issue;
        });
        return undefined;
      }
      continue;
    }
  }
  const out: unknown[] = [];
  for (let i = 0; i < len; i++) {
    const subCtx = childCtx(ctx, i);
    out.push(schemaAt(elementIdx)._parse(arr[i], subCtx));
  }
  return out;
}

function containsStr(arr: string[], s: string): boolean {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === s) return true;
  }
  return false;
}





function formatOptions(values: string[]): string {
  let out = "";
  for (let i = 0; i < values.length; i++) {
    if (i > 0) out += " | ";
    const v = values[i];
    if (typeof v === "string") {
      out += "'" + (v as string) + "'";
    } else {
      out += String(v);
    }
  }
  return out;
}

// ---------- string ----------

interface StrCheck {
  kind: string;
  a?: number;
  b?: number;
  pattern?: RegExp;
  patternText?: string;
  message?: string;
  prefix?: string;
  suffix?: string;
  chunk?: string;
}


const UUID_PATTERN =
  "/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/";
const UUID_RE = new RegExp(
  "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
);

function looksLikeEmail(v: string): boolean {
  const at = v.indexOf("@");
  if (at <= 0 || at !== v.lastIndexOf("@")) return false;
  const domain = v.slice(at + 1);
  if (domain.length === 0) return false;
  if (domain.indexOf(".") < 0) return false;
  if (v.indexOf(" ") >= 0) return false;
  return true;
}

function looksLikeUrl(v: string): boolean {
  if (v.indexOf(":") < 0) return false;
  if (v.indexOf(" ") >= 0) return false;
  const lower = v.toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://")) return true;
  return false;
}

// ---------- number ----------

interface NumCheck {
  kind: string;
  a?: number;
  message?: string;
}


function isInteger(v: number): boolean {
  if (!isFiniteNumber(v)) return false;
  return Math.floor(v) === v;
}

function isFiniteNumber(v: number): boolean {
  if (v !== v) return false;
  if (v === Infinity || v === -Infinity) return false;
  return true;
}

function isSafeInteger(v: number): boolean {
  if (!isInteger(v)) return false;
  const abs = Math.abs(v);
  return abs <= 9007199254740991;
}

function isMultipleOf(v: number, n: number): boolean {
  if (n === 0) return false;
  const q = v / n;
  return Math.floor(q) === q;
}

// ---------- boolean ----------


// ---------- literal / enum (factory-built nodes) ----------

// ---------- enum ----------

// ---------- array ----------

interface ArrCheck {
  kind: string;
  a?: number;
  message?: string;
}





function runStringParse(s: ZBase, input: any, ctx: ParseCtx): unknown {
    if (typeof input !== "string") {
      failType(ctx, "string", input);
      return undefined;
    }
    let v: string = input;
    for (const check of s._strChecks) {
      const kind = check.kind;
      if (kind === "trim") {
        v = v.trim();
        continue;
      }
      if (kind === "lower") {
        v = v.toLowerCase();
        continue;
      }
      if (kind === "upper") {
        v = v.toUpperCase();
        continue;
      }
      if (kind === "min") {
        const n = check.a !== undefined ? check.a : 0;
        if (v.length < n) {
          const msg = check.message !== undefined ? check.message : "Too small: expected string to have >=" + n + " characters";
          failIssue(ctx, () => {
            const issue: ZodIssue = { origin: "string", code: "too_small", minimum: n, inclusive: true, path: ctx.path.slice(), message: msg };
            return issue;
          });
          return undefined;
        }
        continue;
      }
      if (kind === "max") {
        const n = check.a !== undefined ? check.a : 0;
        if (v.length > n) {
          const msg = check.message !== undefined ? check.message : "Too big: expected string to have <=" + n + " characters";
          failIssue(ctx, () => {
            const issue: ZodIssue = { origin: "string", code: "too_big", maximum: n, inclusive: true, path: ctx.path.slice(), message: msg };
            return issue;
          });
          return undefined;
        }
        continue;
      }
      if (kind === "length") {
        const n = check.a !== undefined ? check.a : 0;
        if (v.length !== n) {
          const msg = check.message !== undefined ? check.message : "Invalid string: must contain " + n + " character(s)";
          failIssue(ctx, () => {
            const issue: ZodIssue = { origin: "string", code: "invalid_format", format: "length", path: ctx.path.slice(), message: msg };
            return issue;
          });
          return undefined;
        }
        continue;
      }
      if (kind === "regex") {
        const re = check.pattern;
        const text = check.patternText !== undefined ? check.patternText : "";
        if (re !== undefined && !re.test(v)) {
          const msg = check.message !== undefined ? check.message : "Invalid string: must match pattern " + text;
          failIssue(ctx, () => {
            const issue: ZodIssue = { origin: "string", code: "invalid_format", format: "regex", pattern: text, path: ctx.path.slice(), message: msg };
            return issue;
          });
          return undefined;
        }
        continue;
      }
      if (kind === "startsWith") {
        const p = check.prefix !== undefined ? check.prefix : "";
        if (!v.startsWith(p)) {
          const msg = check.message !== undefined ? check.message : "Invalid string: must start with \"" + p + "\"";
          failIssue(ctx, () => {
            const issue: ZodIssue = { origin: "string", code: "invalid_format", format: "starts_with", path: ctx.path.slice(), message: msg };
            return issue;
          });
          return undefined;
        }
        continue;
      }
      if (kind === "endsWith") {
        const p = check.suffix !== undefined ? check.suffix : "";
        if (!v.endsWith(p)) {
          const msg = check.message !== undefined ? check.message : "Invalid string: must end with \"" + p + "\"";
          failIssue(ctx, () => {
            const issue: ZodIssue = { origin: "string", code: "invalid_format", format: "ends_with", path: ctx.path.slice(), message: msg };
            return issue;
          });
          return undefined;
        }
        continue;
      }
      if (kind === "includes") {
        const p = check.chunk !== undefined ? check.chunk : "";
        if (v.indexOf(p) < 0) {
          const msg = check.message !== undefined ? check.message : "Invalid string: must include \"" + p + "\"";
          failIssue(ctx, () => {
            const issue: ZodIssue = { origin: "string", code: "invalid_format", format: "includes", path: ctx.path.slice(), message: msg };
            return issue;
          });
          return undefined;
        }
        continue;
      }
      if (kind === "email") {
        if (!looksLikeEmail(v)) {
          const msg = check.message !== undefined ? check.message : "Invalid email address";
          failIssue(ctx, () => {
            const issue: ZodIssue = { origin: "string", code: "invalid_format", format: "email", path: ctx.path.slice(), message: msg };
            return issue;
          });
          return undefined;
        }
        continue;
      }
      if (kind === "url") {
        if (!looksLikeUrl(v)) {
          const msg = check.message !== undefined ? check.message : "Invalid URL";
          failIssue(ctx, () => {
            const issue: ZodIssue = { origin: "string", code: "invalid_format", format: "url", path: ctx.path.slice(), message: msg };
            return issue;
          });
          return undefined;
        }
        continue;
      }
      if (kind === "uuid") {
        if (!UUID_RE.test(v)) {
          const msg = check.message !== undefined ? check.message : "Invalid UUID";
          failIssue(ctx, () => {
            const issue: ZodIssue = {
              origin: "string",
              code: "invalid_format",
              format: "uuid",
              pattern: UUID_PATTERN,
              path: ctx.path.slice(),
              message: msg,
            };
            return issue;
          });
          return undefined;
        }
        continue;
      }
    }
    return v;
  }
function runNumberParse(s: ZBase, input: any, ctx: ParseCtx): unknown {
    if (typeof input !== "number" || input !== input) {
      failType(ctx, "number", input);
      return undefined;
    }
    const v: number = input;
    for (const check of s._numChecks) {
      const kind = check.kind;
      if (kind === "int") {
        if (!isInteger(v)) {
          const msg = check.message !== undefined ? check.message : "Invalid input: expected int, received number";
          failIssue(ctx, () => {
            const issue: ZodIssue = { expected: "int", format: "safeint", code: "invalid_type", path: ctx.path.slice(), message: msg };
            return issue;
          });
          return undefined;
        }
        continue;
      }
      if (kind === "min") {
        const n = check.a !== undefined ? check.a : 0;
        if (v < n) {
          const msg = check.message !== undefined ? check.message : "Too small: expected number to be >=" + n;
          failIssue(ctx, () => {
            const issue: ZodIssue = { origin: "number", code: "too_small", minimum: n, inclusive: true, path: ctx.path.slice(), message: msg };
            return issue;
          });
          return undefined;
        }
        continue;
      }
      if (kind === "gt") {
        const n = check.a !== undefined ? check.a : 0;
        if (v <= n) {
          const msg = check.message !== undefined ? check.message : "Too small: expected number to be >" + n;
          failIssue(ctx, () => {
            const issue: ZodIssue = { origin: "number", code: "too_small", minimum: n, inclusive: false, path: ctx.path.slice(), message: msg };
            return issue;
          });
          return undefined;
        }
        continue;
      }
      if (kind === "max") {
        const n = check.a !== undefined ? check.a : 0;
        if (v > n) {
          const msg = check.message !== undefined ? check.message : "Too big: expected number to be <=" + n;
          failIssue(ctx, () => {
            const issue: ZodIssue = { origin: "number", code: "too_big", maximum: n, inclusive: true, path: ctx.path.slice(), message: msg };
            return issue;
          });
          return undefined;
        }
        continue;
      }
      if (kind === "lt") {
        const n = check.a !== undefined ? check.a : 0;
        if (v >= n) {
          const msg = check.message !== undefined ? check.message : "Too big: expected number to be <" + n;
          failIssue(ctx, () => {
            const issue: ZodIssue = { origin: "number", code: "too_big", maximum: n, inclusive: false, path: ctx.path.slice(), message: msg };
            return issue;
          });
          return undefined;
        }
        continue;
      }
      if (kind === "multipleOf") {
        const n = check.a !== undefined ? check.a : 1;
        if (!isMultipleOf(v, n)) {
          const msg = check.message !== undefined ? check.message : "Invalid number: must be a multiple of " + n;
          failIssue(ctx, () => {
            const issue: ZodIssue = { origin: "number", code: "invalid_format", format: "multiple_of", path: ctx.path.slice(), message: msg };
            return issue;
          });
          return undefined;
        }
        continue;
      }
      if (kind === "finite") {
        if (!isFiniteNumber(v)) {
          const msg = check.message !== undefined ? check.message : "Invalid input: expected finite number, received Infinity";
          failIssue(ctx, () => {
            const issue: ZodIssue = { expected: "finite", code: "invalid_type", path: ctx.path.slice(), message: msg };
            return issue;
          });
          return undefined;
        }
        continue;
      }
      if (kind === "safe") {
        if (!isSafeInteger(v)) {
          const msg = check.message !== undefined ? check.message : "Invalid input: expected safe integer, received number";
          failIssue(ctx, () => {
            const issue: ZodIssue = { expected: "safeint", code: "invalid_type", path: ctx.path.slice(), message: msg };
            return issue;
          });
          return undefined;
        }
        continue;
      }
    }
    return v;
  }
function runBooleanParse(s: ZBase, input: any, ctx: ParseCtx): unknown {
  if (typeof input !== "boolean") {
    failType(ctx, "boolean", input);
    return undefined;
  }
  return input;
}
function runUnknownParse(s: ZBase, input: any, ctx: ParseCtx): unknown {
  return input;
}
function runNeverParse(s: ZBase, input: any, ctx: ParseCtx): unknown {
  failIssue(ctx, () => {
    const issue: ZodIssue = { expected: "never", code: "invalid_type", path: ctx.path.slice(), message: "Invalid input: expected never, received " + parsedType(input) };
    return issue;
  });
  return undefined;
}
function runUndefinedParse(s: ZBase, input: any, ctx: ParseCtx): unknown {
  if (input !== undefined) {
    failType(ctx, "undefined", input);
    return undefined;
  }
  return undefined;
}
function runDateParse(s: ZBase, input: any, ctx: ParseCtx): unknown {
  if (!isDateLikeValue(input)) {
    failType(ctx, "date", input);
    return undefined;
  }
  return input;
}

export type ZodString = ZodType<string>;

export type ZodNumber = ZodType<number>;

export type ZodBoolean = ZodType<boolean>;

export type ZodUnknown = ZodType<unknown>;

export type ZodNever = ZodType<never>;

export type ZodUndefined = ZodType<unknown>;

export type ZodDate = ZodType<unknown>;


// ---------- zod -> JSON Schema (used by the zod-to-json-schema compat module) ----------

function unwrapIdx(s: ZBase): number {
  const w = s._wrap;
  if (w === "optional" || w === "nullable" || w === "default" || w === "catch" || w === "nullish") return s._innerIdx;
  if (w === "refine" || w === "superRefine" || w === "transform" || w === "preprocess") return s._innerIdx;
  if (w === "pipe") return s._innerIdx;
  return -1;
}

function isOptionalish(s: ZBase): boolean {
  const w = s._wrap;
  return w === "optional" || w === "default" || w === "catch" || w === "nullish";
}

function applyStringChecks(s: ZBase, out: Record<string, unknown>): void {
  const cks = s._strChecks;
  for (const c of cks) {
    const kind = c.kind;
    const n = c.a !== undefined ? c.a : 0;
    if (kind === "min") out.minLength = n;
    else if (kind === "max") out.maxLength = n;
    else if (kind === "length") {
      out.minLength = n;
      out.maxLength = n;
    } else if (kind === "uuid") out.format = "uuid";
    else if (kind === "email") out.format = "email";
    else if (kind === "url") out.format = "uri";
    else if (kind === "datetime") out.format = "date-time";
    else if (kind === "regex") {
      const p = c.patternText;
      if (p !== undefined) out.pattern = p;
    }
  }
}

function applyNumberChecks(s: ZBase, out: Record<string, unknown>): void {
  const cks = s._numChecks;
  let isInt = false;
  for (const c of cks) {
    const kind = c.kind;
    const n = c.a !== undefined ? c.a : 0;
    if (kind === "int" || kind === "safe") isInt = true;
    else if (kind === "min" || kind === "gte") out.minimum = n;
    else if (kind === "max" || kind === "lte") out.maximum = n;
    else if (kind === "gt") out.exclusiveMinimum = n;
    else if (kind === "lt") out.exclusiveMaximum = n;
    else if (kind === "multipleOf" || kind === "step") out.multipleOf = n;
  }
  out.type = isInt ? "integer" : "number";
}

export function zodToJsonSchemaInternal(schema: ZBase): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const unwrapped = unwrapIdx(schema);
  if (unwrapped >= 0) {
    return zodToJsonSchemaInternal(schemaAt(unwrapped));
  }
  const w = schema._wrap;
  if (w === "string") {
    out.type = "string";
    applyStringChecks(schema, out);
  } else if (w === "number") {
    applyNumberChecks(schema, out);
  } else if (w === "boolean") {
    out.type = "boolean";
  } else if (w === "literal") {
    out.const = schema._value;
  } else if (w === "enum") {
    out.type = "string";
    out.enum = schema._discVals;
  } else if (w === "array") {
    out.type = "array";
    const cks = schema._checks2;
    for (const c of cks) {
      const n = c.a !== undefined ? c.a : 0;
      if (c.kind === "min") out.minItems = n;
      else if (c.kind === "max") out.maxItems = n;
      else if (c.kind === "length") {
        out.minItems = n;
        out.maxItems = n;
      }
    }
    if (schema._innerIdx >= 0) {
      out.items = zodToJsonSchemaInternal(schemaAt(schema._innerIdx));
    } else {
      out.items = {};
    }
  } else if (w === "object") {
    out.type = "object";
    const props: Record<string, unknown> = {};
    const required: string[] = [];
    const shape = schema._shapeIdxs;
    if (shape !== undefined) {
      const ks = Object.keys(shape);
      for (const k of ks) {
        const ci = shape[k];
        if (ci === undefined) continue;
        const child = schemaAt(ci);
        props[k] = zodToJsonSchemaInternal(child);
        if (!isOptionalish(child)) required.push(k);
      }
    }
    out.properties = props;
    out.required = required;
    if (schema._unk === "strict") out.additionalProperties = false;
  } else if (w === "record" || w === "partialRecord") {
    out.type = "object";
    if (schema._innerIdx >= 0) {
      out.additionalProperties = zodToJsonSchemaInternal(schemaAt(schema._innerIdx));
    } else {
      out.additionalProperties = {};
    }
  } else if (w === "union" || w === "du") {
    const anys: unknown[] = [];
    const opts = schema._optIdxs;
    for (const oi of opts) {
      anys.push(zodToJsonSchemaInternal(schemaAt(oi)));
    }
    out.anyOf = anys;
  } else if (w === "never") {
    out.not = {};
  } else if (w === "date") {
    out.type = "string";
    out.format = "date-time";
  }
  return out;
}

// ---------- factory functions ----------

export function string(): ZodType<string> {
  const w = new ZodType<string>();
  w._wrap = "string";
  return w;
}

export function number(): ZodType<number> {
  const w = new ZodType<number>();
  w._wrap = "number";
  return w;
}

export function boolean(): ZodType<boolean> {
  const w = new ZodType<boolean>();
  w._wrap = "boolean";
  return w;
}

export function literal(value: string | number | boolean): ZodType<any> {
  const w = new ZodType<any>();
  w._wrap = "literal";
  w._value = primOf(value);
  w._litVal = litDisplay(value);
  w._msg = litDisplay(value);
  return w;
}

function enumOf(values: readonly string[]): ZodType<any> {
  const w = new ZodType<any>();
  w._wrap = "enum";
  w._discVals = strArrOf(values);
  w._msg = enumMessage(w._discVals);
  return w;
}

export { enumOf as enum };

export function array(element: ZBase): ZodType<any[]> {
  const w = new ZodType<any[]>();
  w._wrap = "array";
  w._innerIdx = registerSchema(element);
  return w;
}

export function object(shape: ZodRawShape): ZodType<any> {
  const w = new ZodType<unknown>();
  w._wrap = "object";
  w._shapeIdxs = shapeIdxsOf(shape);
  w._litMap = litMapOf(shape);
  w._shapeObjs = copyShapeObjs(shape);
  return castTo<ZodType<any>>(w);
}

export function strictObject(shape: ZodRawShape): ZodType<any> {
  const w = new ZodType<unknown>();
  w._wrap = "object";
  w._unk = "strict";
  w._shapeIdxs = shapeIdxsOf(shape);
  w._litMap = litMapOf(shape);
  w._shapeObjs = copyShapeObjs(shape);
  return castTo<ZodType<any>>(w);
}

export function record(keyType: ZBase, valueType?: ZBase): ZodType<Record<string, any>> {
  const w = new ZodType<Record<string, any>>();
  w._wrap = "record";
  if (valueType !== undefined) {
    w._innerIdx = regOne(valueType);
  } else {
    w._innerIdx = regOne(keyType);
  }
  return w;
}

export function partialRecord(keyType: ZBase, valueType?: ZBase): ZodType<Record<string, any>> {
  const w = new ZodType<Record<string, any>>();
  w._wrap = "partialRecord";
  if (valueType !== undefined) {
    w._innerIdx = regOne(valueType);
  } else {
    w._innerIdx = regOne(keyType);
  }
  return w;
}

export function union(options: readonly ZBase[]): ZodType<any> {
  const w = new ZodType<any>();
  w._wrap = "union";
  const idxs: number[] = [];
  for (let i = 0; i < options.length; i++) {
    const o = options[i];
    if (o === undefined) continue;
    idxs.push(regAny(o));
  }
  w._optIdxs = idxs;
  return w;
}

export function discriminatedUnion(discriminator: string, options: readonly ZBase[]): ZodType<any> {
  const w = new ZodType<any>();
  w._wrap = "du";
  w._disc = discriminator;
  const idxs2: number[] = [];
  const dvals: string[] = [];
  for (let i = 0; i < options.length; i++) {
    const o = options[i];
    if (o === undefined) continue;
    idxs2.push(regAny(o));
    dvals.push(discValAny(o, discriminator));
  }
  w._optIdxs = idxs2;
  w._discVals = dvals;
  w._discIdxs = idxs2;
  return w;
}

export function unknown(): ZodType<any> {
  const w = new ZodType<any>();
  w._wrap = "unknown";
  return w;
}

export function never(): ZodType<never> {
  const w = new ZodType<never>();
  w._wrap = "never";
  return w;
}

function undefinedFactory(): ZodType<unknown> {
  const w = new ZodType<unknown>();
  w._wrap = "undefined";
  return w;
}
export { undefinedFactory as undefined };

export function date(): ZodType<unknown> {
  const w = new ZodType<unknown>();
  w._wrap = "date";
  return w;
}

export function uuid(): ZodType<string> {
  return string().uuid();
}

export function preprocess(fn: (value: any) => unknown, schema: ZBase): ZodType<any> {
  const w = new ZodType<any>();
  w._wrap = "preprocess";
  w._innerIdx = registerSchema(schema);
  w._fn = preFnOf(fn);
  return w;
}

export const coerce = {
  string(): ZodType<string> {
    const w = string();
    w._disc = "coerce";
    return w;
  },
  number(): ZodType<number> {
    const w = number();
    w._disc = "coerce";
    return w;
  },
  boolean(): ZodType<boolean> {
    const w = boolean();
    w._disc = "coerce";
    return w;
  },
  date(): ZodType<unknown> {
    const w = date();
    w._disc = "coerce";
    return w;
  },
};

export type infer<T extends ZodType> = any;
export type output<T extends ZodType> = T["_output"];
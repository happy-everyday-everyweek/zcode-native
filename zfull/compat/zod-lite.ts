// zod-lite.ts — aggregation entry for the "zod" path alias.
// `z` 的值走类静态成员（scriptc 不支持命名空间对象当值做成员访问），
// 类型走同名 namespace（class 与 namespace 可合并，const 不行）。
export * from "./zod-lite-core.js";

import {
  ZodFirstPartyTypeKind, ZodIssueCode, ZodObject, ZodError, array, boolean, coerce, date,
  discriminatedUnion, enum as enumOf, literal, never, number, object, partialRecord,
  preprocess, record, strictObject, string, undefined as undefinedFactory, union, unknown, uuid,
  zodToJsonSchemaInternal,
} from "./zod-lite-core.js";

import type {
  ZodType as ZodTypeT, ZodError as ZodErrorT, ZodIssue as ZodIssueT,
  RefinementCtx as RefinementCtxT, SafeParseSuccess as SafeParseSuccessT,
  SafeParseError as SafeParseErrorT, SafeParseResult as SafeParseResultT,
} from "./zod-lite-core.js";

export class z {
  static ZodFirstPartyTypeKind = ZodFirstPartyTypeKind;
  static ZodIssueCode = ZodIssueCode;
  static ZodObject = ZodObject;
  static ZodError = ZodError;
  static array = array;
  static boolean = boolean;
  static coerce = coerce;
  static date = date;
  static discriminatedUnion = discriminatedUnion;
  static enum = enumOf;
  static literal = literal;
  static never = never;
  static number = number;
  static object = object;
  static partialRecord = partialRecord;
  static preprocess = preprocess;
  static record = record;
  static strictObject = strictObject;
  static string = string;
  static undefined = undefinedFactory;
  static union = union;
  static unknown = unknown;
  static uuid = uuid;
  static zodToJsonSchemaInternal = zodToJsonSchemaInternal;
}

export namespace z {
  export type ZodType<O = unknown> = ZodTypeT<O>;
  export type ZodTypeAny = ZodTypeT<any>;
  export type ZodString = ZodTypeT<string>;
  export type ZodNumber = ZodTypeT<number>;
  export type ZodBoolean = ZodTypeT<boolean>;
  export type ZodObject<T = any> = ZodTypeT<any>;
  export type ZodArray<T = any> = ZodTypeT<any[]>;
  export type ZodRecord<K = any, V = any> = ZodTypeT<Record<string, any>>;
  export type ZodUnion<T = any> = ZodTypeT<any>;
  export type ZodDiscriminatedUnion<T = any> = ZodTypeT<any>;
  export type ZodOptional<T = any> = ZodTypeT<any>;
  export type ZodNullable<T = any> = ZodTypeT<any>;
  export type ZodDefault<T = any> = ZodTypeT<any>;
  export type ZodCatch<T = any> = ZodTypeT<any>;
  export type ZodEffects<T = any, O = any, I = any> = ZodTypeT<any>;
  export type ZodTransform = ZodTypeT<any>;
  export type ZodPipe<T = any> = ZodTypeT<any>;
  export type ZodNonOptional<T = any> = ZodTypeT<any>;
  export type ZodLiteral<T = any> = ZodTypeT<any>;
  export type ZodEnum<T = any> = ZodTypeT<any>;
  export type ZodError<T = any> = ZodErrorT;
  export type ZodIssue = ZodIssueT;
  export type RefinementCtx = RefinementCtxT;
  export type SafeParseSuccess<T = any> = SafeParseSuccessT<T>;
  export type SafeParseError<T = any> = SafeParseErrorT<T>;
  export type SafeParseResult<T = any> = SafeParseResultT<T>;
  export type infer<T extends ZodTypeT> = any;
  export type output<T extends ZodTypeT> = any;
  export type input<T extends ZodTypeT> = any;
}
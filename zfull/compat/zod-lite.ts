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
  static ZodFirstPartyTypeKind: any = ZodFirstPartyTypeKind;
  static ZodIssueCode: any = ZodIssueCode;
  static ZodObject: (...args: any[]) => any = ZodObject;
  static ZodError: any = ZodError;
  static array: (...args: any[]) => any = array;
  static boolean: (...args: any[]) => any = boolean;
  static coerce: (...args: any[]) => any = coerce;
  static date: (...args: any[]) => any = date;
  static discriminatedUnion: (...args: any[]) => any = discriminatedUnion;
  static enum: (...args: any[]) => any = enumOf;
  static literal: (...args: any[]) => any = literal;
  static never: (...args: any[]) => any = never;
  static number: (...args: any[]) => any = number;
  static object: (...args: any[]) => any = object;
  static partialRecord: (...args: any[]) => any = partialRecord;
  static preprocess: (...args: any[]) => any = preprocess;
  static record: (...args: any[]) => any = record;
  static strictObject: (...args: any[]) => any = strictObject;
  static string: (...args: any[]) => any = string;
  static undefined: (...args: any[]) => any = undefinedFactory;
  static union: (...args: any[]) => any = union;
  static unknown: (...args: any[]) => any = unknown;
  static uuid: (...args: any[]) => any = uuid;
  static zodToJsonSchemaInternal: (...args: any[]) => any = zodToJsonSchemaInternal;
}

export namespace z {
  export type ZodType<O = any> = ZodTypeT<O>;
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
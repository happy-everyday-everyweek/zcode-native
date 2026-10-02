// zod-lite.ts — aggregation entry for the "zod" path alias.
export * from "./zod-lite-core.js";

import {
  ZodFirstPartyTypeKind, ZodIssueCode, ZodObject, ZodError, ZBase, array, boolean, coerce, date,
  discriminatedUnion, enum as enumOf, literal, never, number, object, partialRecord,
  preprocess, record, strictObject, string, undefined as undefinedFactory, union, unknown, uuid,
  zodToJsonSchemaInternal,
} from "./zod-lite-core.js";

import type {
  ZodType as ZodTypeT, ZodError as ZodErrorT, ZodIssue as ZodIssueT,
  RefinementCtx as RefinementCtxT, SafeParseSuccess as SafeParseSuccessT,
  SafeParseError as SafeParseErrorT, SafeParseResult as SafeParseResultT,
  ZodRawShape as ZodRawShapeT,
} from "./zod-lite-core.js";

export type ZodRawShape = ZodRawShapeT;

export class z {
  static ZodFirstPartyTypeKind: any = ZodFirstPartyTypeKind;
  static ZodIssueCode: any = ZodIssueCode;
  static ZodObject: (shape: ZodRawShapeT) => ZodTypeT<any> = ZodObject;
  static ZodError: any = ZodError;
  static coerce: any = coerce;
  static array: (element: ZBase) => ZodTypeT<any[]> = array;
  static boolean: () => ZodTypeT<boolean> = boolean;
  static date: () => ZodTypeT<unknown> = date;
  static discriminatedUnion: (discriminator: string, options: readonly ZBase[]) => ZodTypeT<any> = discriminatedUnion;
  static enum: (values: readonly string[]) => ZodTypeT<any> = enumOf;
  static literal: (value: string | number | boolean) => ZodTypeT<any> = literal;
  static never: () => ZodTypeT<never> = never;
  static number: () => ZodTypeT<number> = number;
  static object: (shape: ZodRawShape) => ZodTypeT<any> = object;
  static partialRecord: (keyType: ZBase, valueType?: ZBase) => ZodTypeT<Record<string, any>> = partialRecord;
  static preprocess: (fn: (value: any) => unknown, schema: ZBase) => ZodTypeT<any> = preprocess;
  static record: (keyType: ZBase, valueType?: ZBase) => ZodTypeT<Record<string, any>> = record;
  static strictObject: (shape: ZodRawShape) => ZodTypeT<any> = strictObject;
  static string: () => ZodTypeT<string> = string;
  static undefined: () => ZodTypeT<unknown> = undefinedFactory;
  static union: (options: readonly ZBase[]) => ZodTypeT<any> = union;
  static unknown: () => ZodTypeT<any> = unknown;
  static uuid: () => ZodTypeT<string> = uuid;
  static zodToJsonSchemaInternal: (schema: ZBase) => Record<string, unknown> = zodToJsonSchemaInternal;
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
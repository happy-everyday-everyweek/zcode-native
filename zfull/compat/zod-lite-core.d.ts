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
export declare const ZodFirstPartyTypeKind: {
    ZodString: string;
    ZodNumber: string;
    ZodBoolean: string;
    ZodBigInt: string;
    ZodDate: string;
    ZodSymbol: string;
    ZodUndefined: string;
    ZodNull: string;
    ZodAny: string;
    ZodUnknown: string;
    ZodNever: string;
    ZodVoid: string;
    ZodArray: string;
    ZodObject: string;
    ZodUnion: string;
    ZodDiscriminatedUnion: string;
    ZodIntersection: string;
    ZodTuple: string;
    ZodRecord: string;
    ZodMap: string;
    ZodSet: string;
    ZodFunction: string;
    ZodLazy: string;
    ZodLiteral: string;
    ZodEnum: string;
    ZodEffects: string;
    ZodNativeEnum: string;
    ZodOptional: string;
    ZodNullable: string;
    ZodDefault: string;
    ZodCatch: string;
    ZodPromise: string;
    ZodBranded: string;
    ZodPipeline: string;
    ZodReadonly: string;
};
export type ZodRawShape = Record<string, ZBase>;
export type OutOf1<T extends ZodType> = T["_output"];
export type ShapeOut<T extends ZodRawShape> = {
    [K in keyof T]: unknown;
};
export type SafeParseSuccess<T> = {
    success: true;
    readonly data: T;
};
export type SafeParseError<T = unknown> = {
    success: false;
    error: ZodError;
    data?: T;
};
export type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseError<T>;
export type OutputOf<T extends ZodType> = T["_output"];
export type SafeParseSuccessOf<T extends ZodType> = {
    success: true;
    data: T["_output"];
};
export type SafeParseResultOf<T extends ZodType> = SafeParseSuccessOf<T> | SafeParseError;
export declare const ZodIssueCode: {
    invalid_type: string;
    too_small: string;
    too_big: string;
    invalid_value: string;
    invalid_format: string;
    unrecognized_keys: string;
    invalid_union: string;
    custom: string;
};
export type ZodIssueCode = string;
export declare class ZodError {
    name: string;
    message: string;
    issues: ZodIssue[];
    constructor(issues: ZodIssue[]);
    get errors(): ZodIssue[];
    format(): Record<string, unknown>;
    flatten(): Record<string, unknown>;
}
export declare class ZBase {
    _description?: string;
    _wrap: string;
    _innerIdx: number;
    _fn: ((value: any, ctx: RefinementCtx) => unknown) | undefined;
    _value: string | number | boolean | null;
    _objIdx: number;
    _msg: string | undefined;
    _checks2: ArrCheck[];
    _strChecks: StrCheck[];
    _numChecks: NumCheck[];
    _shapeIdxs: Record<string, number> | undefined;
    _shapeObjs: Record<string, ZBase>;
    _unk: string;
    _optIdxs: number[];
    _disc: string;
    _discVals: string[];
    _discIdxs: number[];
    _litVal: string;
    _litMap: Record<string, string> | undefined;
    get shape(): any;
    _parse(input: any, ctx: ParseCtx): unknown;
}
export declare class ZodType<O = any> extends ZBase {
    get _output(): O;
    get _input(): O;
    parse(input: any): O;
    safeParse(input: any): SafeParseResult<O>;
    optional(): ZodType<any>;
    nullable(): ZodType<any>;
    array(): ZodType<O>;
    default(value: O | null | undefined): ZodType<O>;
    catch(value: O | null | undefined): ZodType<O>;
    describe(text: string): this;
    refine(fn: (value: any, ctx: RefinementCtx) => unknown, message?: string | RefineOpts): ZodType<O>;
    superRefine(fn: (value: any, ctx: RefinementCtx) => unknown): ZodType<O>;
    transform(fn: (value: any, ctx: RefinementCtx) => any): ZodType<any>;
    pipe(target: ZBase): ZodType<any>;
    trim(): ZodType<O>;
    toLowerCase(): ZodType<O>;
    toUpperCase(): ZodType<O>;
    regex(pattern: RegExp, message?: string): ZodType<O>;
    startsWith(prefix: string, message?: string): ZodType<O>;
    endsWith(suffix: string, message?: string): ZodType<O>;
    includes(chunk: string, message?: string): ZodType<O>;
    email(message?: string): ZodType<O>;
    url(message?: string): ZodType<O>;
    uuid(message?: string): ZodType<O>;
    gt(n: number, message?: string): ZodType<O>;
    gte(n: number, message?: string): ZodType<O>;
    lt(n: number, message?: string): ZodType<O>;
    lte(n: number, message?: string): ZodType<O>;
    int(message?: string): ZodType<O>;
    positive(message?: string): ZodType<O>;
    nonnegative(message?: string): ZodType<O>;
    negative(message?: string): ZodType<O>;
    nonpositive(message?: string): ZodType<O>;
    multipleOf(n: number, message?: string): ZodType<O>;
    step(n: number, message?: string): ZodType<O>;
    finite(message?: string): ZodType<O>;
    safe(message?: string): ZodType<O>;
    cloneSelf(): ZodType<O>;
    _addStr(check: StrCheck): ZodType<O>;
    _addNum(check: NumCheck): ZodType<O>;
    _addArr(check: ArrCheck): ZodType<O>;
    min(n: number, message?: string): ZodType<O>;
    max(n: number, message?: string): ZodType<O>;
    length(n: number, message?: string): ZodType<O>;
    nonempty(message?: string): ZodType<O>;
    get options(): string[];
    exclude(values: string[]): ZodType<any>;
    nullish(): ZodType<O>;
    datetime(message?: string): ZodType<O>;
    readonly(): ZodType<O>;
    pick(keys: readonly string[] | Record<string, boolean>): ZodType<O>;
    omit(keys: readonly string[] | Record<string, boolean>): ZodType<O>;
    extract(values: string[]): ZodType<any>;
    keyof(): ZodType<string>;
    partial(): ZodType<O>;
    strict(): ZodType<O>;
    passthrough(): ZodType<O>;
    catchall(schema: ZBase): ZodType<O>;
    extend(shape: ZodRawShape): ZodType<any>;
    merge(other: ZBase): ZodType<O>;
    strip(): ZodType<O>;
}
export declare const ZodObject: (shape: ZodRawShape) => ZodType<any>;
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
interface NumCheck {
    kind: string;
    a?: number;
    message?: string;
}
interface ArrCheck {
    kind: string;
    a?: number;
    message?: string;
}
export type ZodString = ZodType<string>;
export type ZodNumber = ZodType<number>;
export type ZodBoolean = ZodType<boolean>;
export type ZodUnknown = ZodType<unknown>;
export type ZodNever = ZodType<never>;
export type ZodUndefined = ZodType<unknown>;
export type ZodDate = ZodType<unknown>;
export declare function zodToJsonSchemaInternal(schema: ZBase): Record<string, unknown>;
export declare function string(): ZodType<string>;
export declare function number(): ZodType<number>;
export declare function boolean(): ZodType<boolean>;
export declare function literal(value: string | number | boolean): ZodType<any>;
declare function enumOf(values: readonly string[]): ZodType<any>;
export { enumOf as enum };
export declare function array(element: ZBase): ZodType<any[]>;
export declare function object(shape: ZodRawShape): ZodType<any>;
export declare function strictObject(shape: ZodRawShape): ZodType<any>;
export declare function record(keyType: ZBase, valueType?: ZBase): ZodType<Record<string, any>>;
export declare function partialRecord(keyType: ZBase, valueType?: ZBase): ZodType<Record<string, any>>;
export declare function union(options: readonly ZBase[]): ZodType<any>;
export declare function discriminatedUnion(discriminator: string, options: readonly ZBase[]): ZodType<any>;
export declare function unknown(): ZodType<any>;
export declare function never(): ZodType<never>;
declare function undefinedFactory(): ZodType<unknown>;
export { undefinedFactory as undefined };
export declare function date(): ZodType<unknown>;
export declare function uuid(): ZodType<string>;
export declare function preprocess(fn: (value: any) => unknown, schema: ZBase): ZodType<any>;
export declare const coerce: {
    string(): ZodType<string>;
    number(): ZodType<number>;
    boolean(): ZodType<boolean>;
    date(): ZodType<unknown>;
};
export type infer<T extends ZodType> = any;
export type output<T extends ZodType> = T["_output"];

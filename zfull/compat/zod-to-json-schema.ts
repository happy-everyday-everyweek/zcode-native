// zod-to-json-schema compat shim backed by zod-lite's own registry walker.
import type { ZodTypeAny } from "./zod-lite-core.js";
import { zodToJsonSchemaInternal } from "./zod-lite-core.js";

export interface ZodToJsonSchemaOptions {
  $refStrategy?: string;
  effectStrategy?: string;
  target?: string;
  name?: string;
  basePath?: (string | number)[];
  definitionPath?: string;
  strictUnions?: boolean;
  pipeStrategy?: string;
  removeAdditionalStrategy?: string;
  errorMessages?: boolean;
  markdownDescription?: boolean;
}

export function zodToJsonSchema(schema: ZodTypeAny, options?: ZodToJsonSchemaOptions): Record<string, unknown> {
  return zodToJsonSchemaInternal(schema);
}

export default zodToJsonSchema;

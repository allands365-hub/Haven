/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analyze from "../analyze.js";
import type * as chat from "../chat.js";
import type * as companion from "../companion.js";
import type * as entries from "../entries.js";
import type * as lib_crisis from "../lib/crisis.js";
import type * as lib_mood from "../lib/mood.js";
import type * as lib_openai from "../lib/openai.js";
import type * as lib_triggers from "../lib/triggers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analyze: typeof analyze;
  chat: typeof chat;
  companion: typeof companion;
  entries: typeof entries;
  "lib/crisis": typeof lib_crisis;
  "lib/mood": typeof lib_mood;
  "lib/openai": typeof lib_openai;
  "lib/triggers": typeof lib_triggers;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

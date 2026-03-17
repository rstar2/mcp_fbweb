/**
 * Union type for TS/JS integrated primitive types like string, number or boolean
 */
export type Primitive = string | number | boolean;

/**
 * Type safe value for a {@link JSONObject} object
 * It uses TypeScript's recursive type aliases
 */
export type JSONValue = Primitive | undefined | null | JSONValue[] | JSONObject;

/**
 * Type safe JSON-like object
 * It uses TypeScript's recursive type aliases
 */
export type JSONObject = { [k: string]: JSONValue };

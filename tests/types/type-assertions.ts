/**
 * Zero-runtime compile-time TypeScript type assertion helpers for testing type inference,
 * assignability, and strict equality.
 */

/**
 * Asserts that T is strictly `true`.
 * Usage:
 *   type _ = Expect<Equal<typeof actual, ExpectedType>>;
 */
export type Expect<T extends true> = T;

/**
 * Asserts that T is strictly `false`.
 */
export type ExpectFalse<T extends false> = T;

/**
 * Deep bidirectional strict type equality check.
 * Distinguishes `any`, `never`, `unknown`, and optional properties.
 */
export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2)
  ? true
  : false;

/**
 * Checks if type X extends (is assignable to) type Y.
 */
export type Extends<X, Y> = X extends Y ? true : false;

/**
 * Checks that T is not `any`.
 */
export type NotAny<T> = 0 extends 1 & T ? false : true;

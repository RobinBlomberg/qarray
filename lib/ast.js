/**
 * @typedef {import('./_ast').BinaryExpression} BinaryExpression
 * @typedef {import('./_ast').BinaryOperator} BinaryOperator
 * @typedef {import('./_ast').CallExpression} CallExpression
 * @typedef {import('./_ast').Expression} Expression
 * @typedef {import('./_ast').Identifier} Identifier
 * @typedef {import('./_ast').Literal} Literal
 * @typedef {import('./_ast').MemberExpression} MemberExpression
 */

/**
 * @param {BinaryOperator} operator
 * @param {Expression} left
 * @param {Expression} right
 * @return {BinaryExpression}
 */
export const BinaryExpression = (operator, left, right) => ({
  type: 'BinaryExpression',
  operator,
  left,
  right
});

/**
 * @param {Expression} callee
 * @param {Expression[]} args
 * @return {CallExpression}
 */
export const CallExpression = (callee, args) => ({
  type: 'CallExpression',
  callee,
  arguments: args
});

/**
 * @param {string} name
 * @return {Identifier}
 */
export const Identifier = (name) => ({
  type: 'Identifier',
  name
});

/**
 * @param {number | string} value
 * @return {Literal}
 */
export const Literal = (value) => ({
  type: 'Literal',
  value
});

/**
 * @param {Identifier} object
 * @param {Identifier} property
 * @return {MemberExpression}
 */
export const MemberExpression = (object, property) => ({
  type: 'MemberExpression',
  object,
  property
});

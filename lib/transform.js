import { ESTree } from 'meriyah';
import * as SQLite from '@robinblomberg/sqlite-compiler';

/**
 * @param {string} operator
 * @return {SQLite.AST._BinaryOperator}
 */
const _BinaryOperator = (operator) => {
  switch (operator) {
    case '*':
    case '/':
    case '%':
    case '+':
    case '-':
    case '<<':
    case '>>':
    case '<':
    case '<=':
    case '>':
    case '>=':
    case '&':
    case '|':
      return operator;
    case '==':
    case '===':
      return 'IS';
    case '!=':
    case '!==':
      return 'IS NOT';
    case '&&':
      return 'AND';
    case '||':
      return 'OR';
    default:
      throw new TypeError(`Unexpected binary operator: ${operator}`);
  }
};

/**
 * @param {string} operator
 * @return {SQLite.AST._UnaryOperator}
 */
const _UnaryOperator = (operator) => {
  switch (operator) {
    case '-':
    case '+':
    case '~':
      return operator;
    case '!':
      return 'NOT';
    default:
      throw new TypeError(`Unexpected binary operator: ${operator}`);
  }
};

/**
 * @param {ESTree.ArrayExpression} node
 * @return {SQLite.AST._ArrayExpression}
 */
const ArrayExpression = (node) => {
  if (node.elements[0] === undefined) {
    throw new Error('Sequence expression must have at least 1 expression.');
  }

  return SQLite.Nodes._ArrayExpression(
    /** @type {[SQLite.AST.Expr, ...SQLite.AST.Expr[]]} */
    (node.elements.map(Expression))
  );
};

/**
 * @param {ESTree.ArrowFunctionExpression} node
 * @return {SQLite.AST.Expr}
 */
const ArrowFunctionExpression = (node) => {
  return node.body.type === 'BlockStatement'
    ? BlockStatement(node.body)
    : Expression(node.body);
};

/**
 * @param {ESTree.BinaryExpression | ESTree.LogicalExpression} node
 * @return {SQLite.AST._BinaryExpression}
 */
const BinaryExpression = (node) => {
  const left = Expression(node.left);
  const operator = _BinaryOperator(node.operator);
  const right = Expression(node.right);

  return SQLite.Nodes._BinaryExpression(
    left,
    operator,
    right
  );
};

/**
 * @param {ESTree.BlockStatement} node
 * @return {SQLite.AST.Expr}
 */
const BlockStatement = (node) => {
  if (node.body[0] === undefined) {
    throw new Error('Expected function expression body to have at least 1 statement.');
  }

  if (node.body[0].type !== 'ReturnStatement') {
    throw new Error('Expected function expression body to begin with a return statement.');
  }

  if (!node.body[0].argument) {
    throw new Error('Expected function expression to return a value.');
  }

  return Expression(node.body[0].argument);
};

/**
 * @param {ESTree.CallExpression} node
 * @return {SQLite.AST._FunctionInvocation}
 */
const CallExpression = (node) => {
  if (node.callee.type !== 'Identifier') {
    throw new TypeError(`Unexpected call expression callee type: ${node.type}`);
  }

  const name = Identifier(node.callee);
  const args = node.arguments.length === 0
    ? null
    : SQLite.Nodes._Args(
      false,
      /** @type {[SQLite.AST.Expr, ...SQLite.AST.Expr[]]} */
      (node.arguments.map(Expression))
    );

  return SQLite.Nodes._FunctionInvocation(
    name,
    args,
    null,
    null
  );
};

/**
 * @param {ESTree.Expression} node
 * @return {SQLite.AST.Expr}
 */
const Expression = (node) => {
  switch (node.type) {
    case 'ArrayExpression':
      return ArrayExpression(node);
    case 'ArrowFunctionExpression':
      return ArrowFunctionExpression(node);
    case 'BinaryExpression':
    case 'LogicalExpression':
      return BinaryExpression(node);
    case 'CallExpression':
      return CallExpression(node);
    case 'FunctionExpression':
      return FunctionExpression(node);
    case 'Identifier':
      return Identifier(node);
    case 'Literal':
      return Literal(node);
    case 'MemberExpression':
      return MemberExpression(node);
    case 'UnaryExpression':
      return UnaryExpression(node);
    default:
      throw new TypeError(`Unexpected node type: ${node.type}`);
  }
};

/**
 * @param {ESTree.ExpressionStatement} node
 * @return {SQLite.AST.Expr}
 */
const ExpressionStatement = (node) => {
  return Expression(node.expression);
};

/**
 * @param {ESTree.FunctionExpression} node
 * @return {SQLite.AST.Expr}
 */
const FunctionExpression = (node) => {
  if (!node.body) {
    throw new Error('Expected function expression to have a body.');
  }

  return BlockStatement(node.body);
};

/**
 * @param {ESTree.Identifier} node
 * @return {SQLite.AST._Identifier}
 */
const Identifier = (node) => {
  return SQLite.Nodes._Identifier(node.name);
};

/**
 * @param {ESTree.Literal} node
 * @return {SQLite.AST._NumericLiteral | SQLite.AST._StringLiteral}
 */
const Literal = (node) => {
  if (typeof node.value === 'number') {
    return SQLite.Nodes._NumericLiteral(node.value);
  } else if (typeof node.value === 'string') {
    return SQLite.Nodes._StringLiteral(node.value);
  }

  throw new TypeError(`Expected literal value to be a number or string: ${node.value}`);
};

/**
 * @param {ESTree.MemberExpression} node
 * @return {SQLite.AST._Path | SQLite.AST._QualifiedPath}
 */
const MemberExpression = (node) => {
  if (node.property.type !== 'Identifier') {
    throw new TypeError(`Unexpected member expression property type: ${node.property.type}`);
  }

  if (node.object.type === 'MemberExpression') {
    if (node.object.object.type !== 'Identifier') {
      throw new TypeError(
        `Unexpected member expression object object type: ${node.object.object.type}`
      );
    }

    if (node.object.property.type !== 'Identifier') {
      throw new TypeError(
        `Unexpected member expression object property type: ${node.object.property.type}`
      );
    }

    return SQLite.Nodes._QualifiedPath(
      Identifier(node.object.object),
      SQLite.Nodes._Path(
        Identifier(node.object.property),
        Identifier(node.property)
      )
    );
  } else if (node.object.type !== 'Identifier') {
    throw new TypeError(`Unexpected member expression object type: ${node.object.type}`);
  }

  return SQLite.Nodes._Path(
    Identifier(node.object),
    Identifier(node.property)
  );
};

/**
 * @param {ESTree.Program} node
 * @return {SQLite.AST.Expr}
 */
const Program = (node) => {
  if (node.body.length === 0) {
    throw new Error('Program body must have at least 1 statement.');
  }

  return Statement(node.body[0]);
};

/**
 * @param {ESTree.Statement} node
 * @return {SQLite.AST.Expr}
 */
const Statement = (node) => {
  switch (node.type) {
    case 'ExpressionStatement':
      return ExpressionStatement(node);
    default:
      throw new TypeError(`Unexpected node type: ${node.type}`);
  }
};

/**
 * @param {ESTree.UnaryExpression} node
 * @return {SQLite.AST._UnaryExpression}
 */
const UnaryExpression = (node) => {
  const operator = _UnaryOperator(node.operator);
  const argument = Expression(node.argument);

  return SQLite.Nodes._UnaryExpression(
    operator,
    argument
  );
};

/**
 * @param {ESTree.Node} node
 * @return {SQLite.AST.Expr}
 */
export const transform = (node) => {
  switch (node.type) {
    case 'Program':
      return Program(node);
    default:
      throw new TypeError(`Unexpected node type: ${node.type}`);
  }
};

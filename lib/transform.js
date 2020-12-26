/**
 * @typedef {import('./types').TransformOptions} TransformOptions
 */

import { ESTree } from 'meriyah';
import * as SQLite from '@robinblomberg/sqlite-compiler';

/**
 * @param {SQLite.AST.Expr[]} expressions
 * @return {SQLite.AST.Expr}
 */
const _mergeConditionalTree = (expressions) => {
  let node = expressions[0];

  for (let i = 1; i < expressions.length; i++) {
    const expression = expressions[i];

    if (node.type !== '_CaseExpression') {
      break;
    } else if (node.alternate === null) {
      if (expression.type === '_CaseExpression') {
        node.cases.push(...expression.cases);
        node.alternate = expression.alternate;
      } else {
        node.alternate = expression;
        break;
      }
    } else if (
      node.alternate.type === '_CaseExpression' &&
      expression.type === '_CaseExpression'
    ) {
      node = node.alternate;
      i--;
    } else {
      break;
    }
  }

  return expressions[0];
};

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
 * @param {TransformOptions} options
 * @return {SQLite.AST._ArrayExpression}
 */
const ArrayExpression = (node, options) => {
  if (node.elements[0] === undefined) {
    throw new Error('Sequence expression must have at least 1 expression.');
  }

  return SQLite.Nodes._ArrayExpression(
    /** @type {[SQLite.AST.Expr, ...SQLite.AST.Expr[]]} */
    (node.elements.map((element) => Expression(element, options)))
  );
};

/**
 * @param {ESTree.ArrowFunctionExpression} node
 * @param {TransformOptions} options
 * @return {SQLite.AST.Expr}
 */
const ArrowFunctionExpression = (node, options) => {
  return node.body.type === 'BlockStatement'
    ? BlockStatement(node.body, options)
    : Expression(node.body, options);
};

/**
 * @param {ESTree.BinaryExpression | ESTree.LogicalExpression} node
 * @param {TransformOptions} options
 * @return {SQLite.AST._BinaryExpression}
 */
const BinaryExpression = (node, options) => {
  const left = Expression(node.left, options);
  const operator = _BinaryOperator(node.operator);
  const right = Expression(node.right, options);

  return SQLite.Nodes._BinaryExpression(
    left,
    operator,
    right
  );
};

/**
 * @param {ESTree.BlockStatement} node
 * @param {TransformOptions} options
 * @return {SQLite.AST.Expr}
 */
const BlockStatement = (node, options) => {
  if (node.body[0] === undefined) {
    throw new Error('Expected block statement body to have at least 1 statement.');
  }

  /** @type {SQLite.AST.Expr[]} */
  const expressions = [];

  for (const statement of node.body) {
    let shouldBreak = false;

    switch (statement.type) {
      case 'IfStatement':
        expressions.push(IfStatement(statement, options));
        break;
      case 'ReturnStatement':
        expressions.push(ReturnStatement(statement, options));
        shouldBreak = true;
        break;
      case 'SwitchStatement':
        expressions.push(SwitchStatement(statement, options));
        break;
      default:
        throw new Error(
          'Expected block statement body to only contain the following node types: ' +
          'IfStatement, ReturnStatement or SwitchStatement'
        );
    }

    if (shouldBreak) {
      break;
    }
  }

  return _mergeConditionalTree(expressions);
};

/**
 * @param {ESTree.CallExpression} node
 * @param {TransformOptions} options
 * @return {SQLite.AST._FunctionInvocation}
 */
const CallExpression = (node, options) => {
  if (node.callee.type !== 'Identifier') {
    throw new TypeError(`Unexpected call expression callee type: ${node.type}`);
  }

  const name = Identifier(node.callee);
  const args = node.arguments.length === 0
    ? null
    : SQLite.Nodes._Args(
      false,
      /** @type {[SQLite.AST.Expr, ...SQLite.AST.Expr[]]} */
      (node.arguments.map((argument) => Expression(argument, options)))
    );

  return SQLite.Nodes._FunctionInvocation(
    name,
    args,
    null,
    null
  );
};

/**
 * @param {ESTree.ConditionalExpression} node
 * @param {TransformOptions} options
 * @return {SQLite.AST.Expr}
 */
const ConditionalExpression = (node, options) => {
  return SQLite.Nodes._CaseExpression(
    null,
    [
      SQLite.Nodes._CaseClause(
        Expression(node.test, options),
        Expression(node.consequent, options)
      )
    ],
    Expression(node.alternate, options)
  );
};

/**
 * @param {ESTree.Expression} node
 * @param {TransformOptions} options
 * @return {SQLite.AST.Expr}
 */
const Expression = (node, options) => {
  switch (node.type) {
    case 'ArrayExpression':
      return ArrayExpression(node, options);
    case 'ArrowFunctionExpression':
      return ArrowFunctionExpression(node, options);
    case 'BinaryExpression':
    case 'LogicalExpression':
      return BinaryExpression(node, options);
    case 'CallExpression':
      return CallExpression(node, options);
    case 'ConditionalExpression':
      return ConditionalExpression(node, options);
    case 'FunctionExpression':
      return FunctionExpression(node, options);
    case 'Identifier':
      return Identifier(node);
    case 'Literal':
      return Literal(node);
    case 'MemberExpression':
      return MemberExpression(node);
    case 'UnaryExpression':
      return UnaryExpression(node, options);
    default:
      throw new TypeError(`Unexpected node type: ${node.type}`);
  }
};

/**
 * @param {ESTree.ExpressionStatement} node
 * @param {TransformOptions} options
 * @return {SQLite.AST.Expr}
 */
const ExpressionStatement = (node, options) => {
  return Expression(node.expression, options);
};

/**
 * @param {ESTree.FunctionDeclaration} node
 * @param {TransformOptions} options
 * @return {SQLite.AST.Expr}
 */
const FunctionDeclaration = (node, options) => {
  if (!node.body) {
    throw new Error('Expected function expression to have a body.');
  }

  return BlockStatement(node.body, options);
};

/**
 * @param {ESTree.FunctionExpression} node
 * @param {TransformOptions} options
 * @return {SQLite.AST.Expr}
 */
const FunctionExpression = (node, options) => {
  if (!node.body) {
    throw new Error('Expected function expression to have a body.');
  }

  return BlockStatement(node.body, options);
};

/**
 * @param {ESTree.Identifier} node
 * @return {SQLite.AST._Identifier}
 */
const Identifier = (node) => {
  return SQLite.Nodes._Identifier(node.name);
};

/**
 * @param {ESTree.IfStatement} node
 * @param {TransformOptions} options
 * @return {SQLite.AST._CaseExpression}
 */
const IfStatement = (node, options) => {
  /** @type {SQLite.AST._CaseClause[]} */
  const cases = [];

  /** @type {ESTree.Statement | null} */
  let currentNode = node;
  while (currentNode?.type === 'IfStatement') {
    cases.push(
      SQLite.Nodes._CaseClause(
        Expression(currentNode.test, options),
        Statement(currentNode.consequent, options)
      )
    );

    currentNode = currentNode.alternate;
  }

  const alternate = currentNode === null
    ? null
    : Statement(currentNode, options);

  return SQLite.Nodes._CaseExpression(
    null,
    /** @type {[SQLite.AST._CaseClause, ...SQLite.AST._CaseClause[]]} */
    (cases),
    alternate
  );
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
 * @param {TransformOptions} options
 * @return {SQLite.AST.Expr}
 */
const Program = (node, options) => {
  if (node.body.length === 0) {
    throw new Error('Program body must have at least 1 statement.');
  }

  return Statement(node.body[0], options);
};

/**
 * @param {ESTree.ReturnStatement} node
 * @param {TransformOptions} options
 * @return {SQLite.AST.Expr}
 */
const ReturnStatement = (node, options) => {
  if (!node.argument) {
    throw new Error('Expected block statement to return a value.');
  }

  return Expression(node.argument, options);
};

/**
 * @param {ESTree.Statement} node
 * @param {TransformOptions} options
 * @return {SQLite.AST.Expr}
 */
const Statement = (node, options) => {
  switch (node.type) {
    case 'BlockStatement':
      return BlockStatement(node, options);
    case 'ExpressionStatement':
      return ExpressionStatement(node, options);
    case 'FunctionDeclaration':
      return FunctionDeclaration(node, options);
    case 'IfStatement':
      return IfStatement(node, options);
    default:
      throw new TypeError(`Unexpected node type: ${node.type}`);
  }
};

/**
 * @param {ESTree.SwitchStatement} node
 * @param {TransformOptions} options
 * @return {SQLite.AST._CaseExpression}
 */
const SwitchStatement = (node, options) => {
  const discriminant = Expression(node.discriminant, options);

  /** @type {SQLite.AST._CaseClause[]} */
  const cases = [];

  /** @type {SQLite.AST.Expr | null} */
  let alternate = null;

  if (node.cases[0] === undefined) {
    throw new Error('Switch statement must have at least 1 case.');
  }

  for (const caseNode of node.cases) {
    const statement = caseNode.consequent[0];

    if (statement.type !== 'ReturnStatement') {
      throw new TypeError(`Unexpected case consequent statement type: ${statement.type}`);
    }

    if (caseNode.test === null) {
      alternate = ReturnStatement(statement, options);
    } else {
      const when = Expression(caseNode.test, options);
      const then = ReturnStatement(statement, options);

      cases.push(
        SQLite.Nodes._CaseClause(
          when,
          then
        )
      );
    }
  }

  return SQLite.Nodes._CaseExpression(
    discriminant,
    /** @type {[SQLite.AST._CaseClause, ...SQLite.AST._CaseClause[]]} */
    (cases),
    alternate
  );
};

/**
 * @param {ESTree.UnaryExpression} node
 * @param {TransformOptions} options
 * @return {SQLite.AST._UnaryExpression}
 */
const UnaryExpression = (node, options) => {
  const operator = _UnaryOperator(node.operator);
  const argument = Expression(node.argument, options);

  return SQLite.Nodes._UnaryExpression(
    operator,
    argument
  );
};

/**
 * @param {ESTree.Node} node
 * @param {TransformOptions} [options]
 * @return {SQLite.AST.Expr}
 */
export const transform = (node, options = {}) => {
  switch (node.type) {
    case 'Program':
      return Program(node, options);
    default:
      throw new TypeError(`Unexpected node type: ${node.type}`);
  }
};

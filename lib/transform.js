/**
 * @typedef {import('./_transform').Context} Context
 */

import Meriyah from 'meriyah';
import * as SQL from './ast.js';

const Arguments = ['row', 'global'];

/**
 * @see https://sqlite.org/lang_expr.html#operators
 */
const BinaryFunctionOperatorTransformMap = {
  glob: 'GLOB',
  like: 'LIKE',
  match: 'MATCH',
  regexp: 'REGEXP'
}

/**
 * @see https://sqlite.org/lang_expr.html#operators
 */
const BinaryOperatorTransformMap = {
  '*': '*',
  '/': '/',
  '%': '%',
  '+': '+',
  '-': '-',
  '<<': '<<',
  '>>': '>>',
  '&': '&',
  '|': '|',
  '<': '<',
  '<=': '<=',
  '>': '>',
  '>=': '>=',
  '==': '=',
  '===': '=',
  '!=': '!=',
  '!==': '!=',
  '&&': 'AND',
  '||': 'OR'
};

/**
 * @return {Context}
 */
const createContext = () => {
  return {
    variables: {}
  };
};

/**
 * @param {Meriyah.ESTree.Node} node
 * @return {string[]}
 */
const getPath = (node) => {
  const path = [];

  while (node.type === 'MemberExpression') {
    if (node.computed) {
      if (node.property.type !== 'Literal') {
        throw new SyntaxError(`Unexpected MemberExpression property type: "${node.property.type}"`);
      } else if (
        typeof node.property.value !== 'number' &&
        typeof node.property.value !== 'string'
      ) {
        throw new SyntaxError(
          `Unexpected MemberExpression property value type: "${typeof node.property.type}"`
        );
      }

      path.unshift(String(node.property.value));
    } else {
      if (node.property.type !== 'Identifier') {
        throw new SyntaxError(`Unexpected MemberExpression property type: "${node.property.type}"`);
      }

      path.unshift(node.property.name);
    }
    
    node = node.object;
  }

  if (node.type !== 'Identifier') {
    throw new SyntaxError(`Unexpected node type: "${node.type}"`);
  }

  path.unshift(node.name);

  return path;
};

/**
 * @param {Meriyah.ESTree.BinaryExpression | Meriyah.ESTree.LogicalExpression} node
 * @param {Context} context
 * @return {SQL.BinaryExpression}
 */
const transformBinaryLikeExpression = (node, context) => {
  const operator = BinaryOperatorTransformMap[node.operator];

  if (operator === undefined) {
    throw new SyntaxError(`Unexpected binary-like expression operator: "${node.operator}"`);
  }

  const left = transform(node.left, context);
  const right = transform(node.right, context);

  return SQL.BinaryExpression(operator, left, right);
};

/**
 * @param {Meriyah.ESTree.BlockStatement} node
 * @param {Context} context
 */
const transformBlockStatement = (node, context) => {
  if (node.body.length !== 1) {
    throw new SyntaxError('Block statement body must contain exactly one node.');
  }

  return transform(node.body[0], context);
};

/**
 * @param {Meriyah.ESTree.CallExpression} node
 * @param {Context} context
 * @return {SQL.BinaryExpression | SQL.CallExpression}
 */
const transformCallExpression = (node, context) => {
  const source = getPath(node.callee);
  const target = context.variables[source.join('.')];

  if (target[0] === 'global') {
    const operator = BinaryFunctionOperatorTransformMap[source[source.length - 1]];
    
    if (operator !== undefined) {
      if (node.arguments.length !== 2) {
        throw new Error(`Function "${target.join('.')}" requires 2 arguments.`);
      }

      const left = transform(node.arguments[0], context);
      const right = transform(node.arguments[1], context);

      return SQL.BinaryExpression(operator, left, right);
    }
  }

  const callee = transform(node.callee, context);
  const args = node.arguments.map((argument) => transform(argument, context));

  return SQL.CallExpression(callee, args);
};

/**
 * @param {Meriyah.ESTree.Parameter[]} params
 * @param {Meriyah.ESTree.Expression | Meriyah.ESTree.BlockStatement} body
 * @param {Context} context
 */
const transformFunction = (params, body, context) => {
  const childContext = { ...context };

  for (let i = 0; i < params.length; i++) {
    let param = params[i];

    if (param.type === 'AssignmentPattern') {
      param = param.left;
    }

    switch (param.type) {
      case 'ArrayPattern': {
        for (let j = 0; j < param.elements.length; j++) {
          let element = param.elements[j];
          /**
           * Workaround for incorrect type definition (2020-12-12).
           * @type {Meriyah.ESTree.AssignmentPattern}
           */
          const assignmentPattern = (/** @type {any} */ (element));

          if (assignmentPattern.type === 'AssignmentPattern') {
            element = assignmentPattern.left;
          }

          if (element.type !== 'Identifier') {
            throw new SyntaxError(`Unexpected element node type: "${element.type}"`);
          }

          const source = element.name;
          const target = [Arguments[i], String(j)];
          childContext.variables[source] = target;
        }

        break;
      }
      case 'RestElement': {
        if (param.argument.type === 'Identifier') {
          for (let j = i; j < Arguments.length; j++) {
            const source = `${param.argument.name}.${j - i}`;
            const target = [Arguments[j]];
            childContext.variables[source] = target;
          }
        }

        break;
      }
      case 'Identifier': {
        if (i < Arguments.length) {
          const source = param.name;
          const target = [Arguments[i]];
          childContext.variables[source] = target;
        }

        break;
      }
      case 'ObjectPattern': {
        for (const property of param.properties) {
          if (property.type !== 'Property') {
            const { type } = property;
            throw new SyntaxError(`Unexpected property node type: "${type}"`);
          } else if (property.key.type !== 'Identifier') {
            const { type } = property.key;
            throw new SyntaxError(`Unexpected property key node type: "${type}"`);
          } else if (property.value.type !== 'Identifier') {
            const { type } = property.value;
            throw new SyntaxError(`Unexpected property value node type: "${type}"`);
          }

          const source = property.value.name;
          const target = [Arguments[i], property.key.name];
          childContext.variables[source] = target;
        }

        break;
      }
    }
  }

  return transform(body, childContext);
};

/**
 * @param {Meriyah.ESTree.Identifier} node
 * @return {SQL.Identifier}
 */
const transformIdentifier = (node) => {
  return SQL.Identifier(node.name);
};

/**
 * @param {Meriyah.ESTree.Literal} node
 * @return {SQL.Literal}
 */
const transformLiteral = (node) => {
  if (typeof node.value !== 'number' && typeof node.value !== 'string') {
    throw new SyntaxError(`Unexpected value type: ${node.value}`);
  }

  return SQL.Literal(node.value);
};

/**
 * @param {Meriyah.ESTree.MemberExpression} node
 * @param {Context} context
 * @return {SQL.MemberExpression}
 */
const transformMemberExpression = (node, context) => {
  const object = transform(node.object, context);
  const property = transform(node.property, context);

  return SQL.MemberExpression(object, property);
};

/**
 * @param {Meriyah.ESTree.Program} node
 * @param {Context} context
 */
const transformProgram = (node, context) => {
  if (node.body.length !== 1) {
    throw new SyntaxError('Program body must contain exactly one node.');
  }

  return transform(node.body[0], context);
};

/**
 * @param {Meriyah.ESTree.Node} node
 * @param {Context} context
 */
export const transform = (node, context = createContext()) => {
  switch (node.type) {
    case 'ArrowFunctionExpression':
      return transformFunction(node.params, node.body, context);
    case 'BinaryExpression':
    case 'LogicalExpression':
      return transformBinaryLikeExpression(node, context);
    case 'BlockStatement':
      return transformBlockStatement(node, context);
    case 'CallExpression':
      return transformCallExpression(node, context);
    case 'ExpressionStatement':
      return transform(node.expression, context);
    case 'Identifier':
      return transformIdentifier(node);
    case 'Literal':
      return transformLiteral(node);
    case 'MemberExpression':
      return transformMemberExpression(node, context);
    case 'Program':
      return transformProgram(node, context);
    case 'ReturnStatement':
      return transform(node.argument, context);
    default:
      throw new Error(`Unexpected node type: "${node.type}"`);
  }
};

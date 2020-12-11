/**
 * @see https://sqlite.org/lang_expr.html#operators
 */
const BinaryOperatorTransformMap = {
  '&&': 'AND',
  '||': 'OR',
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
  '===': '=',
  '!==': '!='
};

/**
 * @see https://sqlite.org/lang_expr.html#operators
 */
const UnaryOperatorTransformMap = {
  '-': '-',
  '+': '+',
  '~': '~',
  '!': 'NOT'
};

export const transform = (node) => {
  switch (node.type) {
    case 'ArrayExpression': {
      return {
        type: 'ArrayExpression',
        elements: node.elements.map((element) => transform(element))
      };
    }
    case 'BinaryExpression':
    case 'LogicalExpression': {
      const operator = BinaryOperatorTransformMap[node.operator];

      if (operator === undefined) {
        throw new SyntaxError(
          `Unexpected BinaryExpression/LogicalExpression operator: ${node.operator}`
        );
      }

      return {
        type: 'BinaryExpression',
        left: transform(node.left),
        right: transform(node.right),
        operator
      };
    }
    case 'CallExpression': {
      if (
        node.callee.type === 'MemberExpression' &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'includes'
      ) {
        return {
          type: 'BinaryExpression',
          left: transform(node.arguments[0]),
          right: transform(node.callee.object),
          operator: 'IN'
        };
      }

      return node;
    }
    case 'FunctionExpression': {
      return transform(node.body.body[0].argument);
    }
    case 'Literal': {
      return {
        type: 'Literal',
        value: node.value
      };
    }
    case 'MemberExpression': {
      return {
        type: 'MemberExpression',
        object: node.object,
        property: node.property
      };
    }
    case 'Program': {
      return transform(node.body[0].expression);
    }
    default: {
      throw new TypeError(`Unexpected node type: ${node.type}`);
    }
  }
};

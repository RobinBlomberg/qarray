export const compile = (node) => {
  switch (node.type) {
    case 'ArrayExpression': {
      let sql = '';

      sql += '[';

      for (let i = 0; i < node.elements.length; i++) {
        if (i > 0) {
          sql += ', ';
        }

        sql += compile(node.elements[i]);
      }

      sql += ']';

      return sql;
    }
    case 'BinaryExpression':
    case 'LogicalExpression': {
      let sql = '';

      sql += compile(node.left);
      sql += ' ';
      sql += node.operator;
      sql += ' ';
      sql += compile(node.right);

      return sql;
    }
    case 'Identifier': {
      return node.name;
    }
    case 'Literal': {
      return typeof node.value === 'string'
        ? `'${node.value}'`
        : node.value;
    }
    case 'MemberExpression': {
      let sql = '';

      sql += compile(node.object);
      sql += '.';
      sql += compile(node.property);

      return sql;
    }
    default: {
      throw new TypeError(`Unexpected node type: ${node.type}`);
    }
  }
};

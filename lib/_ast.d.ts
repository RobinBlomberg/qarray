export type BinaryExpression = {
  type: 'BinaryExpression';
  operator: BinaryOperator;
  left: Expression;
  right: Expression;
};

export type BinaryOperator =
  | '||'
  | '*'
  | '/'
  | '%'
  | '+'
  | '-'
  | '<<'
  | '>>'
  | '&'
  | '|'
  | '<'
  | '<='
  | '>'
  | '>='
  | '='
  | '=='
  | '!='
  | '<>'
  | 'IS'
  | 'IS NOT'
  | 'IN'
  | 'LIKE'
  | 'GLOB'
  | 'MATCH'
  | 'REGEXP'
  | 'AND'
  | 'OR';

export type CallExpression = {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
};

export type Expression =
  | BinaryExpression
  | Identifier
  | Literal
  | MemberExpression;

export type Identifier = {
  type: 'Identifier';
  name: string;
};

export type Literal = {
  type: 'Literal';
  value: number | string;
};

export type MemberExpression = {
  type: 'MemberExpression';
  object: Identifier;
  property: Identifier;
};

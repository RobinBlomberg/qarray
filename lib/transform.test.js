import Chai from 'chai';
import { parse } from 'meriyah';
import * as SQLite from '@robinblomberg/sqlite-compiler';
import { transform } from './transform.js';

describe('@robinblomberg/qarray', () => {
  describe('transform', () => {
    describe('ArrayExpression', () => {
      it('[a, b]', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('[a, b]')
          ),
          SQLite.Nodes._ArrayExpression(
            [
              SQLite.Nodes._Identifier('a'),
              SQLite.Nodes._Identifier('b')
            ]
          )
        );
      });
    });

    describe('ArrowExpression', () => {
      it('() => { return 3; };', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('() => { return 3; };')
          ),
          SQLite.Nodes._NumericLiteral(3)
        );
      });

      it('() => 3;', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('() => 3;')
          ),
          SQLite.Nodes._NumericLiteral(3)
        );
      });
    });

    describe('BinaryExpression', () => {
      it('a + b', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('a + b')
          ),
          SQLite.Nodes._BinaryExpression(
            SQLite.Nodes._Identifier('a'),
            '+',
            SQLite.Nodes._Identifier('b')
          )
        );
      });
    });

    describe('CallExpression', () => {
      it('a()', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('a()')
          ),
          SQLite.Nodes._FunctionInvocation(
            SQLite.Nodes._Identifier('a'),
            null,
            null,
            null
          )
        );
      });

      it('a(b, c)', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('a(b, c)')
          ),
          SQLite.Nodes._FunctionInvocation(
            SQLite.Nodes._Identifier('a'),
            SQLite.Nodes._Args(
              false,
              [
                SQLite.Nodes._Identifier('b'),
                SQLite.Nodes._Identifier('c')
              ]
            ),
            null,
            null
          )
        );
      });
    });

    describe('ConditionalExpression', () => {
      it('a ? b : c;', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('a ? b : c;')
          ),
          SQLite.Nodes._CaseExpression(
            null,
            [
              SQLite.Nodes._CaseClause(
                SQLite.Nodes._Identifier('a'),
                SQLite.Nodes._Identifier('b')
              )
            ],
            SQLite.Nodes._Identifier('c')
          )
        );
      });

      it('a ? b ? c : d : e;', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('a ? b ? c : d : e;')
          ),
          SQLite.Nodes._CaseExpression(
            null,
            [
              SQLite.Nodes._CaseClause(
                SQLite.Nodes._Identifier('a'),
                SQLite.Nodes._CaseExpression(
                  null,
                  [
                    SQLite.Nodes._CaseClause(
                      SQLite.Nodes._Identifier('b'),
                      SQLite.Nodes._Identifier('c')
                    )
                  ],
                  SQLite.Nodes._Identifier('d')
                )
              )
            ],
            SQLite.Nodes._Identifier('e')
          )
        );
      });

      it('a ? b : c ? d : e;', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('a ? b : c ? d : e;')
          ),
          SQLite.Nodes._CaseExpression(
            null,
            [
              SQLite.Nodes._CaseClause(
                SQLite.Nodes._Identifier('a'),
                SQLite.Nodes._Identifier('b')
              )
            ],
            SQLite.Nodes._CaseExpression(
              null,
              [
                SQLite.Nodes._CaseClause(
                  SQLite.Nodes._Identifier('c'),
                  SQLite.Nodes._Identifier('d')
                )
              ],
              SQLite.Nodes._Identifier('e')
            )
          )
        );
      });
    });

    describe('FunctionExpression', () => {
      it('(function() { return 3; })', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('(function() { return 3; })')
          ),
          SQLite.Nodes._NumericLiteral(3)
        );
      });
    });

    describe('Identifier', () => {
      it('a', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('a')
          ),
          SQLite.Nodes._Identifier('a')
        );
      });
    });

    describe('IfStatement', () => {
      it('(function() { if (a) { return b; } })', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse(
              '(function() { if (a) { return b; } })'
            )
          ),
          SQLite.Nodes._CaseExpression(
            null,
            [
              SQLite.Nodes._CaseClause(
                SQLite.Nodes._Identifier('a'),
                SQLite.Nodes._Identifier('b')
              )
            ],
            null
          )
        );
      });

      it('(function() { if (a) { return b; } else if (c) { return d; } ' +
        'else { return e; } })', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse(
              '(function() { if (a) { return b; } else if (c) { return d; } else { return e; } })'
            )
          ),
          SQLite.Nodes._CaseExpression(
            null,
            [
              SQLite.Nodes._CaseClause(
                SQLite.Nodes._Identifier('a'),
                SQLite.Nodes._Identifier('b')
              ),
              SQLite.Nodes._CaseClause(
                SQLite.Nodes._Identifier('c'),
                SQLite.Nodes._Identifier('d')
              )
            ],
            SQLite.Nodes._Identifier('e')
          )
        );
      });

      it('(function() { if (a) { return b; } return c; })', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('(function() { if (a) { return b; } return c; })')
          ),
          SQLite.Nodes._CaseExpression(
            null,
            [
              SQLite.Nodes._CaseClause(
                SQLite.Nodes._Identifier('a'),
                SQLite.Nodes._Identifier('b')
              )
            ],
            SQLite.Nodes._Identifier('c')
          )
        );
      });

      it('(function() { if (a) { return b; } if (c) { return d; } else { return e; } })', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('(function() { if (a) { return b; } if (c) { return d; } else { return e; } })')
          ),
          SQLite.Nodes._CaseExpression(
            null,
            [
              SQLite.Nodes._CaseClause(
                SQLite.Nodes._Identifier('a'),
                SQLite.Nodes._Identifier('b')
              ),
              SQLite.Nodes._CaseClause(
                SQLite.Nodes._Identifier('c'),
                SQLite.Nodes._Identifier('d')
              )
            ],
            SQLite.Nodes._Identifier('e')
          )
        );
      });

      it('(function() { if (a) { return b; } if (c) { return d; } ' +
        'else { return e ? f : g; } })', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse(
              '(function() { if (a) { return b; } if (c) { return d; } ' +
              'else { return e ? f : g; } })'
            )
          ),
          SQLite.Nodes._CaseExpression(
            null,
            [
              SQLite.Nodes._CaseClause(
                SQLite.Nodes._Identifier('a'),
                SQLite.Nodes._Identifier('b')
              ),
              SQLite.Nodes._CaseClause(
                SQLite.Nodes._Identifier('c'),
                SQLite.Nodes._Identifier('d')
              )
            ],
            SQLite.Nodes._CaseExpression(
              null,
              [
                SQLite.Nodes._CaseClause(
                  SQLite.Nodes._Identifier('e'),
                  SQLite.Nodes._Identifier('f')
                )
              ],
              SQLite.Nodes._Identifier('g')
            )
          )
        );
      });

      it('(function() { if (a) { return b; } return c ? d : e; })', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('(function() { if (a) { return b; } return c ? d : e; })')
          ),
          SQLite.Nodes._CaseExpression(
            null,
            [
              SQLite.Nodes._CaseClause(
                SQLite.Nodes._Identifier('a'),
                SQLite.Nodes._Identifier('b')
              ),
              SQLite.Nodes._CaseClause(
                SQLite.Nodes._Identifier('c'),
                SQLite.Nodes._Identifier('d')
              )
            ],
            SQLite.Nodes._Identifier('e')
          )
        );
      });
    });

    describe('Literal', () => {
      it('3', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('3')
          ),
          SQLite.Nodes._NumericLiteral(3)
        );
      });

      it('"a"', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('"a"')
          ),
          SQLite.Nodes._StringLiteral('a')
        );
      });
    });

    describe('LogicalExpression', () => {
      it('a && b', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('a && b')
          ),
          SQLite.Nodes._BinaryExpression(
            SQLite.Nodes._Identifier('a'),
            'AND',
            SQLite.Nodes._Identifier('b')
          )
        );
      });
    });

    describe('MemberExpression', () => {
      it('a.b', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('a.b')
          ),
          SQLite.Nodes._Path(
            SQLite.Nodes._Identifier('a'),
            SQLite.Nodes._Identifier('b')
          )
        );
      });

      it('a.b.c', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('a.b.c')
          ),
          SQLite.Nodes._QualifiedPath(
            SQLite.Nodes._Identifier('a'),
            SQLite.Nodes._Path(
              SQLite.Nodes._Identifier('b'),
              SQLite.Nodes._Identifier('c')
            )
          )
        );
      });
    });

    describe('SwitchStatement', () => {
      it('(function() { switch (a) { case b: return c; case d: return e; ' +
        'default: return f; } })', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse(
              '(function() { switch (a) { case b: return c; case d: return e; ' +
              'default: return f; } })'
            )
          ),
          SQLite.Nodes._CaseExpression(
            SQLite.Nodes._Identifier('a'),
            [
              SQLite.Nodes._CaseClause(
                SQLite.Nodes._Identifier('b'),
                SQLite.Nodes._Identifier('c')
              ),
              SQLite.Nodes._CaseClause(
                SQLite.Nodes._Identifier('d'),
                SQLite.Nodes._Identifier('e')
              )
            ],
            SQLite.Nodes._Identifier('f')
          )
        );
      });

      it('(function() { switch (a) { case b: return c; default: return d ? e : f; } })', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('(function() { switch (a) { case b: return c; default: return d ? e : f; } })')
          ),
          SQLite.Nodes._CaseExpression(
            SQLite.Nodes._Identifier('a'),
            [
              SQLite.Nodes._CaseClause(
                SQLite.Nodes._Identifier('b'),
                SQLite.Nodes._Identifier('c')
              )
            ],
            SQLite.Nodes._CaseExpression(
              null,
              [
                SQLite.Nodes._CaseClause(
                  SQLite.Nodes._Identifier('d'),
                  SQLite.Nodes._Identifier('e')
                )
              ],
              SQLite.Nodes._Identifier('f')
            )
          )
        );
      });
    });

    describe('UnaryExpression', () => {
      it('!a', () => {
        Chai.assert.deepStrictEqual(
          transform(
            parse('!a')
          ),
          SQLite.Nodes._UnaryExpression(
            'NOT',
            SQLite.Nodes._Identifier('a')
          )
        );
      });
    });
  });
});

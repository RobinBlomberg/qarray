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

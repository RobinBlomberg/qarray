import Chai from 'chai';
import Meriyah from 'meriyah';
import { ASTFactory as SQL, transform } from '../lib/index.js';

/**
 * @param {Function} fn
 */
const parseAndTransform = (fn) => {
  return transform(Meriyah.parse(fn.toString()));
};

describe('@robinblomberg/qarray', () => {
  describe('.transform', () => {
    it('should transform ArrowExpression Identifier parameters correctly', () => {
      Chai.assert.deepStrictEqual(
        parseAndTransform((user, sql) => {
          return user.age >= 3 && sql.like(user.name, 'j%');
        }),
        SQL.BinaryExpression(
          'AND',
          SQL.BinaryExpression(
            '>=',
            SQL.MemberExpression(
              SQL.Identifier('user'),
              SQL.Identifier('age')
            ),
            SQL.Literal(3)
          ),
          SQL.BinaryExpression(
            'LIKE',
            SQL.MemberExpression(
              SQL.Identifier('user'),
              SQL.Identifier('name')
            ),
            SQL.Literal('j%')
          )
        )
      );
    });

    it('should transform ArrowExpression ObjectPattern parameters correctly', () => {
      Chai.assert.deepStrictEqual(
        parseAndTransform((user, { like }) => {
          return user.age >= 3 && like(user.name, 'j%');
        }),
        SQL.BinaryExpression(
          'AND',
          SQL.BinaryExpression(
            '>=',
            SQL.MemberExpression(
              SQL.Identifier('user'),
              SQL.Identifier('age')
            ),
            SQL.Literal(3)
          ),
          SQL.BinaryExpression(
            'LIKE',
            SQL.MemberExpression(
              SQL.Identifier('user'),
              SQL.Identifier('name')
            ),
            SQL.Literal('j%')
          )
        )
      );
    });

    it('should transform ArrowExpression RestElement parameters correctly', () => {
      Chai.assert.deepStrictEqual(
        parseAndTransform((...args) => {
          return args[0].age >= 3 && args[1](args[0].name, 'j%');
        }),
        SQL.BinaryExpression(
          'AND',
          SQL.BinaryExpression(
            '>=',
            SQL.MemberExpression(
              SQL.Identifier('user'),
              SQL.Identifier('age')
            ),
            SQL.Literal(3)
          ),
          SQL.BinaryExpression(
            'LIKE',
            SQL.MemberExpression(
              SQL.Identifier('user'),
              SQL.Identifier('name')
            ),
            SQL.Literal('j%')
          )
        )
      );
    });
  });
});

import Chai from 'chai';
import { Table } from '../lib/index.js';

describe('Table', () => {
  describe('filter', () => {
    const Users = new Table('Users');

    Chai.assert.strictEqual(
      Users.filter((user) => {
        return user.age >= 18 && ['admin', 'editor'].includes(user.role);
      }),
      "SELECT * FROM Users WHERE user.age >= 18 AND user.role IN ['admin', 'editor'];"
    );
  });
});

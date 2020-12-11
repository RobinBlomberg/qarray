import Meriyah from 'meriyah';
import TS from 'typescript';
import { compile } from './internal/compile.js';
import { transform } from './internal/transform.js';

const CommandCache = {};

export class Table {
  constructor(name) {
    this.name = name;
  }

  filter(predicate) {
    const js = predicate.toString();
    
    if (CommandCache[js]) {
      return CommandCache[js];
    }
  
    const es3Ast = Meriyah.parse(TS.transpile(js, { target: TS.ScriptTarget.ES3 }));
    const sqlAst = transform(es3Ast);
    const whereSql = compile(sqlAst);
    const sql = `SELECT * FROM ${this.name} WHERE ${whereSql};`;
  
    CommandCache[js] = sql;
  
    return sql;
  }
}

const nps = require('@robinblomberg/nps')(exports);

nps.coverage = {
  description: 'Analyzes test code coverage.',
  script: 'nyc --all npm test'
};

nps.test = {
  description: 'Runs all tests.',
  script: 'mocha'
};

nps.testWatch = {
  description: 'Runs all tests in watch mode.',
  script: 'mocha --watch --parallel'
};

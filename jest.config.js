module.exports = {
  "preset": "ts-jest",
  "testEnvironment": "node",
  "globals": {
    "process.env.NODE_ENV": "test",
  },
  "moduleNameMapper": {
    '^@src/(.*)$': "<rootDir>/src/$1",
    '^@tests/(.*)$': "<rootDir>/tests/$1",

    "\\.(css)$": "<rootDir>/tests/__mocks__/styleMock.js"
  }
};

module.exports = {
  "preset": "ts-jest",
  "testEnvironment": "node",
  "globals": {
    "process.env.NODE_ENV": "test",
  },
  "moduleNameMapper": {
    '^@src/(.*)$': "<rootDir>/src/$1"
  }
};

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/app.ts"],
  globals: {
    "ts-jest": {
      tsconfig: {
        strict: false,
      },
    },
  },
};

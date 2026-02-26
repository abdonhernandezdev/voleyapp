/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'src/app/services/**/*.service.ts',
    'src/app/features/**/data-access/*.facade.ts',
    'src/app/core/guards/*.ts',
    'src/app/core/interceptors/*.ts',
    'src/app/shared/utils/*.ts',
    '!**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
  },
  moduleNameMapper: {
    '^@core/services/data-access/(.*)-api\\.service$':
      '<rootDir>/src/app/services/data-access/$1/$1-api.service',
    '^@core/services/(.*)\\.service$': '<rootDir>/src/app/services/$1/$1.service',
    '^@core/services/(.*)$': '<rootDir>/src/app/services/$1',
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@shared/models$': '<rootDir>/src/app/models/index.ts',
    '^@shared/models/(.*)$': '<rootDir>/src/app/models/$1',
    '^@features/(.*)$': '<rootDir>/src/app/features/$1',
    '^@env/(.*)$': '<rootDir>/src/environments/$1',
    '^@services/(.*)$': '<rootDir>/src/app/services/$1',
    '^@models/(.*)$': '<rootDir>/src/app/models/$1',
  },
};

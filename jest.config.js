export const testEnvironment = 'jsdom';
export const moduleNameMapper = {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
};
export const setupFilesAfterEnv = ['<rootDir>/src/setupTests.js'];
export const transform = {
    '^.+\\.(js|jsx)$': '@swc/jest',
};
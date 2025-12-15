// Mock for uuid package using CommonJS syntax
const v4 = jest.fn(() => 'mock-uuid-v4');
const v1 = jest.fn(() => 'mock-uuid-v1');
const v3 = jest.fn(() => 'mock-uuid-v3');
const v5 = jest.fn(() => 'mock-uuid-v5');
const NIL = '00000000-0000-0000-0000-000000000000';
const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
const validate = jest.fn(() => true);
const version = jest.fn(() => 4);

module.exports = {
  v4,
  v1,
  v3,
  v5,
  NIL,
  MAX,
  validate,
  version,
  default: {
    v4,
    v1,
    v3,
    v5,
    NIL,
    MAX,
    validate,
    version
  }
};


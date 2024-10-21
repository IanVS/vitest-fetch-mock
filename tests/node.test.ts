/**
 * @jest-environment node
 */
import { it, expect } from 'vitest';
import { createFetchMock } from '../src/index.js';

it('rejects with a dom exception', () => {
  const mock = createFetchMock();
  mock.enableMocks();
  mock.mockAbort();
  expect(fetch('/')).rejects.toThrow(expect.any(DOMException));
  mock.disableMocks();
});

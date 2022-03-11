/**
 * @jest-environment node
 */
import { it, expect } from 'vitest';

it('rejects with a dom exception', () => {
  fetch.mockAbort();
  expect(fetch('/')).rejects.toThrow(expect.any(globalThis.DOMException));
});

// TypeScript Version: 3.0
import Global = NodeJS.Global;
import { vitest } from 'vitest';
import type { Mock } from 'vitest';

declare global {
  const fetchMock: FetchMock;
  namespace NodeJS {
    interface Global {
      fetch: FetchMock;
    }
  }
}

export interface GlobalWithFetchMock extends Global {
  fetchMock: FetchMock;
  fetch: FetchMock;
}

export interface FetchMock
  extends Mock<[string | Request | undefined, RequestInit | undefined], Promise<Response>> {
  (input: string | Request, init?: RequestInit): Promise<Response>;

  // Response mocking
  mockResponse(fn: MockResponseInitFunction): FetchMock;
  mockResponse(response: string, responseInit?: MockParams): FetchMock;

  mockResponseOnce(fn: MockResponseInitFunction): FetchMock;
  mockResponseOnce(response: string, responseInit?: MockParams): FetchMock;

  // alias for mockResponseOnce
  once(fn: MockResponseInitFunction): FetchMock;
  once(url: string, responseInit?: MockParams): FetchMock;

  mockResponses(...responses: Array<string | [string, MockParams] | MockResponseInitFunction>): FetchMock;

  // Error/Reject mocking
  mockReject(error?: ErrorOrFunction): FetchMock;
  mockRejectOnce(error?: ErrorOrFunction): FetchMock;

  mockAbort(): FetchMock;
  mockAbortOnce(): FetchMock;

  // Conditional Mocking
  isMocking(input: string | Request): boolean;

  doMock(fn?: MockResponseInitFunction): FetchMock;
  doMock(response: string, responseInit?: MockParams): FetchMock;

  doMockOnce(fn?: MockResponseInitFunction): FetchMock;
  doMockOnce(response: string, responseInit?: MockParams): FetchMock;
  // alias for doMockOnce
  mockOnce(fn?: MockResponseInitFunction): FetchMock;
  mockOnce(response: string, responseInit?: MockParams): FetchMock;

  doMockIf(urlOrPredicate: UrlOrPredicate, fn?: MockResponseInitFunction): FetchMock;
  doMockIf(urlOrPredicate: UrlOrPredicate, response: string, responseInit?: MockParams): FetchMock;
  // alias for doMockIf
  mockIf(urlOrPredicate: UrlOrPredicate, fn?: MockResponseInitFunction): FetchMock;
  mockIf(urlOrPredicate: UrlOrPredicate, response: string, responseInit?: MockParams): FetchMock;

  doMockOnceIf(urlOrPredicate: UrlOrPredicate, fn?: MockResponseInitFunction): FetchMock;
  doMockOnceIf(urlOrPredicate: UrlOrPredicate, response: string, responseInit?: MockParams): FetchMock;
  // alias for doMocKOnceIf
  mockOnceIf(urlOrPredicate: UrlOrPredicate, fn?: MockResponseInitFunction): FetchMock;
  mockOnceIf(urlOrPredicate: UrlOrPredicate, response: string, responseInit?: MockParams): FetchMock;

  dontMock(fn?: MockResponseInitFunction): FetchMock;
  dontMock(response: string, responseInit?: MockParams): FetchMock;

  dontMockOnce(fn?: MockResponseInitFunction): FetchMock;
  dontMockOnce(response: string, responseInit?: MockParams): FetchMock;

  dontMockIf(urlOrPredicate: UrlOrPredicate, fn?: MockResponseInitFunction): FetchMock;
  dontMockIf(urlOrPredicate: UrlOrPredicate, response: string, responseInit?: MockParams): FetchMock;

  dontMockOnceIf(urlOrPredicate: UrlOrPredicate, fn?: MockResponseInitFunction): FetchMock;
  dontMockOnceIf(urlOrPredicate: UrlOrPredicate, response: string, responseInit?: MockParams): FetchMock;

  resetMocks(): void;
  enableMocks(): void;
  disableMocks(): void;
}

export interface MockParams {
  status?: number;
  statusText?: string;
  headers?: string[][] | { [key: string]: string }; // HeadersInit
  url?: string;
  /** Set >= 1 to have redirected return true. Only applicable to Node.js */
  counter?: number;
}

export interface MockResponseInit extends MockParams {
  body?: string;
  init?: MockParams;
}

export type ErrorOrFunction = Error | ((...args: any[]) => Promise<any>);
export type UrlOrPredicate = string | RegExp | ((input: Request) => boolean);

export type MockResponseInitFunction = (
  request: Request
) => MockResponseInit | string | Promise<MockResponseInit | string>;

declare const fetchMock: FetchMock;

declare function createMocker(vi: typeof vitest): FetchMock;

export default createMocker;

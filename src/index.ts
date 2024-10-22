import { vi as vitest } from 'vitest';
import type { Mock } from '@vitest/spy';

// type-definitions
export type FetchMock = Mock<typeof global.fetch> & FetchMockObject;

class FetchMockObject {
  private readonly isMocking = vitest.fn(always(true));

  constructor(
    private mockedFetch: Mock<typeof global.fetch>,
    private originalFetch: typeof global.fetch,
    private chainingResultProvider: () => FetchMock
  ) {}

  // enable/disable
  enableMocks(): FetchMock {
    globalThis.fetch = this.mockedFetch;
    return this.chainingResultProvider();
  }

  disableMocks(): FetchMock {
    globalThis.fetch = this.originalFetch;
    return this.chainingResultProvider();
  }

  // reset
  resetMocks(): FetchMock {
    this.mockedFetch.mockRestore();
    return this.chainingResultProvider();
  }

  // mocking functions
  mockResponse(responseProvider: ResponseProvider): FetchMock;
  mockResponse(response: ResponseBody, params?: MockParams): FetchMock;
  mockResponse(responseProviderOrBody: ResponseProvider | ResponseBody, params?: MockParams): FetchMock;
  mockResponse(responseProviderOrBody: ResponseProvider | ResponseBody, params?: MockParams): FetchMock {
    this.mockedFetch.mockImplementation((input: RequestInput, requestInit?: RequestInit) => {
      if (!this.isMocking(input, requestInit)) {
        return this.originalFetch(input, requestInit);
      }

      const request = normalizeRequest(input, requestInit);
      return buildResponse(request, responseProviderOrBody, params);
    });

    return this.chainingResultProvider();
  }

  mockResponseOnce(responseProvider: ResponseProvider): FetchMock;
  mockResponseOnce(response: ResponseBody, params?: MockParams): FetchMock;
  mockResponseOnce(responseProviderOrBody: ResponseProvider | ResponseBody, params?: MockParams): FetchMock;
  mockResponseOnce(responseProviderOrBody: ResponseProvider | ResponseBody, params?: MockParams): FetchMock {
    this.mockedFetch.mockImplementationOnce((input: RequestInput, requestInit?: RequestInit) => {
      if (!this.isMocking(input, requestInit)) {
        return this.originalFetch(input, requestInit);
      }
      const request = normalizeRequest(input, requestInit);
      return buildResponse(request, responseProviderOrBody, params);
    });
    return this.chainingResultProvider();
  }

  mockResponseIf(urlOrPredicate: UrlOrPredicate, responseProvider: ResponseProvider): FetchMock;
  mockResponseIf(urlOrPredicate: UrlOrPredicate, response: ResponseBody, params?: MockParams): FetchMock;
  mockResponseIf(
    urlOrPredicate: UrlOrPredicate,
    responseProviderOrBody: ResponseProvider | ResponseBody,
    params?: MockParams
  ): FetchMock {
    this.mockedFetch.mockImplementation((input: RequestInput, requestInit?: RequestInit) => {
      if (!this.isMocking(input, requestInit)) {
        return this.originalFetch(input, requestInit);
      }
      const request = normalizeRequest(input, requestInit);
      return requestMatches(request, urlOrPredicate)
        ? buildResponse(request, responseProviderOrBody, params)
        : this.originalFetch(input, requestInit);
    });
    return this.chainingResultProvider();
  }

  mockResponseOnceIf(urlOrPredicate: UrlOrPredicate, responseProvider: ResponseProvider): FetchMock;
  mockResponseOnceIf(urlOrPredicate: UrlOrPredicate, response: ResponseBody, params?: MockParams): FetchMock;
  mockResponseOnceIf(
    urlOrPredicate: UrlOrPredicate,
    responseProviderOrBody: ResponseProvider | ResponseBody,
    params?: MockParams
  ): FetchMock {
    this.isMocking.mockImplementationOnce((input, requestInit) =>
      requestMatches(normalizeRequest(input, requestInit), urlOrPredicate)
    );
    this.mockedFetch.mockImplementationOnce((input: RequestInput, requestInit?: RequestInit) => {
      if (!this.isMocking(input, requestInit)) {
        return this.originalFetch(input, requestInit);
      }
      const request = normalizeRequest(input, requestInit);
      return requestMatches(request, urlOrPredicate)
        ? buildResponse(request, responseProviderOrBody, params)
        : this.originalFetch(input, requestInit);
    });
    return this.chainingResultProvider();
  }

  mockResponses(...responses: Array<ResponseBody | [ResponseBody, MockParams?] | ResponseProvider>): FetchMock {
    responses.forEach((response) => {
      if (Array.isArray(response)) {
        const [body, init] = response;
        this.mockedFetch.mockImplementationOnce((input) => {
          if (!this.isMocking(input)) {
            return this.originalFetch(input);
          }
          const request = normalizeRequest(input);
          return buildResponse(request, body, init);
        });
      } else {
        this.mockedFetch.mockImplementationOnce((input) => {
          if (!this.isMocking(input)) {
            return this.originalFetch(input);
          }
          const request = normalizeRequest(input);
          return buildResponse(request, response);
        });
      }
    });
    return this.chainingResultProvider();
  }

  // abort
  mockAbort(): FetchMock {
    this.mockedFetch.mockImplementation(() => abortAsync());
    return this.chainingResultProvider();
  }

  mockAbortOnce(): FetchMock {
    this.mockedFetch.mockImplementationOnce(() => abortAsync());
    return this.chainingResultProvider();
  }

  // reject (error)
  mockReject(error?: ErrorOrFunction): FetchMock {
    this.mockedFetch.mockImplementation(() => normalizeError(error));
    return this.chainingResultProvider();
  }

  mockRejectOnce(error?: ErrorOrFunction): FetchMock {
    this.mockedFetch.mockImplementationOnce(() => normalizeError(error));
    return this.chainingResultProvider();
  }

  // enable/disable
  doMock(responseProvider?: ResponseProvider): FetchMock;
  doMock(response: ResponseBody, params?: MockParams): FetchMock;
  doMock(responseProviderOrBody?: ResponseProvider | ResponseBody, params?: MockParams): FetchMock {
    this.isMocking.mockImplementation(always(true));
    if (responseProviderOrBody) {
      this.mockResponse(responseProviderOrBody, params);
    }
    return this.chainingResultProvider();
  }

  doMockOnce(responseProvider?: ResponseProvider): FetchMock;
  doMockOnce(response: ResponseBody, params?: MockParams): FetchMock;
  doMockOnce(responseProviderOrBody?: ResponseProvider | ResponseBody, params?: MockParams): FetchMock;
  doMockOnce(responseProviderOrBody?: ResponseProvider | ResponseBody, params?: MockParams): FetchMock {
    this.isMocking.mockImplementationOnce(always(true));
    if (responseProviderOrBody) {
      this.mockResponseOnce(responseProviderOrBody, params);
    }
    return this.chainingResultProvider();
  }

  doMockIf(urlOrPredicate: UrlOrPredicate, responseProvider?: ResponseProvider): FetchMock;
  doMockIf(urlOrPredicate: UrlOrPredicate, response: ResponseBody, params?: MockParams): FetchMock;
  doMockIf(
    urlOrPredicate: UrlOrPredicate,
    responseProviderOrBody?: ResponseProvider | ResponseBody,
    params?: MockParams
  ): FetchMock;
  doMockIf(
    urlOrPredicate: UrlOrPredicate,
    responseProviderOrBody?: ResponseProvider | ResponseBody,
    params?: MockParams
  ): FetchMock {
    this.isMocking.mockImplementation((input, requestInit) =>
      requestMatches(normalizeRequest(input, requestInit), urlOrPredicate)
    );
    if (responseProviderOrBody) {
      this.mockResponse(responseProviderOrBody, params);
    }
    return this.chainingResultProvider();
  }

  doMockOnceIf(urlOrPredicate: UrlOrPredicate, responseProvider?: ResponseProvider): FetchMock;
  doMockOnceIf(urlOrPredicate: UrlOrPredicate, response: ResponseBody, params?: MockParams): FetchMock;
  doMockOnceIf(
    urlOrPredicate: UrlOrPredicate,
    responseProviderOrBody?: ResponseProvider | ResponseBody,
    params?: MockParams
  ): FetchMock;
  doMockOnceIf(
    urlOrPredicate: UrlOrPredicate,
    responseProviderOrBody?: ResponseProvider | ResponseBody,
    params?: MockParams
  ): FetchMock {
    this.isMocking.mockImplementationOnce((input, requestInit) =>
      requestMatches(normalizeRequest(input, requestInit), urlOrPredicate)
    );
    if (responseProviderOrBody) {
      this.mockResponseOnce(responseProviderOrBody, params);
    }
    return this.chainingResultProvider();
  }

  dontMock(): FetchMock {
    this.isMocking.mockImplementation(always(false));
    return this.chainingResultProvider();
  }

  dontMockOnce(): FetchMock {
    this.isMocking.mockImplementationOnce(always(false));
    return this.chainingResultProvider();
  }

  dontMockIf(urlOrPredicate: UrlOrPredicate): FetchMock {
    this.isMocking.mockImplementation((input, requestInit) =>
      requestNotMatches(normalizeRequest(input, requestInit), urlOrPredicate)
    );
    return this.chainingResultProvider();
  }

  dontMockOnceIf(urlOrPredicate: UrlOrPredicate): FetchMock {
    this.isMocking.mockImplementationOnce((input, requestInit) =>
      requestNotMatches(normalizeRequest(input, requestInit), urlOrPredicate)
    );
    return this.chainingResultProvider();
  }

  // recording
  requests(): Request[] {
    return this.mockedFetch.mock.calls
      .map(([input, requestInit]) => {
        try {
          return normalizeRequest(input, requestInit);
        } catch (e) {
          return undefined;
        }
      })
      .filter((it) => it !== undefined);
  }

  // aliases

  /**
   * alias for mockResponseOnce
   */
  once(responseProvider: ResponseProvider): FetchMock;
  once(response: ResponseBody, params?: MockParams): FetchMock;
  once(responseProviderOrBody: ResponseProvider | ResponseBody, params?: MockParams): FetchMock {
    return this.mockResponseOnce(responseProviderOrBody, params);
  }

  /**
   * alias for doMockOnce
   */
  mockOnce(responseProvider?: ResponseProvider): FetchMock;
  mockOnce(response: ResponseBody, params?: MockParams): FetchMock;
  mockOnce(responseProviderOrBody?: ResponseProvider | ResponseBody, params?: MockParams): FetchMock {
    return this.doMockOnce(responseProviderOrBody, params);
  }

  /**
   * alias for doMockIf
   */
  mockIf(urlOrPredicate: UrlOrPredicate, responseProvider?: ResponseProvider): FetchMock;
  mockIf(urlOrPredicate: UrlOrPredicate, response: ResponseBody, params?: MockParams): FetchMock;
  mockIf(
    urlOrPredicate: UrlOrPredicate,
    responseProviderOrBody?: ResponseProvider | ResponseBody,
    params?: MockParams
  ): FetchMock {
    return this.doMockIf(urlOrPredicate, responseProviderOrBody, params);
  }

  /**
   * alias for doMockOnceIf
   */
  mockOnceIf(urlOrPredicate: UrlOrPredicate, responseProvider?: ResponseProvider): FetchMock;
  mockOnceIf(urlOrPredicate: UrlOrPredicate, response: ResponseBody, params?: MockParams): FetchMock;
  mockOnceIf(
    urlOrPredicate: UrlOrPredicate,
    responseProviderOrBody?: ResponseProvider | ResponseBody,
    params?: MockParams
  ): FetchMock {
    return this.doMockOnceIf(urlOrPredicate, responseProviderOrBody, params);
  }
}

type UrlOrPredicate = string | RegExp | ((input: Request) => boolean);
type RequestInput = string | URL | Request;
type ResponseProvider = (request: Request) => ResponseLike | Promise<ResponseLike>;
type ResponseLike = MockResponse | ResponseBody | Response;
type ResponseBody = string;
type ErrorOrFunction = Error | string | ((...args: any[]) => Promise<Response>);

export interface MockParams {
  status?: number;
  statusText?: string;
  headers?: [string, string][] | Record<string, string>; // HeadersInit
  url?: string;
  /** Set >= 1 to have redirected return true. Only applicable to Node.js */
  counter?: number;
}

export interface MockResponse extends MockParams {
  body?: string;
}

// factory
export default function createFetchMock(vi: typeof vitest): FetchMock {
  const isMocking = vi.fn(always(true));

  const originalFetch = globalThis.fetch;
  const mockedFetch = vi.fn((input, requestInit) => {
    if (!isMocking(input, requestInit)) {
      return originalFetch(input, requestInit);
    }
    return buildResponse(normalizeRequest(input, requestInit), '');
  }) as FetchMock;

  const fetchMock: FetchMock = mockedFetch as FetchMock;
  const fetchMockObject = new FetchMockObject(mockedFetch, globalThis.fetch, () => fetchMock);

  copyMethods(fetchMockObject, fetchMock);

  return mockedFetch;
}

function requestMatches(request: Request, urlOrPredicate: UrlOrPredicate): boolean {
  if (urlOrPredicate instanceof RegExp) {
    return urlOrPredicate.test(request.url);
  } else if (typeof urlOrPredicate === 'string') {
    return request.url === urlOrPredicate;
  } else {
    return urlOrPredicate(request);
  }
}

function requestNotMatches(request: Request, urlOrPredicate: UrlOrPredicate): boolean {
  return !requestMatches(request, urlOrPredicate);
}

function normalizeRequest(input: RequestInput, requestInit?: RequestInit): Request {
  if (input instanceof Request) {
    if (input.signal && input.signal.aborted) {
      abort();
    }
    return input;
  } else if (typeof input === 'string') {
    if (requestInit && requestInit.signal && requestInit.signal.aborted) {
      abort();
    }
    return new Request(input, requestInit);
  } else {
    if (requestInit && requestInit.signal && requestInit.signal.aborted) {
      abort();
    }
    return new Request(input.toString(), requestInit);
  }
}

async function buildResponse(
  request: Request,
  responseProviderOrBody: ResponseProvider | ResponseBody,
  params?: MockParams
): Promise<Response> {
  if (typeof responseProviderOrBody === 'string') {
    const responseBody = responseProviderOrBody as ResponseBody;

    if (request.signal && request.signal.aborted) {
      abort();
    }

    return new Response(responseBody, params);
  } else {
    const responseProvider = responseProviderOrBody as ResponseProvider;
    const mockResponse = await responseProvider(request);

    if (request.signal && request.signal.aborted) {
      abort();
    }

    return typeof mockResponse === 'string'
      ? new Response(mockResponse, params)
      : mockResponse instanceof Response
        ? mockResponse
        : patchUrl(new Response(mockResponse.body, { ...params, ...mockResponse }), mockResponse.url ?? params?.url);
  }
}

// see: https://stackoverflow.com/questions/70002424/url-is-empty-when-defining-a-response-object
function patchUrl(response: Response, url?: string): Response {
  if (url) {
    Object.defineProperty(response, 'url', { value: url });
  }

  return response;
}

function always(toggle: boolean): (input: RequestInput, requestInit?: RequestInit) => boolean {
  return () => toggle;
}

const normalizeError = (errorOrFunction?: ErrorOrFunction): Promise<Response> =>
  typeof errorOrFunction === 'function' ? errorOrFunction() : Promise.reject(errorOrFunction);

function abortError(): Error {
  return new DOMException('The operation was aborted.');
}

function abort(): never {
  throw abortError();
}

function abortAsync(): Promise<never> {
  return Promise.reject(abortError());
}

function copyMethods<T>(source: T, target: T) {
  Object.getOwnPropertyNames(FetchMockObject.prototype).forEach((propertyName) => {
    const propertyFromSource = source[propertyName as keyof T];
    if (propertyName !== 'constructor' && typeof propertyFromSource === 'function') {
      target[propertyName as keyof T] = propertyFromSource.bind(source);
    }
  });
}

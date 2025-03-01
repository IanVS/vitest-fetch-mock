import { vi as vitest, type Mock } from 'vitest';

declare global {
  // eslint-disable-next-line no-var
  var fetchMock: FetchMock;

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      fetchMock: FetchMock;
    }
  }
}

export type FetchMock = Mock<typeof global.fetch> & FetchMockObject;

class FetchMockObject {
  public readonly isMocking = vitest.fn(always(true));

  constructor(
    private mockedFetch: Mock<typeof global.fetch>,
    private originalFetch: typeof global.fetch,
    private chainingResultProvider: () => FetchMock
  ) {}

  // enable/disable
  enableMocks(): FetchMock {
    globalThis.fetch = this.mockedFetch;
    globalThis.fetchMock = this.chainingResultProvider();
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
  mockResponse(responseProvider: ResponseProvider, params?: MockParams): FetchMock {
    this.mockedFetch.mockImplementation((input: RequestInput, requestInit?: RequestInit) => {
      if (!this.isMocking(input, requestInit)) {
        return this.originalFetch(input, requestInit);
      }

      const request = normalizeRequest(input, requestInit);
      return buildResponse(request, responseProvider, params);
    });

    return this.chainingResultProvider();
  }

  mockResponseOnce(responseProvider: ResponseProvider, params?: MockParams): FetchMock {
    this.mockedFetch.mockImplementationOnce((input: RequestInput, requestInit?: RequestInit) => {
      if (!this.isMocking(input, requestInit)) {
        return this.originalFetch(input, requestInit);
      }
      const request = normalizeRequest(input, requestInit);
      return buildResponse(request, responseProvider, params);
    });
    return this.chainingResultProvider();
  }

  mockResponseIf(urlOrPredicate: UrlOrPredicate, responseProvider: ResponseProvider, params?: MockParams): FetchMock {
    this.mockedFetch.mockImplementation((input: RequestInput, requestInit?: RequestInit) => {
      if (!this.isMocking(input, requestInit)) {
        return this.originalFetch(input, requestInit);
      }
      const request = normalizeRequest(input, requestInit);
      return requestMatches(request, urlOrPredicate)
        ? buildResponse(request, responseProvider, params)
        : this.originalFetch(input, requestInit);
    });
    return this.chainingResultProvider();
  }

  mockResponseOnceIf(
    urlOrPredicate: UrlOrPredicate,
    responseProvider: ResponseProvider,
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
        ? buildResponse(request, responseProvider, params)
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
    this.mockedFetch.mockImplementation((input: RequestInput, requestInit?: RequestInit) =>
      normalizeError(normalizeRequest(input, requestInit), error)
    );
    return this.chainingResultProvider();
  }

  mockRejectOnce(error?: ErrorOrFunction): FetchMock {
    this.mockedFetch.mockImplementationOnce((input: RequestInput, requestInit?: RequestInit) =>
      normalizeError(normalizeRequest(input, requestInit), error)
    );
    return this.chainingResultProvider();
  }

  // enable/disable
  doMock(responseProvider?: ResponseProvider, params?: MockParams): FetchMock {
    this.isMocking.mockImplementation(always(true));
    if (responseProvider) {
      this.mockResponse(responseProvider, params);
    }
    return this.chainingResultProvider();
  }

  doMockOnce(responseProvider?: ResponseProvider, params?: MockParams): FetchMock {
    this.isMocking.mockImplementationOnce(always(true));
    if (responseProvider) {
      this.mockResponseOnce(responseProvider, params);
    }
    return this.chainingResultProvider();
  }

  doMockIf(urlOrPredicate: UrlOrPredicate, responseProvider?: ResponseProvider, params?: MockParams): FetchMock {
    this.isMocking.mockImplementation((input, requestInit) =>
      requestMatches(normalizeRequest(input, requestInit), urlOrPredicate)
    );
    if (responseProvider) {
      this.mockResponse(responseProvider, params);
    }
    return this.chainingResultProvider();
  }

  doMockOnceIf(urlOrPredicate: UrlOrPredicate, responseProvider?: ResponseProvider, params?: MockParams): FetchMock {
    this.isMocking.mockImplementationOnce((input, requestInit) =>
      requestMatches(normalizeRequest(input, requestInit), urlOrPredicate)
    );
    if (responseProvider) {
      this.mockResponseOnce(responseProvider, params);
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
  once(responseProvider: ResponseProvider, params?: MockParams): FetchMock {
    return this.mockResponseOnce(responseProvider, params);
  }

  /**
   * alias for doMockOnce
   */
  mockOnce(responseProvider?: ResponseProvider, params?: MockParams): FetchMock {
    return this.doMockOnce(responseProvider, params);
  }

  /**
   * alias for doMockIf
   */
  mockIf(urlOrPredicate: UrlOrPredicate, responseProvider?: ResponseProvider, params?: MockParams): FetchMock {
    return this.doMockIf(urlOrPredicate, responseProvider, params);
  }

  /**
   * alias for doMockOnceIf
   */
  mockOnceIf(urlOrPredicate: UrlOrPredicate, responseProvider?: ResponseProvider, params?: MockParams): FetchMock {
    return this.doMockOnceIf(urlOrPredicate, responseProvider, params);
  }
}

type UrlOrPredicate = string | RegExp | ((input: Request) => boolean);
type RequestInput = string | URL | Request;
type ResponseProvider = ResponseLike | ((request: Request) => ResponseLike | Promise<ResponseLike>);
type ResponseLike = MockResponse | ResponseBody | Response;
type ResponseBody = string | null | undefined;
type ErrorOrFunction = Error | ResponseBody | ResponseProvider;

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
  const fetchMockObject = new FetchMockObject(mockedFetch, originalFetch, () => fetchMock);

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

// Node 18 does not support URL.canParse()
export function canParseURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

// Node Requests cannot be relative
function resolveInput(input: string): string {
  if (canParseURL(input)) return input;

  // Window context
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    return new URL(input, window.document.baseURI).toString();
  }

  // Worker context
  if (typeof location !== 'undefined') {
    return new URL(input, location.origin).toString();
  }

  return input;
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
    return new Request(resolveInput(input), requestInit);
  } else {
    if (requestInit && requestInit.signal && requestInit.signal.aborted) {
      abort();
    }
    return new Request(resolveInput(input.toString()), requestInit);
  }
}

async function buildResponse(
  request: Request,
  responseProvider: ResponseProvider,
  params?: MockParams
): Promise<Response> {
  const response = await normalizeResponse(request, responseProvider, params);

  if (request.signal && request.signal.aborted) {
    abort();
  }

  return response;
}

async function normalizeResponse(
  request: Request,
  responseProvider: ResponseProvider,
  params?: MockParams
): Promise<Response> {
  const responseLike = typeof responseProvider === 'function' ? await responseProvider(request) : responseProvider;

  if (responseLike instanceof Response) {
    return responseLike;
  } else if (typeof responseLike === 'string' || responseLike === null || responseLike === undefined) {
    return new Response(responseLike, params);
  } else {
    return patchUrl(new Response(responseLike.body, { ...params, ...responseLike }), responseLike.url ?? params?.url);
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

const normalizeError = async (request: Request, errorOrFunction?: ErrorOrFunction): Promise<Response> =>
  errorOrFunction instanceof Error
    ? Promise.reject(errorOrFunction)
    : typeof errorOrFunction === 'function'
      ? buildResponse(request, errorOrFunction)
      : Promise.reject(errorOrFunction);

function abortError(): Error {
  return new DOMException('The operation was aborted.', 'AbortError');
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

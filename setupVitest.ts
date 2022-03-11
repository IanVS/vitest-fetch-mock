import createFetchMock from 'vitest-fetch-mock';
import { vi } from 'vitest';

const fetcher = createFetchMock(vi);
fetcher.enableMocks();

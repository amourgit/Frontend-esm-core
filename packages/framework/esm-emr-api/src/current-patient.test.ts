import { beforeEach, describe, expect, it, vi } from 'vitest';
import { egenFetch, type FetchResponse } from '@egen/esm-api';
import { getSynchronizationItems } from '@egen/esm-offline';
import { fetchCurrentPatient } from './current-patient';

vi.mock('@egen/esm-api');

const mockEgenFetch = vi.mocked(egenFetch);
const mockGetSynchronizationItems = vi.mocked(getSynchronizationItems);

vi.mock('../egen-fetch', () => ({
  egenFetch: vi.fn(),
  fhirBaseUrl: '/ws/fhir2/R4',
}));

vi.mock('@egen/esm-offline', () => ({
  getSynchronizationItems: vi.fn(),
}));

describe('fetchPatientData', () => {
  beforeEach(() => {
    mockGetSynchronizationItems.mockResolvedValue([]);
  });

  it('should return null when patientUuid is falsy', async () => {
    const result = await fetchCurrentPatient('');
    expect(result).toBeNull();
  });

  it('should return online patient data when available', async () => {
    const mockPatient = { id: '123', name: [{ given: ['John'], family: 'Doe' }] };
    mockEgenFetch.mockResolvedValue({ data: mockPatient, ok: true } as Partial<FetchResponse> as FetchResponse);

    const result = await fetchCurrentPatient('123');
    expect(result).toEqual(mockPatient);
  });

  it('should return offline patient data when online fetch fails', async () => {
    const mockOfflinePatient = { id: '123', name: [{ given: ['Jane'], family: 'Doe' }] };
    mockEgenFetch.mockRejectedValue(new Error('Network error'));
    mockGetSynchronizationItems.mockResolvedValue([{ fhirPatient: mockOfflinePatient }]);

    const result = await fetchCurrentPatient('123');
    expect(result).toEqual(mockOfflinePatient);
  });

  it('should throw an error when both online and offline fetches fail', async () => {
    mockEgenFetch.mockRejectedValue(new Error('Network error'));
    mockGetSynchronizationItems.mockResolvedValue([]);

    await expect(fetchCurrentPatient('123')).rejects.toThrow('Network error');
  });
});

import axios from 'axios';

const countriesClient = axios.create({
  baseURL: 'https://randomapi.dev',
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

interface CountryResponse {
  name: string;
  code: string;
  callingCode: string;
  flagEmoji: string;
}

export interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const countriesApi = {
  getAll: () =>
    countriesClient
      .get<CountryResponse[]>('/api/countries', {
        params: {
          unwrap: true,
          fields: 'name,code,callingCode,flagEmoji',
        },
      })
      .then(({ data }) =>
        data.map((country) => ({
          name: country.name,
          code: country.code,
          dialCode: country.callingCode,
          flag: country.flagEmoji,
        })),
      ),
};
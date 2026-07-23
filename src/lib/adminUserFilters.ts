export function userCountryFilters(countries: string[], allCountriesLabel: string) {
  const normalized = Array.from(new Set(countries.map((country) => country.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
  return [allCountriesLabel, ...normalized];
}

export function defaultUserCountryFilter(countries: string[], allCountriesLabel: string, deviceCountry: string) {
  const filters = userCountryFilters(countries, allCountriesLabel);
  return (
    filters.find((country) => country.toLowerCase() === deviceCountry.toLowerCase()) ??
    filters.find((country) => ['costa rica', 'cr'].includes(country.toLowerCase())) ??
    filters.find((country) => country !== allCountriesLabel) ??
    allCountriesLabel
  );
}

export function apiCountryParam(countryFilter: string, allCountriesLabel: string) {
  return countryFilter && countryFilter !== allCountriesLabel ? countryFilter : undefined;
}

export function countryFilterOptions(countries: string[], allCountriesLabel: string, selectedCountry: string) {
  return userCountryFilters(countries, allCountriesLabel);
}

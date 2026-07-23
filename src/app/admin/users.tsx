import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge, Card, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { EmptyState, FilterChips, ListRow, SearchBar, SectionHeader } from '@/components/molecules';
import { adminApi } from '@/api/admin.api';
import { apiCountryParam, countryFilterOptions, defaultUserCountryFilter } from '@/lib/adminUserFilters';
import { COSTA_RICA_COUNTRY_NAME } from '@/lib/costaRicaLocations';
import { getMarketplaceCountry } from '@/lib/deviceCountry';
import { UserSummary } from '@/types';
import { roleAccent, spacing } from '@/theme';

const ROLE_FILTERS = ['Todos', 'CLIENT', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN'];

export default function AdminUsers() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState(COSTA_RICA_COUNTRY_NAME);
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const accent = roleAccent.admin;
  const allCountriesLabel = t('admin.filters.allCountries');
  const deviceCountry = getMarketplaceCountry().name;

  useEffect(() => {
    adminApi
      .listUserCountries()
      .then((nextCountries) => {
        setCountries(nextCountries);
        setCountryFilter((current) => current || defaultUserCountryFilter(nextCountries, allCountriesLabel, deviceCountry));
      })
      .catch(() => setCountries([]));
  }, [allCountriesLabel, deviceCountry]);

  useEffect(() => {
    setLoading(true);
    adminApi
      .listUsers({
        country: apiCountryParam(countryFilter, allCountriesLabel),
        role: roleFilter === 'Todos' ? undefined : roleFilter,
        limit: 500,
      })
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [allCountriesLabel, countryFilter, roleFilter]);

  const countryFilters = useMemo(
    () => countryFilterOptions(countries, allCountriesLabel, countryFilter),
    [allCountriesLabel, countries, countryFilter],
  );
  const filteredUsers = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return users;
    return users.filter((user) =>
      [user.id, user.email, user.phone, user.role, user.status, user.country]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    );
  }, [query, users]);

  const statusTone = (s: string) => (s === 'ACTIVE' ? 'success' : s === 'PENDING_VERIFICATION' ? 'warning' : 'danger');

  if (loading) return <Spinner fullscreen />;

  return (
    <ScreenContainer>
      <SectionHeader title={t('nav.users')} subtitle={`${filteredUsers.length} usuarios`} />
      <Text variant="label" color="textSecondary">{t('admin.filters.country')}</Text>
      <FilterChips items={countryFilters} selected={countryFilter || allCountriesLabel} onSelect={setCountryFilter} accent={accent} />
      <SearchBar onChangeText={setQuery} placeholder={t('screens.searchUsers')} />
      <FilterChips items={ROLE_FILTERS} selected={roleFilter} onSelect={setRoleFilter} accent={accent} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        {filteredUsers.length === 0 ? (
          <EmptyState icon="people-outline" title={t('client.noResults')} />
        ) : (
          filteredUsers.map((u) => (
            <ListRow
              key={u.id}
              avatarName={u.email}
              title={u.email}
              subtitle={`${u.role} · ${u.phone ?? ''}`}
              right={<Badge label={u.status.replace('_', ' ')} tone={statusTone(u.status) as 'success' | 'warning' | 'danger'} />}
              showChevron
            />
          ))
        )}
      </Card>
    </ScreenContainer>
  );
}

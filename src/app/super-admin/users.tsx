import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge, Button, Card, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { FilterChips, ListRow, SearchBar, SectionHeader } from '@/components/molecules';
import { adminApi } from '@/api/admin.api';
import { apiCountryParam, countryFilterOptions, defaultUserCountryFilter } from '@/lib/adminUserFilters';
import { COSTA_RICA_COUNTRY_NAME } from '@/lib/costaRicaLocations';
import { getMarketplaceCountry } from '@/lib/deviceCountry';
import { UserSummary } from '@/types';
import { roleAccent, spacing } from '@/theme';

const ROLE_FILTERS = ['Todos', 'CLIENT', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN'];

export default function SuperAdminUsers() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState(COSTA_RICA_COUNTRY_NAME);
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const accent = roleAccent.superAdmin;
  const allCountriesLabel = t('admin.filters.allCountries');
  const deviceCountry = getMarketplaceCountry().name;

  const load = (country: string, role: string) => {
    setLoading(true);
    adminApi
      .listUsers({
        country: apiCountryParam(country, allCountriesLabel),
        role: role === 'Todos' ? undefined : role,
        limit: 500,
      })
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

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
    load(countryFilter, roleFilter);
  }, [countryFilter, roleFilter]);

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

  if (loading) return <Spinner fullscreen />;

  return (
    <ScreenContainer>
      <SectionHeader
        title={t('nav.users')}
        subtitle={`${filteredUsers.length} usuarios`}
        actionLabel={t('screens.addUser')}
        onAction={() => router.push('/super-admin/create-user' as never)}
      />
      <Text variant="label" color="textSecondary">{t('admin.filters.country')}</Text>
      <FilterChips items={countryFilters} selected={countryFilter || allCountriesLabel} onSelect={setCountryFilter} accent={accent} />
      <SearchBar onChangeText={setQuery} placeholder={t('screens.searchUsers')} />
      <FilterChips items={ROLE_FILTERS} selected={roleFilter} onSelect={setRoleFilter} accent={accent} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        {filteredUsers.map((u) => (
          <ListRow
            key={u.id}
            avatarName={u.email}
            title={u.email}
            subtitle={`${u.role} · ${u.status}`}
            right={<Badge label={u.status} tone={u.status === 'ACTIVE' ? 'success' : 'warning'} />}
            showChevron
          />
        ))}
      </Card>
      <Button label={t('screens.createUser')} accentColor={accent} iconLeft="person-add-outline" onPress={() => router.push('/super-admin/create-user' as never)} />
    </ScreenContainer>
  );
}

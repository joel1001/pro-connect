import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button, Card, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { SectionHeader } from '@/components/molecules';
import { catalogApi } from '@/api/catalog.api';
import { Category } from '@/types';
import { roleAccent, spacing } from '@/theme';

export default function SuperAdminCategories() {
  const { t } = useTranslation();
  const accent = roleAccent.superAdmin;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    catalogApi
      .listCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Spinner fullscreen />;

  return (
    <ScreenContainer>
      <SectionHeader title={t('nav.categories')} subtitle={`${categories.length} categorías`} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        {categories.map((c) => (
          <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#E2E8E5' }}>
            <Text variant="bodyStrong">{c.name}</Text>
            <Pressable style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 8, backgroundColor: c.active ? `${accent}18` : '#E2E8E5' }}>
              <Text variant="caption" weight="600" style={{ color: c.active ? accent : undefined }}>{c.active ? t('screens.active') : 'Inactivo'}</Text>
            </Pressable>
          </View>
        ))}
      </Card>
      <Button label={t('screens.newCategory')} accentColor={accent} iconLeft="add-outline" />
    </ScreenContainer>
  );
}

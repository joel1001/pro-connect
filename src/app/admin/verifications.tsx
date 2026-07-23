import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Card, ScreenContainer, Spinner } from '@/components/atoms';
import { EmptyState, ListRow, SectionHeader } from '@/components/molecules';
import { verificationsApi } from '@/api/verifications.api';
import { Verification } from '@/types';
import { roleAccent, spacing } from '@/theme';

export default function AdminVerifications() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const accent = roleAccent.admin;

  const load = () => {
    setLoading(true);
    verificationsApi
      .list('PENDING')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Spinner fullscreen />;

  return (
    <ScreenContainer>
      <SectionHeader title={t('nav.verifications')} subtitle={`${items.length} pendientes`} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        {items.length === 0 ? (
          <EmptyState icon="shield-checkmark-outline" title="Sin verificaciones pendientes" />
        ) : (
          items.map((v) => (
            <ListRow
              key={v.id}
              title={v.professionalId}
              subtitle={`${v.status} · ${v.userId}`}
              right={
                <Button
                  label={t('screens.review')}
                  size="sm"
                  accentColor={accent}
                  fullWidth={false}
                  onPress={() => verificationsApi.approve(v.id).then(load)}
                />
              }
            />
          ))
        )}
      </Card>
    </ScreenContainer>
  );
}

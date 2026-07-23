import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { SectionHeader, TermsContent } from '@/components/molecules';
import { termsApi, TermsDocument } from '@/api/terms.api';
import { spacing } from '@/theme';

export default function Terms() {
  const { t } = useTranslation();
  const [doc, setDoc] = useState<TermsDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    termsApi
      .current()
      .then(setDoc)
      .catch(() => setDoc(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner fullscreen />;

  return (
    <ScreenContainer scroll showBack>
      <SectionHeader
        title={t('profile.terms')}
        subtitle={doc?.version ? t('terms.versionLabel', { version: doc.version }) : undefined}
      />
      <Card style={{ gap: spacing.md }}>
        {doc ? (
          <TermsContent sections={doc.sections} version={doc.version} effectiveLabel={t('terms.versionLabel', { version: '' }).replace(': ', '')} />
        ) : (
          <Text variant="body" color="textSecondary">
            {t('terms.unavailable')}
          </Text>
        )}
      </Card>
    </ScreenContainer>
  );
}

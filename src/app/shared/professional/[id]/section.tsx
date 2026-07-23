import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { Linking, View } from 'react-native';

import { Icon, Text } from '@/components/atoms';
import {
  DetailActionLink,
  DetailIconTile,
  DetailItemCard,
  DetailItemsGroup,
  DetailQuote,
  ProfileDetailLayout,
} from '@/components/client/ProfileDetailLayout';
import { ListRow } from '@/components/molecules';
import { professionalsApi } from '@/api/professionals.api';
import { useTheme } from '@/hooks/useTheme';
import { PortfolioLinkPublic, ProfessionalUser } from '@/types';
import { radius, spacing } from '@/theme';

export type ProfileSectionType = 'certifications' | 'work' | 'portfolio' | 'references';

const SECTION_META: Record<ProfileSectionType, { titleKey: string; icon: string; emptyIcon: string }> = {
  certifications: { titleKey: 'registerFlow.stepCertifications', icon: 'ribbon-outline', emptyIcon: 'school-outline' },
  work: { titleKey: 'registerFlow.stepWork', icon: 'hammer-outline', emptyIcon: 'construct-outline' },
  portfolio: { titleKey: 'registerFlow.stepPortfolio', icon: 'images-outline', emptyIcon: 'globe-outline' },
  references: { titleKey: 'registerFlow.stepClientReferences', icon: 'people-outline', emptyIcon: 'chatbubbles-outline' },
};

const LINK_TYPE_ICON: Record<string, string> = {
  portfolio: 'briefcase-outline',
  website: 'globe-outline',
  github: 'logo-github',
  behance: 'color-palette-outline',
  dribbble: 'basketball-outline',
};

export default function ProfessionalProfileSection() {
  const params = useLocalSearchParams<{ id: string | string[]; section: string | string[] }>();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0];
  const section = (typeof params.section === 'string' ? params.section : params.section?.[0]) as ProfileSectionType;
  const { t } = useTranslation();
  const theme = useTheme();
  const [profile, setProfile] = useState<ProfessionalUser | null>(null);
  const [loading, setLoading] = useState(true);

  const meta = SECTION_META[section] ?? SECTION_META.certifications;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    professionalsApi
      .getById(id)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [id]);

  const credentials = profile?.credentials;
  const openUrl = (url?: string) => {
    if (!url) return;
    void Linking.openURL(url.startsWith('http') ? url : `https://${url}`);
  };

  const portfolioItems: PortfolioLinkPublic[] = useMemo(
    () =>
      credentials?.portfolioLinks?.length
        ? credentials.portfolioLinks
        : (credentials?.portfolioUrls ?? []).map((url) => ({ url, type: 'portfolio' })),
    [credentials],
  );

  const itemCount = useMemo(() => {
    if (!credentials) return 0;
    switch (section) {
      case 'certifications':
        return credentials.certifications?.length ?? 0;
      case 'work':
        return credentials.completedWorks?.length ?? 0;
      case 'portfolio':
        return portfolioItems.length;
      case 'references':
        return credentials.clientReferences?.length ?? 0;
      default:
        return 0;
    }
  }, [credentials, section, portfolioItems]);

  const proName = profile?.displayName ?? profile?.headline?.split('·')[0]?.trim();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ProfileDetailLayout
        title={t(meta.titleKey)}
        subtitle={proName ? t('client.proProfile.sectionFor', { name: proName }) : undefined}
        icon={meta.icon}
        emptyIcon={meta.emptyIcon}
        avatarName={proName}
        avatarUrl={profile?.avatarUrl}
        countLabel={!loading && itemCount > 0 ? t('client.proProfile.itemsCount', { count: itemCount }) : undefined}
        loading={loading}
        empty={!loading && itemCount === 0}
        emptyMessage={t('client.proProfile.emptySection')}
      >
        {section === 'certifications' && credentials?.certifications?.length ? (
          <DetailItemsGroup>
            {credentials.certifications.map((cert, index, arr) => (
              <DetailItemCard key={`${cert.name}-${index}`} isLast={index === arr.length - 1}>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <DetailIconTile icon="ribbon-outline" />
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <Text variant="bodyStrong">{cert.name}</Text>
                    {cert.issuer ? (
                      <Text variant="caption" color="textSecondary">
                        {cert.issuer}
                      </Text>
                    ) : null}
                    {cert.credentialUrl ? (
                      <DetailActionLink
                        label={t('client.proProfile.verifyCredential')}
                        onPress={() => openUrl(cert.credentialUrl)}
                        icon="shield-checkmark-outline"
                      />
                    ) : null}
                  </View>
                </View>
              </DetailItemCard>
            ))}
          </DetailItemsGroup>
        ) : null}

        {section === 'work' && credentials?.completedWorks?.length ? (
          <DetailItemsGroup>
            {credentials.completedWorks.map((work, index, arr) => (
              <DetailItemCard key={`${work.title}-${index}`} isLast={index === arr.length - 1}>
                {work.imageUrls?.[0] ? (
                  <Image
                    source={{ uri: work.imageUrls[0] }}
                    style={{
                      width: '100%',
                      height: 176,
                      borderRadius: radius.md,
                      marginBottom: spacing.md,
                      backgroundColor: theme.colors.surfaceSunken,
                    }}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={{
                      height: 120,
                      borderRadius: radius.md,
                      backgroundColor: theme.colors.primarySurface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: spacing.md,
                    }}
                  >
                    <Icon name="image-outline" size={36} color={theme.colors.primary} />
                  </View>
                )}
                <Text variant="bodyStrong">{work.title}</Text>
                {work.description ? (
                  <Text variant="body" color="textSecondary" style={{ lineHeight: 22, marginTop: spacing.xs }}>
                    {work.description}
                  </Text>
                ) : null}
                {work.externalUrl ? (
                  <DetailActionLink label={t('client.proProfile.viewProject')} onPress={() => openUrl(work.externalUrl)} />
                ) : null}
              </DetailItemCard>
            ))}
          </DetailItemsGroup>
        ) : null}

        {section === 'portfolio' && portfolioItems.length ? (
          <DetailItemsGroup>
            {portfolioItems.map((link, index, arr) => (
              <View key={`${link.url}-${index}`}>
                {index > 0 ? <View style={{ height: 1, backgroundColor: theme.colors.border, marginHorizontal: spacing.lg }} /> : null}
                <View style={{ paddingHorizontal: spacing.sm }}>
                  <ListRow
                    title={link.title ?? link.url.replace(/^https?:\/\//, '')}
                    subtitle={link.type ? link.type.charAt(0).toUpperCase() + link.type.slice(1) : link.url.replace(/^https?:\/\//, '')}
                    icon={(LINK_TYPE_ICON[link.type ?? ''] ?? 'link-outline') as never}
                    showChevron
                    onPress={() => openUrl(link.url)}
                  />
                </View>
              </View>
            ))}
          </DetailItemsGroup>
        ) : null}

        {section === 'references' && credentials?.clientReferences?.length ? (
          <DetailItemsGroup>
            {credentials.clientReferences.map((ref, index, arr) => (
              <DetailItemCard key={`${ref.clientName}-${index}`} isLast={index === arr.length - 1}>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <DetailIconTile icon="person-outline" />
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <Text variant="bodyStrong">{ref.clientName}</Text>
                    {ref.company ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <Icon name="business-outline" size={14} color={theme.colors.textMuted} />
                        <Text variant="caption" color="textSecondary">
                          {ref.company}
                        </Text>
                      </View>
                    ) : null}
                    {ref.projectDescription ? (
                      <Text variant="body" color="textSecondary">
                        {ref.projectDescription}
                      </Text>
                    ) : null}
                    {ref.testimonial ? <DetailQuote text={ref.testimonial} /> : null}
                    {ref.referenceUrl ? (
                      <DetailActionLink label={t('client.proProfile.viewReference')} onPress={() => openUrl(ref.referenceUrl)} />
                    ) : null}
                  </View>
                </View>
              </DetailItemCard>
            ))}
          </DetailItemsGroup>
        ) : null}
      </ProfileDetailLayout>
    </>
  );
}

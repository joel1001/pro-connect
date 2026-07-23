import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button, Icon, Input, Text } from '@/components/atoms';
import { ProfileLinkRow, ProfileListSection, ProfileSection } from '@/components/client/ProfileListSection';
import { professionalsApi } from '@/api/professionals.api';
import { reviewsApi } from '@/api/reviews.api';
import { resolveClientReviewAuthorNames, reviewAuthorName } from '@/lib/reviewDisplay';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { MarketplaceProfessional, professionalProfileFromApi } from '@/lib/marketplace';
import { PortfolioLinkPublic, ProfessionalUser, Review } from '@/types';
import { radius, spacing, Theme } from '@/theme';

type ProfileSectionKey = 'certifications' | 'work' | 'portfolio' | 'references';

export default function ProfessionalProfile() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0];
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [pro, setPro] = useState<MarketplaceProfessional | null>(null);
  const [profile, setProfile] = useState<ProfessionalUser | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewerNames, setReviewerNames] = useState<Record<string, string>>({});
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoadState('loading');

    professionalsApi
      .getById(id)
      .then((api) => {
        if (cancelled) return;
        setProfile(api);
        setPro(professionalProfileFromApi(api));
        setLoadState('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setLoadState('error');
      });

    reviewsApi
      .listByProfessional(id)
      .then((items) => {
        if (cancelled) return;
        setReviews(items);
        return resolveClientReviewAuthorNames(items);
      })
      .then((names) => {
        if (!cancelled && names) setReviewerNames(names);
      })
      .catch(() => {
        if (!cancelled) {
          setReviews([]);
          setReviewerNames({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loadState === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <Text variant="body" color="textSecondary">
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  if (loadState === 'error' || !pro) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background, padding: spacing.lg, gap: spacing.md }}>
        <Text variant="body" color="textSecondary" center>
          {t('client.proProfile.loadError')}
        </Text>
        <Button label={t('common.back')} variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  const credentials = profile?.credentials;
  const verificationIcons: Record<string, string> = {
    ID: 'card-outline',
    Cédula: 'card-outline',
    Título: 'school-outline',
    Colegio: 'business-outline',
    LinkedIn: 'logo-linkedin',
    Certificaciones: 'ribbon-outline',
  };
  const badges = credentials?.verificationBadges?.length ? credentials.verificationBadges : pro.verified;

  const openUrl = (url?: string) => {
    if (!url) return;
    void Linking.openURL(url.startsWith('http') ? url : `https://${url}`);
  };

  const viewUrl = (url?: string) => {
    if (!url) return;
    void WebBrowser.openBrowserAsync(url.startsWith('http') ? url : `https://${url}`);
  };

  const resumeUrl = credentials?.resume?.fileUrl ?? credentials?.curriculumUrl;
  const resumeFileName = credentials?.resume?.fileName ?? 'resume.pdf';

  const portfolioItems: PortfolioLinkPublic[] = credentials?.portfolioLinks?.length
    ? credentials.portfolioLinks
    : (credentials?.portfolioUrls ?? []).map((url, index) => ({
        title: t('registerFlow.portfolioLink', { n: index + 1 }),
        url,
        type: 'portfolio',
      }));

  const professionalLinks: { label: string; url: string }[] = [];
  if (credentials?.professionalCollegeUrl) {
    professionalLinks.push({ label: t('client.proProfile.viewCollegeLink'), url: credentials.professionalCollegeUrl });
  }
  if (credentials?.licenseVerificationUrl) {
    professionalLinks.push({ label: t('client.proProfile.verifyLicense'), url: credentials.licenseVerificationUrl });
  }
  if (credentials?.linkedInUrl) professionalLinks.push({ label: 'LinkedIn', url: credentials.linkedInUrl });
  if (credentials?.githubUrl) professionalLinks.push({ label: 'GitHub', url: credentials.githubUrl });
  if (credentials?.behanceUrl) professionalLinks.push({ label: 'Behance', url: credentials.behanceUrl });
  if (credentials?.dribbbleUrl) professionalLinks.push({ label: 'Dribbble', url: credentials.dribbbleUrl });
  if (credentials?.websiteUrl) professionalLinks.push({ label: t('registerFlow.websiteUrl'), url: credentials.websiteUrl });

  const goToSection = (section: ProfileSectionKey) => {
    if (!id) return;
    router.push(`/shared/professional/${id}/section?section=${section}` as never);
  };

  const submitReview = async () => {
    if (!id || user?.role !== 'CLIENT') return;
    setSubmittingReview(true);
    try {
      await reviewsApi.create({
        professionalId: id,
        rating,
        comment: comment.trim() || undefined,
      });
      const nextReviews = await reviewsApi.listByProfessional(id).catch(() => reviews);
      setReviews(nextReviews);
      setReviewerNames(await resolveClientReviewAuthorNames(nextReviews));
      setComment('');
      Alert.alert(t('reviews.feedback'), t('reviews.feedbackSaved'));
    } catch {
      Alert.alert(t('reviews.feedback'), t('reviews.feedbackError'));
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ height: 160, backgroundColor: theme.colors.primaryLight, position: 'relative' }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.35 }}>
            <Icon name="construct-outline" size={64} color={theme.colors.primary} />
          </View>
          <Pressable
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              top: insets.top + spacing.sm,
              left: spacing.md,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="arrow-back" size={22} color={theme.colors.text} />
          </Pressable>
        </View>

        <View style={{ alignItems: 'center', marginTop: -44, paddingHorizontal: spacing.lg }}>
          <Avatar name={pro.name} uri={pro.avatarUrl} size={88} />
          <Text variant="h2" center style={{ marginTop: spacing.md }}>
            {pro.name}
          </Text>
          <Text variant="body" color="textSecondary">
            {credentials?.professionalTitle ?? pro.profession}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            marginTop: spacing.xl,
          }}
        >
          <StatBox label={t('screens.trustScore')} value={`${pro.trustScore}/100`} theme={theme} />
          <StatBox label={t('client.statJobs')} value={String(pro.jobs)} theme={theme} />
          <StatBox label={t('client.statExperience')} value={t('client.yearsExp', { n: pro.yearsExp })} theme={theme} />
          <StatBox label={t('client.statResponse')} value={t('client.responseMin', { n: pro.responseMin })} theme={theme} />
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl, gap: spacing.sm }}>
          <Text variant="bodyStrong">{t('client.verifications')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {badges.map((v) => (
              <View
                key={v}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.pill,
                  backgroundColor: theme.colors.primarySurface,
                }}
              >
                <Icon name={(verificationIcons[v] ?? 'checkmark-circle-outline') as never} size={16} color={theme.colors.primary} />
                <Text variant="caption" weight="600" style={{ color: theme.colors.primary }}>
                  {v}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {credentials?.professionalTitle ? (
          <ProfileSection title={t('client.proProfile.professionalTitle')} theme={theme}>
            <Text variant="body" color="textSecondary">
              {credentials.professionalTitle}
            </Text>
          </ProfileSection>
        ) : null}

        {credentials?.collegeAssociated && credentials.professionalCollege ? (
          <ProfileSection title={t('client.proProfile.college')} theme={theme}>
            <Text variant="body" color="textSecondary">
              {credentials.professionalCollege}
            </Text>
            {credentials.licenseNumber ? (
              <Text variant="caption" color="textMuted" style={{ marginTop: spacing.xs }}>
                {t('registerFlow.licenseNumber')}: {credentials.licenseNumber}
              </Text>
            ) : null}
          </ProfileSection>
        ) : null}

        {professionalLinks.length > 0 ? (
          <ProfileSection title={t('client.proProfile.professionalLinks')} theme={theme}>
            {professionalLinks.map((link) => (
              <ProfileLinkRow key={link.label} label={link.label} url={link.url} onPress={() => openUrl(link.url)} theme={theme} />
            ))}
          </ProfileSection>
        ) : null}

        <ProfileListSection
          title={t('registerFlow.stepCertifications')}
          items={credentials?.certifications ?? []}
          viewAllLabel={t('client.proProfile.viewAll')}
          onViewAll={() => goToSection('certifications')}
          keyExtractor={(cert, index) => `${cert.name}-${index}`}
          theme={theme}
          renderItem={(cert) => (
            <View style={{ gap: 2, marginBottom: spacing.sm }}>
              <Text variant="bodyStrong">{cert.name}</Text>
              {cert.issuer ? (
                <Text variant="caption" color="textSecondary">
                  {cert.issuer}
                </Text>
              ) : null}
              {cert.credentialUrl ? (
                <Pressable onPress={() => openUrl(cert.credentialUrl)}>
                  <Text variant="caption" color="primary">
                    {t('client.proProfile.verifyCredential')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        />

        <ProfileListSection
          title={t('registerFlow.stepWork')}
          items={credentials?.completedWorks ?? []}
          viewAllLabel={t('client.proProfile.viewAll')}
          onViewAll={() => goToSection('work')}
          keyExtractor={(work, index) => `${work.title}-${index}`}
          theme={theme}
          renderItem={(work) => (
            <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
              {work.imageUrls?.[0] ? (
                <Image source={{ uri: work.imageUrls[0] }} style={{ width: '100%', height: 160, borderRadius: radius.md }} contentFit="cover" />
              ) : null}
              <Text variant="bodyStrong">{work.title}</Text>
              {work.description ? (
                <Text variant="caption" color="textSecondary">
                  {work.description}
                </Text>
              ) : null}
              {work.externalUrl ? (
                <Pressable onPress={() => openUrl(work.externalUrl)}>
                  <Text variant="caption" color="primary">
                    {t('client.proProfile.viewProject')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        />

        <ProfileListSection
          title={t('registerFlow.stepPortfolio')}
          items={portfolioItems}
          viewAllLabel={t('client.proProfile.viewAll')}
          onViewAll={() => goToSection('portfolio')}
          keyExtractor={(link, index) => `${link.url}-${index}`}
          theme={theme}
          renderItem={(link) => (
            <Pressable onPress={() => openUrl(link.url)} style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
              <Text variant="bodyStrong">{link.title ?? link.url}</Text>
              {link.type ? (
                <Text variant="caption" color="textMuted">
                  {link.type}
                </Text>
              ) : null}
            </Pressable>
          )}
        />

        <ProfileListSection
          title={t('registerFlow.stepClientReferences')}
          items={credentials?.clientReferences ?? []}
          viewAllLabel={t('client.proProfile.viewAll')}
          onViewAll={() => goToSection('references')}
          keyExtractor={(ref, index) => `${ref.clientName}-${index}`}
          theme={theme}
          renderItem={(ref) => (
            <View style={{ gap: 2, marginBottom: spacing.sm }}>
              <Text variant="bodyStrong">{ref.clientName}</Text>
              {ref.company ? (
                <Text variant="caption" color="textSecondary">
                  {ref.company}
                </Text>
              ) : null}
              {ref.projectDescription ? (
                <Text variant="caption" color="textSecondary">
                  {ref.projectDescription}
                </Text>
              ) : null}
              {ref.testimonial ? (
                <Text variant="body" color="textSecondary" style={{ fontStyle: 'italic' }}>
                  “{ref.testimonial}”
                </Text>
              ) : null}
            </View>
          )}
        />

        <ProfileSection title={t('registerFlow.stepCurriculum')} theme={theme}>
          {resumeUrl ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
              <Button label={t('client.proProfile.viewResume')} variant="outline" onPress={() => viewUrl(resumeUrl)} style={{ flex: 1, minWidth: 140 }} />
              <Button label={t('client.proProfile.downloadResume')} onPress={() => openUrl(resumeUrl)} style={{ flex: 1, minWidth: 140 }} />
              {resumeFileName ? (
                <Text variant="caption" color="textMuted" style={{ width: '100%' }}>
                  {resumeFileName}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text variant="body" color="textMuted">
              {t('client.proProfile.noResume')}
            </Text>
          )}
        </ProfileSection>

        {reviews.length > 0 ? (
          <Section title={t('client.proProfile.reviews', { count: reviews.length })} theme={theme}>
            {reviews.slice(0, 6).map((review) => (
              <View
                key={review.id}
                style={{
                  gap: spacing.xs,
                  marginBottom: spacing.md,
                  paddingBottom: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text variant="bodyStrong">
                    {reviewAuthorName(review, reviewerNames, t('client.proProfile.anonymousClient'))}
                  </Text>
                  <Text variant="caption" color="primary">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </Text>
                </View>
                {review.comment ? (
                  <Text variant="body" color="textSecondary">
                    {review.comment}
                  </Text>
                ) : null}
              </View>
            ))}
          </Section>
        ) : null}

        {user?.role === 'CLIENT' ? (
          <Section title={t('reviews.leaveFeedback')} theme={theme}>
            <View style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Button
                    key={value}
                    label={`${value} ★`}
                    size="sm"
                    fullWidth={false}
                    variant={rating === value ? 'primary' : 'outline'}
                    onPress={() => setRating(value)}
                  />
                ))}
              </View>
              <Input label={t('reviews.comment')} value={comment} onChangeText={setComment} multiline />
              <Button label={t('reviews.submitFeedback')} loading={submittingReview} onPress={submitReview} />
            </View>
          </Section>
        ) : null}

        {pro.bio ? (
          <Section title={t('screens.about')} theme={theme}>
            <Text variant="body" color="textSecondary" style={{ lineHeight: 22 }}>
              {pro.bio}
            </Text>
          </Section>
        ) : null}
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: 'row',
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.md,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        }}
      >
        <Button label={t('appointments.bookShort')} onPress={() => router.push(`/client/appointments/book/${pro.id}` as never)} fullWidth style={{ flex: 1 }} />
        <Button
          label={t('client.chat')}
          variant="outline"
          onPress={() =>
            router.push({
              pathname: '/shared/chat',
              params: { professionalId: pro.id },
            } as never)
          }
          fullWidth
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

function Section({ title, children, theme }: { title: string; children: ReactNode; theme: Theme }) {
  return (
    <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl, gap: spacing.sm }}>
      <Text variant="bodyStrong">{title}</Text>
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function StatBox({ label, value, theme }: { label: string; value: string; theme: Theme }) {
  return (
    <View
      style={{
        width: '48%',
        backgroundColor: theme.colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <Text variant="caption" color="textMuted" center>
        {label}
      </Text>
      <Text variant="bodyStrong" center style={{ marginTop: 4 }}>
        {value}
      </Text>
    </View>
  );
}

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getApiErrorMessage } from '@/api/client';
import { MonthlyTaxInvoice, MonthlyTaxInvoiceDetail, paymentsApi } from '@/api/payments.api';
import { Badge, Button, Card, Divider, Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

type InvoiceRole = 'client' | 'professional';

interface MonthlyTaxInvoiceGeneratorProps {
  role: InvoiceRole;
  accent: string;
}

function money(value: number, currency = 'USD') {
  return `${currency} ${Number(value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatPeriod(period: string | undefined, locale: string) {
  if (!period) return '—';
  const date = new Date(`${period}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return period;
  return date.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
}

export function MonthlyTaxInvoiceGenerator({ role, accent }: MonthlyTaxInvoiceGeneratorProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [document, setDocument] = useState<MonthlyTaxInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadDocument = async () => {
    setLoading(true);
    setError(null);
    let step = 'download-csv';
    try {
      setDocument(null);
      const csv = await paymentsApi.downloadMonthlyTaxInvoice(role);
      const now = new Date();
      const fileName = `proconnect-hacienda-${role}-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.csv`;
      const uri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(uri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      step = 'share-file';
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'text/csv',
          dialogTitle: t('taxInvoice.download'),
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        setError(t('taxInvoice.sharingUnavailable'));
      }
    } catch (err) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error(`[MonthlyTaxInvoiceGenerator] download failed at ${step}`, err);
      }
      setDocument(null);
      setError(getApiErrorMessage(err, t('taxInvoice.downloadError')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      style={{
        gap: spacing.md,
        borderColor: `${accent}24`,
        backgroundColor: theme.colors.surface,
        borderRadius: radius.xl,
      }}
    >
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 16,
            backgroundColor: `${accent}14`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="receipt-outline" size={22} color={accent} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{t('taxInvoice.title')}</Text>
          <Text variant="caption" color="textSecondary">
            {t(role === 'professional' ? 'taxInvoice.professionalSubtitle' : 'taxInvoice.clientSubtitle')}
          </Text>
        </View>
      </View>

      <Button
        label={t('taxInvoice.download')}
        iconLeft="document-text-outline"
        accentColor={accent}
        loading={loading}
        onPress={downloadDocument}
      />

      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}

      {document ? (
        <View
          style={{
            gap: spacing.md,
            padding: spacing.md,
            borderRadius: radius.lg,
            backgroundColor: theme.colors.primarySurface,
            borderWidth: 1,
            borderColor: `${accent}24`,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text variant="label" color="primary">
                {t('taxInvoice.document')}
              </Text>
              <Text variant="bodyStrong">{formatPeriod(document.period, i18n.language)}</Text>
              <Text variant="caption" color="textSecondary">
                {document.id}
              </Text>
            </View>
            <Badge label={t('taxInvoice.generatedByBackend')} tone="success" />
          </View>
          <Divider />
          <InvoiceRow label={t('taxInvoice.reportablePayments')} value={String(document.reportablePayments)} />
          <InvoiceRow label={t('taxInvoice.totalPaid')} value={money(document.totalPaid, document.currency)} />
          {role === 'professional' ? (
            <InvoiceRow
              label={t('taxInvoice.professionalNet')}
              value={money(document.professionalNet, document.currency)}
              bold
            />
          ) : (
            <InvoiceRow
              label={t('taxInvoice.clientExpense')}
              value={money(document.clientExpense, document.currency)}
              bold
            />
          )}
          <InvoiceRow label={t('taxInvoice.platformFees')} value={money(document.platformFees, document.currency)} />
          <Divider />
          <View style={{ gap: spacing.sm }}>
            <Text variant="bodyStrong">{t('taxInvoice.invoiceDetails')}</Text>
            {document.invoices.length === 0 ? (
              <Text variant="caption" color="textSecondary">
                {t('taxInvoice.noInvoices')}
              </Text>
            ) : (
              document.invoices.map((invoice) => (
                <InvoiceDetailCard
                  key={invoice.paymentId}
                  invoice={invoice}
                  role={role}
                  accent={accent}
                  locale={i18n.language}
                />
              ))
            )}
          </View>
          <Text variant="caption" color="textSecondary">
            {t('taxInvoice.disclaimer')}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

function InvoiceDetailCard({
  invoice,
  role,
  accent,
  locale,
}: {
  invoice: MonthlyTaxInvoiceDetail;
  role: InvoiceRole;
  accent: string;
  locale: string;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const netValue = role === 'professional' ? invoice.professionalNet : invoice.clientExpense;

  return (
    <View
      style={{
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: `${accent}20`,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{`${t('taxInvoice.invoice')} ${invoice.invoiceNumber}`}</Text>
          <Text variant="caption" color="textSecondary">
            {invoice.paymentId}
          </Text>
        </View>
        <Badge label={invoice.status} tone={invoice.status === 'RELEASED' ? 'success' : 'info'} />
      </View>
      <InvoiceRow label={t('taxInvoice.date')} value={formatDate(invoice.paidAt, locale)} />
      <InvoiceRow label={t('taxInvoice.contract')} value={invoice.contractId} />
      <InvoiceRow label={t('taxInvoice.transaction')} value={invoice.transactionId ?? '—'} />
      <InvoiceRow label={t('taxInvoice.grossAmount')} value={money(invoice.grossAmount, invoice.currency)} />
      <InvoiceRow label={t('taxInvoice.platformFees')} value={money(invoice.platformFee, invoice.currency)} />
      <InvoiceRow
        label={role === 'professional' ? t('taxInvoice.professionalNet') : t('taxInvoice.clientExpense')}
        value={money(netValue, invoice.currency)}
        bold
      />
    </View>
  );
}

function InvoiceRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
      <Text variant="caption" color="textSecondary" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant={bold ? 'bodyStrong' : 'caption'} style={{ textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

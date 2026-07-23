import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';

import { Button, Card, Divider, Text } from '@/components/atoms';
import { contractsApi } from '@/api/contracts.api';
import { onboardingApi } from '@/api/onboarding.api';
import { getApiErrorMessage } from '@/api/client';
import { openContractDocument } from '@/lib/contractDocument';
import { ContractDocumentSource } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

type DocumentMode = 'upload' | 'auto';

export type ContractDocumentState = {
  pdfUrl?: string | null;
  signedPdfUrl?: string | null;
  documentText?: string | null;
  documentSource?: ContractDocumentSource | null;
};

type Props = {
  editable: boolean;
  context: 'onboarding' | 'contract';
  contractId?: string;
  accentColor: string;
  value: ContractDocumentState;
  onChange: (next: ContractDocumentState) => void;
};

export function ContractDocumentEditor({
  editable,
  context,
  contractId,
  accentColor,
  value,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [mode, setMode] = useState<DocumentMode>(
    value.documentSource === 'UPLOADED' ? 'upload' : 'auto',
  );
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingText, setSavingText] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftText, setDraftText] = useState(value.documentText ?? '');

  const hasDocument = Boolean(value.pdfUrl || value.documentText);
  const themedBorder = theme.isDark ? theme.colors.borderStrong : theme.colors.primaryLight;

  const onDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const opened = await openContractDocument(value, { title: t('client.contract.title') });
      if (!opened) {
        setError(t('client.contract.downloadUnavailable'));
      }
    } catch (e) {
      setError(getApiErrorMessage(e, t('client.contract.error')));
    } finally {
      setDownloading(false);
    }
  };

  const onPickUpload = async (signed = false) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    setError(null);
    try {
      if (context === 'onboarding') {
        const uploaded = await onboardingApi.upload('contract', asset.uri, asset.name, asset.mimeType ?? 'application/pdf');
        if (signed) {
          const signedUpload = await onboardingApi.upload(
            'contract_signed',
            asset.uri,
            asset.name,
            asset.mimeType ?? 'application/pdf',
          );
          onChange({
            ...value,
            signedPdfUrl: signedUpload.url,
          });
        } else {
          onChange({
            pdfUrl: uploaded.url,
            documentText: null,
            documentSource: 'UPLOADED',
            signedPdfUrl: value.signedPdfUrl,
          });
        }
      } else if (contractId) {
        const updated = signed
          ? await contractsApi.uploadSignedDocument(contractId, asset.uri, asset.name, asset.mimeType ?? 'application/pdf')
          : await contractsApi.uploadDocument(contractId, asset.uri, asset.name, asset.mimeType ?? 'application/pdf');
        onChange({
          pdfUrl: updated.pdfUrl,
          signedPdfUrl: updated.signedPdfUrl,
          documentText: updated.documentText,
          documentSource: updated.documentSource,
        });
        if (updated.documentText) setDraftText(updated.documentText);
      }
    } catch (e) {
      setError(getApiErrorMessage(e, t('client.contract.error')));
    } finally {
      setUploading(false);
    }
  };

  const onGenerate = async () => {
    if (!disclaimerAccepted) return;
    setGenerating(true);
    setError(null);
    try {
      if (context === 'onboarding') {
        const verification = await onboardingApi.generateContractTemplate(true);
        onChange({
          pdfUrl: null,
          documentText: verification.contractDocumentText ?? null,
          documentSource: 'AUTO_GENERATED',
          signedPdfUrl: value.signedPdfUrl,
        });
        setDraftText(verification.contractDocumentText ?? '');
      } else if (contractId) {
        const updated = await contractsApi.generateDocument(contractId, true);
        onChange({
          pdfUrl: updated.pdfUrl,
          signedPdfUrl: updated.signedPdfUrl,
          documentText: updated.documentText,
          documentSource: updated.documentSource,
        });
        setDraftText(updated.documentText ?? '');
      }
    } catch (e) {
      setError(getApiErrorMessage(e, t('client.contract.error')));
    } finally {
      setGenerating(false);
    }
  };

  const onSaveText = async () => {
    if (!draftText.trim()) return;
    if (context === 'onboarding') {
      onChange({
        ...value,
        documentText: draftText.trim(),
        documentSource: 'AUTO_GENERATED',
        pdfUrl: null,
      });
      return;
    }
    if (!contractId) return;
    setSavingText(true);
    setError(null);
    try {
      const updated = await contractsApi.updateDocumentText(contractId, draftText.trim());
      onChange({
        pdfUrl: updated.pdfUrl,
        signedPdfUrl: updated.signedPdfUrl,
        documentText: updated.documentText,
        documentSource: updated.documentSource,
      });
    } catch (e) {
      setError(getApiErrorMessage(e, t('client.contract.error')));
    } finally {
      setSavingText(false);
    }
  };

  return (
    <Card
      style={{
        gap: spacing.md,
        backgroundColor: theme.colors.surface,
        borderColor: themedBorder,
      }}
    >
      <Text variant="bodyStrong">{t('client.contract.documentSection')}</Text>
      <Text variant="caption" color="textSecondary">
        {editable ? t('client.contract.documentHintPro') : t('client.contract.documentHintClient')}
      </Text>

      {editable ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button
            label={t('client.contract.modeUpload')}
            variant={mode === 'upload' ? 'primary' : 'outline'}
            accentColor={accentColor}
            size="sm"
            onPress={() => setMode('upload')}
            style={{ flex: 1 }}
          />
          <Button
            label={t('client.contract.modeAuto')}
            variant={mode === 'auto' ? 'primary' : 'outline'}
            accentColor={accentColor}
            size="sm"
            onPress={() => setMode('auto')}
            style={{ flex: 1 }}
          />
        </View>
      ) : null}

      {editable && mode === 'upload' ? (
        <>
          <Text variant="caption" color="textSecondary">{t('client.contract.uploadHint')}</Text>
          <Button
            label={value.pdfUrl ? t('client.contract.replaceUpload') : t('client.contract.pickPdf')}
            variant="outline"
            accentColor={accentColor}
            loading={uploading}
            onPress={() => onPickUpload(false)}
          />
          {value.pdfUrl ? <Text variant="caption" color="textSecondary">{t('client.contract.uploaded')}</Text> : null}
        </>
      ) : null}

      {editable && mode === 'auto' ? (
        <>
          <View
            style={{
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              gap: spacing.sm,
            }}
          >
            <Text variant="bodyStrong">{t('client.contract.disclaimerTitle')}</Text>
            <Text variant="caption" color="textSecondary">{t('client.contract.disclaimerBody')}</Text>
            <Pressable
              onPress={() => setDisclaimerAccepted((v) => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: accentColor,
                  backgroundColor: disclaimerAccepted ? accentColor : 'transparent',
                }}
              />
              <Text variant="caption">{t('client.contract.disclaimerAccept')}</Text>
            </Pressable>
          </View>
          <Button
            label={value.documentText ? t('client.contract.regenerate') : t('client.contract.generate')}
            accentColor={accentColor}
            loading={generating}
            disabled={!disclaimerAccepted}
            onPress={onGenerate}
          />
        </>
      ) : null}

      {(value.documentText || (!editable && value.pdfUrl)) ? (
        <Card
          elevated={false}
          style={{
            gap: spacing.sm,
            backgroundColor: theme.colors.primarySurface,
            borderColor: themedBorder,
            padding: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
            <Text variant="caption" color="textSecondary">{t('client.contract.preview')}</Text>
            {!editable && hasDocument ? (
              <Button
                label={t('client.contract.download')}
                size="sm"
                variant="outline"
                accentColor={accentColor}
                loading={downloading}
                onPress={() => void onDownload()}
                fullWidth={false}
                style={{ alignSelf: 'flex-end', minWidth: 120 }}
              />
            ) : null}
          </View>
          {editable && value.documentText ? (
            <>
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: themedBorder,
                  borderRadius: radius.md,
                  borderLeftWidth: 4,
                  borderLeftColor: accentColor,
                  padding: spacing.md,
                }}
              >
                <TextInput
                  multiline
                  value={draftText}
                  onChangeText={(text) => {
                    setDraftText(text);
                    if (context === 'onboarding') {
                      onChange({
                        ...value,
                        documentText: text,
                        documentSource: 'AUTO_GENERATED',
                        pdfUrl: null,
                      });
                    }
                  }}
                  style={{
                    minHeight: 180,
                    color: theme.colors.text,
                    textAlignVertical: 'top',
                  }}
                />
              </View>
              {context === 'contract' ? (
                <Button
                  label={t('client.contract.saveEdits')}
                  variant="outline"
                  accentColor={accentColor}
                  loading={savingText}
                  onPress={onSaveText}
                />
              ) : null}
            </>
          ) : value.documentText ? (
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: themedBorder,
                borderRadius: radius.md,
                borderLeftWidth: 4,
                borderLeftColor: accentColor,
                padding: spacing.md,
              }}
            >
              <Text variant="caption" style={{ lineHeight: 20 }}>
                {value.documentText}
              </Text>
            </View>
          ) : (
            <Text variant="caption" color="textSecondary">{t('client.contract.uploaded')}</Text>
          )}
        </Card>
      ) : null}

      {hasDocument && editable ? (
        <>
          <Divider />
          <Text variant="bodyStrong">{t('client.contract.signedSection')}</Text>
          <Text variant="caption" color="textSecondary">{t('client.contract.signedHint')}</Text>
          <Button
            label={value.signedPdfUrl ? t('client.contract.replaceSigned') : t('client.contract.uploadSigned')}
            variant="outline"
            accentColor={accentColor}
            loading={uploading}
            onPress={() => onPickUpload(true)}
          />
          {value.signedPdfUrl ? (
            <Text variant="caption" color="textSecondary">{t('client.contract.signedUploaded')}</Text>
          ) : null}
        </>
      ) : null}

      {error ? <Text variant="caption" color="danger">{error}</Text> : null}
    </Card>
  );
}

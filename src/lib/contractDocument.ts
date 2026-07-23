import { Linking, Share } from 'react-native';

import { resolveAssetUrl } from '@/lib/resolveAssetUrl';

type ContractDoc = {
  pdfUrl?: string | null;
  signedPdfUrl?: string | null;
  documentText?: string | null;
};

export async function openContractDocument(
  doc: ContractDoc,
  options?: { title?: string },
): Promise<boolean> {
  const pdfTarget = doc.signedPdfUrl ?? doc.pdfUrl;
  if (pdfTarget) {
    const url = resolveAssetUrl(pdfTarget);
    if (!url) return false;
    await Linking.openURL(url);
    return true;
  }
  if (doc.documentText?.trim()) {
    await Share.share({
      title: options?.title ?? 'Contract',
      message: doc.documentText,
    });
    return true;
  }
  return false;
}

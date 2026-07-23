import { EmergencyHireContactStep } from '@/components/client/EmergencyHireContactOverlay';

type ContactResult = {
  conversationId: string;
  requestId: string;
};

type Options = {
  existingRequestId?: string | null;
  existingConversationId?: string;
  ensureRequest: () => Promise<string>;
  contact: (requestId: string) => Promise<{ conversationId: string }>;
  onStep: (step: EmergencyHireContactStep) => void;
};

export async function runEmergencyHireContactFlow(options: Options): Promise<ContactResult> {
  if (options.existingConversationId && options.existingRequestId) {
    options.onStep('opening');
    return {
      conversationId: options.existingConversationId,
      requestId: options.existingRequestId,
    };
  }

  if (options.existingRequestId) {
    options.onStep('connecting');
    const contact = await options.contact(options.existingRequestId);
    options.onStep('messaging');
    options.onStep('opening');
    return { conversationId: contact.conversationId, requestId: options.existingRequestId };
  }

  options.onStep('publishing');
  const requestId = await options.ensureRequest();
  options.onStep('connecting');
  const contact = await options.contact(requestId);
  options.onStep('messaging');
  options.onStep('opening');
  return { conversationId: contact.conversationId, requestId };
}

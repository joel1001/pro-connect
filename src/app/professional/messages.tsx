import { ConversationInboxView } from '@/components/organisms/ConversationInboxView';
import { roleAccent } from '@/theme';

export default function ProfessionalMessages() {
  return <ConversationInboxView role="professional" accent={roleAccent.professional} />;
}

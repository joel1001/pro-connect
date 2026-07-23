import { ConversationInboxView } from '@/components/organisms/ConversationInboxView';
import { roleAccent } from '@/theme';

export default function ClientMessages() {
  return <ConversationInboxView role="client" accent={roleAccent.client} />;
}

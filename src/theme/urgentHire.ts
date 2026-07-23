/** Shared Urgent Hire accent surfaces — aligned with EmergencyHireDisclaimer. */
export const urgentHireColors = {
  surface: '#FFF7ED',
  border: '#FED7AA',
  body: '#7C2D12',
  icon: '#C2410C',
  iconBg: '#FFEDD5',
  expiredSurface: '#FEF2F2',
  /** Client message bubble — yellow-green pastel */
  messageClient: '#EEF8E3',
  messageClientBorder: '#D4EAB8',
  /** Professional message bubble — yellow-blue pastel */
  messagePro: '#E8F4FC',
  messageProBorder: '#C5DFF5',
  messageText: '#1E293B',
} as const;

/** Client vs pro bubble in urgent hire chat (by sender, not viewer). */
export function urgentHireMessageBubble(isProfessionalView: boolean, mine: boolean) {
  const fromClient = isProfessionalView ? !mine : mine;
  return fromClient
    ? {
        backgroundColor: urgentHireColors.messageClient,
        borderColor: urgentHireColors.messageClientBorder,
      }
    : {
        backgroundColor: urgentHireColors.messagePro,
        borderColor: urgentHireColors.messageProBorder,
      };
}

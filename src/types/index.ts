export type UserRole = 'CLIENT' | 'PROFESSIONAL' | 'ADMIN' | 'SUPER_ADMIN';

export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'PENDING_VERIFICATION'
  | 'BANNED';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthUser {
  userId: string;
  email?: string;
  role: UserRole;
  /** All roles the account can switch between (single account, multi-role). */
  roles: UserRole[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  email?: string;
  role: UserRole;
  roles?: UserRole[];
}

export interface ResendCodeResponse {
  message: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  active: boolean;
  sortOrder: number;
}

export interface ProfessionalUser {
  id: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  headline: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  location?: { type: 'Point'; coordinates: [number, number] };
  address?: string;
  serviceRadiusKm: number;
  trustScore: number;
  rating: number;
  totalReviews: number;
  completedJobs: number;
  startingPrice: number;
  categoryIds: string[];
  available: boolean;
  online: boolean;
  lastSeenAt?: string;
  emergencyHireEnabled?: boolean;
  credentials?: ProfessionalCredentialsPublic;
}

export interface ProfessionalCredentialsPublic {
  professionalTitle?: string;
  collegeAssociated?: boolean;
  professionalCollege?: string;
  professionalCollegeUrl?: string;
  licenseNumber?: string;
  licenseVerificationUrl?: string;
  certifications?: CertificationPublic[];
  portfolioLinks?: PortfolioLinkPublic[];
  portfolioUrls?: string[];
  completedWorks?: CompletedWorkPublic[];
  resume?: ResumePublic;
  curriculumUrl?: string;
  clientReferences?: ClientReferencePublic[];
  linkedInUrl?: string;
  githubUrl?: string;
  behanceUrl?: string;
  dribbbleUrl?: string;
  websiteUrl?: string;
  verificationBadges?: string[];
}

export interface PortfolioLinkPublic {
  title?: string;
  url: string;
  type?: string;
}

export interface ResumePublic {
  fileName?: string;
  fileUrl?: string;
  uploadedAt?: string;
}

export interface CertificationPublic {
  name: string;
  issuer?: string;
  credentialUrl?: string;
  issueDate?: string;
  expiryDate?: string;
}

export interface CompletedWorkPublic {
  title: string;
  description?: string;
  externalUrl?: string;
  imageUrls?: string[];
  completedAt?: string;
}

export interface ClientReferencePublic {
  clientName: string;
  company?: string;
  projectDescription?: string;
  testimonial?: string;
  referenceUrl?: string;
}

export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'SIGNED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTE';

export type ContractDocumentSource = 'UPLOADED' | 'AUTO_GENERATED';

export interface Contract {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  serviceIds?: string[];
  status: ContractStatus;
  scheduledDate: string;
  amount: number;
  currency: string;
  platformFee: number;
  pdfUrl?: string;
  signedPdfUrl?: string;
  documentSource?: ContractDocumentSource;
  documentText?: string;
  disclaimerAcceptedAt?: string;
  clientSigned: boolean;
  professionalSigned: boolean;
  appointmentId?: string;
  paymentId?: string;
  createdAt?: string;
}

export type AppointmentStatus =
  | 'PENDING'
  | 'PENDING_CLIENT_RESPONSE'
  | 'PENDING_PROFESSIONAL_RESPONSE'
  | 'COUNTER_PROPOSED'
  | 'ACCEPTED'
  | 'CONFIRMED'
  | 'MODIFIED'
  | 'CANCELLED'
  | 'DECLINED'
  | 'COMPLETED';

export type AppointmentSource = 'STANDARD' | 'EMERGENCY';

export interface AppointmentSnapshot {
  date?: string;
  time?: string;
  durationMinutes: number;
  serviceIds?: string[];
  notes?: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
}

export interface AppointmentHistoryEntry {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  previousSnapshot?: AppointmentSnapshot;
  proposedSnapshot?: AppointmentSnapshot;
  message?: string;
  createdAt?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  professionalId: string;
  source: AppointmentSource;
  emergencyHireId?: string;
  contractId?: string;
  status: AppointmentStatus;
  active?: AppointmentSnapshot;
  history?: AppointmentHistoryEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AppointmentRealtimeUpdate {
  event: 'APPOINTMENT_UPDATED';
  appointmentId: string;
  action?: string;
  newStatus?: AppointmentStatus;
}

export interface ContractRealtimeUpdate {
  event: 'CONTRACT_UPDATED';
  contractId: string;
  newStatus?: ContractStatus;
}

export interface PaymentRealtimeUpdate {
  event: 'PAYMENT_UPDATED';
  paymentId: string;
  newStatus?: PaymentStatus;
}

export type EmergencyHireStatus =
  | 'OPEN'
  | 'NEGOTIATING'
  | 'QUOTE_SENT'
  | 'QUOTE_DECLINED'
  | 'QUOTE_ACCEPTED'
  | 'CONTRACT_PENDING'
  | 'CONTRACT_SIGNED'
  | 'EXPIRED'
  | 'SEARCHING_PROFESSIONALS'
  | 'AWAITING_RESPONSES'
  | 'PROFESSIONAL_ACCEPTED'
  | 'PROFESSIONAL_SELECTED'
  | 'CONVERTED_TO_APPOINTMENT'
  | 'DECLINED'
  | 'CANCELLED'
  | 'COMPLETED';

export type EmergencyHireResponseStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'COUNTER_PROPOSED'
  | 'DECLINED'
  | 'CLOSED';

export interface EmergencyHireRequest {
  id: string;
  clientId: string;
  categoryId: string;
  preferredProfessionalId?: string;
  description: string;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
  attachmentUrls?: string[];
  preferredDate?: string;
  preferredTime?: string;
  status: EmergencyHireStatus;
  selectedProfessionalId?: string;
  appointmentId?: string;
  notifiedProfessionalIds?: string[];
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmergencyHireResponse {
  id: string;
  requestId: string;
  professionalId: string;
  status: EmergencyHireResponseStatus;
  proposedDate?: string;
  proposedTime?: string;
  message?: string;
  distanceKm?: number;
  conversationId?: string;
  contractId?: string;
  createdAt?: string;
  respondedAt?: string;
}

export interface EmergencyHireAvailableProfessional {
  id: string;
  displayName: string;
  headline?: string;
  profession: string;
  avatarUrl?: string;
  distanceKm: number;
  rating: number;
  completedJobs: number;
  estimatedResponseMinutes: number;
  online: boolean;
  emergencyHireEnabled?: boolean;
  categoryId: string;
}

export type NegotiationProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED';

export interface EmergencyHireNegotiation {
  id: string;
  requestId: string;
  conversationId: string;
  professionalId: string;
  clientId: string;
  proposedBy: string;
  status: NegotiationProposalStatus;
  serviceDate?: string;
  serviceTime?: string;
  estimatedArrivalTime?: string;
  price?: number;
  currency?: string;
  serviceIds?: string[];
  notes?: string;
  estimatedDurationMinutes?: number;
  messageId?: string;
  contractId?: string;
  createdAt?: string;
  respondedAt?: string;
}

export interface WeeklyAvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ProfessionalAvailability {
  professionalId: string;
  slotDurationMinutes: number;
  weeklySlots: WeeklyAvailabilitySlot[];
  blockedIntervals?: {
    type?: 'LUNCH' | 'TIME_OFF' | 'DAY_OFF' | 'VACATION' | string;
    date?: string;
    startDate?: string;
    endDate?: string;
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    allDay?: boolean;
    label?: string;
    effectiveFrom?: string;
    effectiveUntil?: string;
  }[];
  updatedAt?: string;
}

export type PaymentStatus = 'PENDING' | 'HELD' | 'RELEASED' | 'REFUNDED' | 'DISPUTE';

export interface Payment {
  id: string;
  contractId: string;
  clientId: string;
  professionalId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  countryCode?: string;
  platformFee: number;
  customCommissionsTotal?: number;
  customCommissions?: CountryCommissionRule[];
  professionalNet: number;
  commissionRate: number;
  heldAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  simulated?: boolean;
  paymentProvider?: string;
  providerTransactionId?: string;
  createdAt?: string;
}

export interface CountryCommissionRule {
  key: string;
  label: string;
  rate: number;
  amount?: number;
  deductFromProfessional?: boolean;
  taxable?: boolean;
  active?: boolean;
}

export type PricingType = 'HOURLY' | 'FIXED';
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface Service {
  id: string;
  professionalId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  pricingType?: PricingType;
  allowsBargaining?: boolean;
  durationMinutes: number;
  active: boolean;
}

export interface ServiceEntryInput {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  pricingType: PricingType;
  allowsBargaining: boolean;
  durationMinutes?: number;
}

export interface PriceOffer {
  id: string;
  conversationId: string;
  serviceId: string;
  serviceName?: string;
  clientId: string;
  professionalId: string;
  offeredAmount: number;
  listedPrice?: number;
  currency: string;
  status: OfferStatus;
  messageId?: string;
  clientNote?: string;
  createdAt?: string;
  respondedAt?: string;
}

export interface ChatPeer {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  headline?: string;
  role?: UserRole;
}

export interface Conversation {
  id: string;
  participants: string[];
  contractId?: string;
  emergencyHireRequestId?: string;
  lastMessageAt?: string;
  createdAt?: string;
  peer?: ChatPeer;
  unreadCount?: number;
  lastMessagePreview?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: string;
  message?: string;
  offerId?: string;
  negotiationId?: string;
  read: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId?: string;
  type: string;
  title: string;
  body: string;
  referenceId?: string;
  link?: string;
  metadata?: Record<string, string>;
  read: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  professionalId?: string;
  clientId?: string;
  targetUserId?: string;
  targetRole?: UserRole | string;
  reviewerId?: string;
  reviewerRole?: UserRole | string;
  clientName?: string;
  reviewerName?: string;
  contractId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ClientUser {
  id: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  displayName?: string;
  avatarUrl?: string;
  address?: string;
  totalContracts?: number;
  averageRatingGiven?: number;
  lastSeenAt?: string;
}

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Verification {
  id: string;
  userId: string;
  professionalId: string;
  status: VerificationStatus;
  identityValidated: boolean;
  titleValidated: boolean;
  collegeValidated: boolean;
  linkedInValidated: boolean;
  createdAt: string;
}

export interface UserSummary {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  country?: string | null;
  createdAt?: string;
}

export interface AppSettings {
  id: string;
  platformFee: number;
  proCommission: number;
  freeCommission: number;
  premiumCommission: number;
  defaultPlatformCommissionRate?: number;
  platformCommissionRatesByCountry?: Record<string, number>;
  marketplaceCommissionRate?: number;
  marketplaceCommissionRatesByCountry?: Record<string, number>;
  taxRatesByCountry?: Record<string, number>;
  customCommissionRulesByCountry?: Record<string, CountryCommissionRule[]>;
  storeFeeRates?: Record<string, number>;
  maxServiceRadiusKm: number;
}

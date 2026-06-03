// ─── Domain types ────────────────────────────────────────────────────────────

export type SectorColor =
  | "#3D5BE3"
  | "#2A9D6E"
  | "#E08A2B"
  | "#8B5CB8"
  | "#D44A5C"
  | "#3B83C9";

export interface Sector {
  id: string;
  userId: string;
  name: string;
  color: SectorColor | string;
  priority: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type CompanyStatus =
  | "to_contact"
  | "contacted"
  | "followed_up"
  | "interview"
  | "rejected"
  | "hot_opportunity";

export interface Company {
  id: string;
  userId: string;
  sectorId: string | null;
  name: string;
  location: string | null;
  website: string | null;
  hasRdOffice: boolean | null;
  technologies: string[];
  status: CompanyStatus;
  priorityScore: number | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  // Joined
  sector?: Sector | null;
  _contactCount?: number;
  _bestTemperature?: ContactTemperature | null;
}

export type ContactTemperature = "cold" | "warm" | "hot";
export type ContactType = "recruiter" | "consultant" | "engineer" | "acquaintance" | "referral";

export interface Contact {
  id: string;
  userId: string;
  companyId: string | null;
  firstName: string;
  lastName: string;
  role: string | null;
  email: string | null;
  phone?: string | null;
  linkedinUrl: string | null;
  contactType: ContactType | null;
  temperature: ContactTemperature | null;
  lastExchangeDate: string | null;
  lastExchangeSummary: string | null;
  nextFollowupDate: string | null;
  signalDetected: string | null;
  humanNotes: string | null;
  trustLevel: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  // Joined
  company?: Company | null;
}

export interface CV {
  id: string;
  userId: string;
  sectorId: string | null;
  versionNumber: number;
  lastUpdated: string | null;
  mainKeywords: string[];
  strengthsToHighlight: string[];
  pdfUrl: string | null;
  createdAt: Date | null;
  // Joined
  sector?: Sector | null;
}

export type ApplicationStatus =
  | "to_prepare"
  | "cv_sent"
  | "followup_planned"
  | "in_discussion"
  | "interview"
  | "waiting"
  | "rejected"
  | "won";

export type SentVia = "email" | "linkedin" | "referral" | "direct";

export interface Application {
  id: string;
  userId: string;
  companyId: string | null;
  contactId: string | null;
  sectorId: string | null;
  cvUsedId: string | null;
  jobTitle: string;
  messageSent: string | null;
  status: ApplicationStatus;
  sentDate: string | null;
  nextAction: string | null;
  feedbackReceived: string | null;
  sourceUrl?: string | null;
  sentVia: SentVia | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  // Joined
  company?: Company | null;
  sector?: Sector | null;
  cvUsed?: CV | null;
  contact?: Contact | null;
}

export type FollowupStatus = "pending" | "completed" | "skipped";

export interface Followup {
  id: string;
  userId: string;
  contactId: string | null;
  scheduledDate: string;
  status: FollowupStatus;
  messageTemplateUsed: string | null;
  myMessage: string | null;
  interlocutorResponse: string | null;
  completedAt: string | null;
  createdAt: Date | null;
  // Joined
  contact?: Contact | null;
}

export type TrainingStatus = "to_analyze" | "to_do" | "in_progress" | "done";
export type MarketRecognition = "high" | "medium" | "low";
export type ROIEstimated = "high" | "medium" | "low";

export interface Training {
  id: string;
  userId: string;
  sectorId: string | null;
  name: string;
  certificationAvailable: boolean | null;
  provider: string | null;
  price: number | null;
  durationHours: number | null;
  marketRecognition: MarketRecognition | null;
  priority: number | null;
  status: TrainingStatus;
  roiEstimated: ROIEstimated | null;
  createdAt: Date | null;
  // Joined
  sector?: Sector | null;
}

// ─── Meetings ────────────────────────────────────────────────────────────────

export type MeetingSentiment = "positive" | "neutral" | "negative";

export interface QuestionItem {
  question: string;
  asked: boolean;
  answer: string;
}

export interface Meeting {
  id: string;
  userId: string;
  companyId: string | null;
  contactId: string | null;
  applicationId: string | null;
  title: string;
  date: string;
  companyInfo: string | null;
  myPitch: string | null;
  jobMentioned: string | null;
  sentiment: MeetingSentiment | null;
  sentimentNotes: string | null;
  questionsData: QuestionItem[];
  nextSteps: string | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  // Joined
  company?: Company | null;
  contact?: Contact | null;
  application?: Application | null;
}

// ─── Dashboard stats ─────────────────────────────────────────────────────────

export interface DashboardStats {
  applicationsTotal: number;
  applicationsDelta: number;
  followupsThisMonth: number;
  followupsDelta: number;
  interviewsPlanned: number;
  responseRate: number;
  responseRateDelta: number;
  applicationsBySector: Array<{ sectorName: string; count: number; color: string }>;
  hotContacts: Contact[];
  todayActions: TodayAction[];
}

export interface TodayAction {
  type: "followup" | "interview" | "prepare";
  label: string;
  subLabel: string;
  contactId?: string;
  applicationId?: string;
}

// ─── AI types ────────────────────────────────────────────────────────────────

export interface AIMessageVariant {
  tone: "cordial" | "direct" | "with_value";
  toneLabel: string;
  message: string;
}

export interface AIJobExtraction {
  jobTitle: string;
  suggestedSector: string;
  keySkills: string[];
  recommendedCVKeywords: string[];
  pointsToHighlight: string[];
}

// ─── Insights engine ─────────────────────────────────────────────────────────

export type InsightCategory = "followup" | "hidden" | "behavior" | "action" | "quality";
export type InsightSeverity = "info" | "warning" | "action";

export interface Insight {
  id: string;
  ruleId: string;
  category: InsightCategory;
  severity: InsightSeverity;
  icon: string;
  title: string;
  body: string;
  actionLabel?: string;
  actionUrl?: string;
  score: number;
  relatedIds?: string[];
}

// ─── Calendar ────────────────────────────────────────────────────────────────

export type CalendarEventType =
  | "followup"
  | "followup_done"
  | "meeting"
  | "application"
  | "contact_followup";

export interface CalendarEvent {
  id: string;
  date: string; // ISO "YYYY-MM-DD"
  type: CalendarEventType;
  label: string;
  status?: string;
  contactId?: string | null;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

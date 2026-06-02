import { sql } from "drizzle-orm";
import {
  text,
  integer,
  real,
  blob,
  sqliteTable,
} from "drizzle-orm/sqlite-core";

// ─── Better Auth tables ─────────────────────────────────────────────────────

export const users = sqliteTable("user", {
  id:            text("id").primaryKey(),
  name:          text("name").notNull(),
  email:         text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
  image:         text("image"),
  role:          text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  createdAt:     integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt:     integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const sessions = sqliteTable("session", {
  id:        text("id").primaryKey(),
  userId:    text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  token:     text("token").notNull().unique(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const accounts = sqliteTable("account", {
  id:                   text("id").primaryKey(),
  userId:               text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId:            text("accountId").notNull(),
  providerId:           text("providerId").notNull(),
  accessToken:          text("accessToken"),
  refreshToken:         text("refreshToken"),
  idToken:              text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt:integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope:                text("scope"),
  password:             text("password"),
  createdAt:            integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt:            integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const verifications = sqliteTable("verification", {
  id:         text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value:      text("value").notNull(),
  expiresAt:  integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt:  integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt:  integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// ─── App tables ─────────────────────────────────────────────────────────────

export const sectors = sqliteTable("sector", {
  id:        text("id").primaryKey(),
  userId:    text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name:      text("name").notNull(),
  color:     text("color").notNull().default("#3D5BE3"),
  priority:  integer("priority").notNull().default(2),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const companies = sqliteTable("company", {
  id:            text("id").primaryKey(),
  userId:        text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  sectorId:      text("sectorId").references(() => sectors.id, { onDelete: "set null" }),
  name:          text("name").notNull(),
  location:      text("location"),
  website:       text("website"),
  hasRdOffice:   integer("hasRdOffice", { mode: "boolean" }).default(false),
  technologies:  text("technologies").default("[]"),   // JSON array
  status:        text("status", {
    enum: ["to_contact", "contacted", "followed_up", "interview", "rejected", "hot_opportunity"],
  }).notNull().default("to_contact"),
  priorityScore: integer("priorityScore").default(3),
  notes:         text("notes"),
  createdAt:     integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt:     integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const contacts = sqliteTable("contact", {
  id:                  text("id").primaryKey(),
  userId:              text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId:           text("companyId").references(() => companies.id, { onDelete: "set null" }),
  firstName:           text("firstName").notNull(),
  lastName:            text("lastName").notNull(),
  role:                text("role"),
  email:               text("email"),
  linkedinUrl:         text("linkedinUrl"),
  contactType:         text("contactType", {
    enum: ["recruiter", "consultant", "engineer", "acquaintance", "referral"],
  }).default("recruiter"),
  temperature:         text("temperature", { enum: ["cold", "warm", "hot"] }).default("cold"),
  lastExchangeDate:    text("lastExchangeDate"),   // ISO date string
  lastExchangeSummary: text("lastExchangeSummary"),
  nextFollowupDate:    text("nextFollowupDate"),   // ISO date string
  signalDetected:      text("signalDetected"),
  humanNotes:          text("humanNotes"),
  trustLevel:          integer("trustLevel").default(3),
  createdAt:           integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt:           integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const cvs = sqliteTable("cv", {
  id:                  text("id").primaryKey(),
  userId:              text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  sectorId:            text("sectorId").references(() => sectors.id, { onDelete: "set null" }),
  versionNumber:       integer("versionNumber").notNull().default(1),
  lastUpdated:         text("lastUpdated"),
  mainKeywords:        text("mainKeywords").default("[]"),         // JSON array
  strengthsToHighlight:text("strengthsToHighlight").default("[]"), // JSON array
  pdfUrl:              text("pdfUrl"),
  createdAt:           integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// Uploaded CV PDF stored as a BLOB (included in DB backups, served via authed route)
export const cvFiles = sqliteTable("cv_file", {
  id:        text("id").primaryKey(),
  cvId:      text("cvId").notNull().references(() => cvs.id, { onDelete: "cascade" }),
  userId:    text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName:  text("fileName").notNull(),
  mimeType:  text("mimeType").notNull().default("application/pdf"),
  size:      integer("size").notNull().default(0),
  data:      blob("data").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const applications = sqliteTable("application", {
  id:               text("id").primaryKey(),
  userId:           text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId:        text("companyId").references(() => companies.id, { onDelete: "set null" }),
  contactId:        text("contactId").references(() => contacts.id, { onDelete: "set null" }),
  sectorId:         text("sectorId").references(() => sectors.id, { onDelete: "set null" }),
  cvUsedId:         text("cvUsedId").references(() => cvs.id, { onDelete: "set null" }),
  jobTitle:         text("jobTitle").notNull(),
  messageSent:      text("messageSent"),
  status:           text("status", {
    enum: ["to_prepare", "cv_sent", "followup_planned", "in_discussion", "interview", "waiting", "rejected", "won"],
  }).notNull().default("to_prepare"),
  sentDate:         text("sentDate"),
  nextAction:       text("nextAction"),
  feedbackReceived: text("feedbackReceived"),
  sourceUrl:        text("sourceUrl"),   // Lien de l'offre (clipper/capture)
  sentVia:          text("sentVia", { enum: ["email", "linkedin", "referral", "direct"] }).default("email"),
  createdAt:        integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt:        integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const followups = sqliteTable("followup", {
  id:                   text("id").primaryKey(),
  userId:               text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  contactId:            text("contactId").references(() => contacts.id, { onDelete: "cascade" }),
  scheduledDate:        text("scheduledDate").notNull(),
  status:               text("status", { enum: ["pending", "completed", "skipped"] }).notNull().default("pending"),
  messageTemplateUsed:  text("messageTemplateUsed"),
  myMessage:            text("myMessage"),
  interlocutorResponse: text("interlocutorResponse"),
  completedAt:          text("completedAt"),
  createdAt:            integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const trainings = sqliteTable("training", {
  id:                     text("id").primaryKey(),
  userId:                 text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  sectorId:               text("sectorId").references(() => sectors.id, { onDelete: "set null" }),
  name:                   text("name").notNull(),
  certificationAvailable: integer("certificationAvailable", { mode: "boolean" }).default(false),
  provider:               text("provider"),
  price:                  real("price"),
  durationHours:          real("durationHours"),
  marketRecognition:      text("marketRecognition", { enum: ["high", "medium", "low"] }).default("medium"),
  priority:               integer("priority").default(2),
  status:                 text("status", {
    enum: ["to_analyze", "to_do", "in_progress", "done"],
  }).notNull().default("to_analyze"),
  roiEstimated:           text("roiEstimated", { enum: ["high", "medium", "low"] }).default("medium"),
  createdAt:              integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// ─── Meetings / Notes de réunion ────────────────────────────────────────────

export const meetings = sqliteTable("meeting", {
  id:              text("id").primaryKey(),
  userId:          text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId:       text("companyId").references(() => companies.id, { onDelete: "set null" }),
  contactId:       text("contactId").references(() => contacts.id, { onDelete: "set null" }),
  applicationId:   text("applicationId").references(() => applications.id, { onDelete: "set null" }),
  title:           text("title").notNull(),
  date:            text("date").notNull(), // ISO date string
  companyInfo:     text("companyInfo"),     // What the interviewer said about the company
  myPitch:         text("myPitch"),         // The presentation speech given
  jobMentioned:    text("jobMentioned"),    // Job offers mentioned during the meeting
  sentiment:       text("sentiment", { enum: ["positive", "neutral", "negative"] }).default("neutral"),
  sentimentNotes:  text("sentimentNotes"),
  questionsData:   text("questionsData").default("[]"), // JSON: [{question, asked, answer}]
  nextSteps:       text("nextSteps"),
  notes:           text("notes"),
  createdAt:       integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt:       integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// ─── Admin audit logs ───────────────────────────────────────────────────────

export const adminLogs = sqliteTable("admin_log", {
  id:          text("id").primaryKey(),
  userId:      text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  action:      text("action").notNull(),
  description: text("description"),
  ipAddress:   text("ipAddress"),
  metadata:    text("metadata"),
  createdAt:   integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});


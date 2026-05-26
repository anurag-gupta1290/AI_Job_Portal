// ── Auth & User ──────────────────────────────────────────────────

export type Role =
  | 'ROLE_JOB_SEEKER'
  | 'ROLE_JOB_PROVIDER'
  | 'ROLE_TRAINING_PROVIDER'
  | 'ROLE_ADMIN';

export interface UserInfo {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserInfo;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ── API Wrapper ──────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
  error: string | null;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ── Skills ───────────────────────────────────────────────────────

export interface Skill {
  id: number;
  name: string;
  category: string;
}

// ── Admin ────────────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  isEmailVerified: boolean;
  phone?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  jobSeekers: number;
  jobProviders: number;
  trainers: number;
}

// ── Seeker Profile ───────────────────────────────────────────────

export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type ProfileVisibility = 'PUBLIC' | 'EMPLOYERS_ONLY' | 'PRIVATE';
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';
export type ExperienceLevel = 'FRESHER' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';
export type JobStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED';
export type ApplicationStatus = 'APPLIED' | 'VIEWED' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFERED' | 'REJECTED';

export interface ExperienceDto {
  id: number;
  company: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
}

export interface EducationDto {
  id: number;
  institution: string;
  degree: string;
  field?: string;
  year?: number;
  grade?: string;
}

export interface ProfileSkillDto {
  id: number;
  skillId: number;
  skillName: string;
  skillCategory: string;
  level: SkillLevel;
  years?: number;
}

export interface SeekerProfile {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  headline?: string;
  summary?: string;
  location?: string;
  visibility: ProfileVisibility;
  resumeUrl?: string;
  currentSalary?: number;
  expectedSalary?: number;
  totalExperience?: number;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  completionScore: number;
  activelyLooking: boolean;
  experiences: ExperienceDto[];
  educations: EducationDto[];
  skills: ProfileSkillDto[];
  createdAt: string;
  updatedAt: string;
}

// ── Jobs ─────────────────────────────────────────────────────────

export interface CompanyDto {
  id: number;
  name: string;
  industry?: string;
  size?: string;
  location?: string;
  logoUrl?: string;
  isVerified: boolean;
}

export interface JobSkillDto {
  skillId: number;
  skillName: string;
  requiredLevel?: SkillLevel;
  isMandatory: boolean;
}

export interface JobPost {
  id: number;
  title: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  location?: string;
  jobType?: JobType;
  experienceLevel?: ExperienceLevel;
  status: JobStatus;
  salaryMin?: number;
  salaryMax?: number;
  deadline?: string;
  viewCount: number;
  applicationCount: number;
  company?: CompanyDto;
  skills: JobSkillDto[];
  createdAt: string;
  updatedAt: string;
}

// ── Applications ─────────────────────────────────────────────────

export interface JobSummaryDto {
  id: number;
  title: string;
  location?: string;
  companyName?: string;
  companyLogo?: string;
  salaryMin?: number;
  salaryMax?: number;
}

export interface Application {
  id: number;
  status: ApplicationStatus;
  matchScore?: number;
  coverLetter?: string;
  resumeSnapshot?: string;
  appliedAt: string;
  updatedAt: string;
  job: JobSummaryDto;
}

export interface SeekerStats {
  applications: number;
  savedJobs: number;
  enrolledCourses: number;
}

// ── Provider / Company ────────────────────────────────────────────

export interface Company {
  id: number;
  userId: number;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
  location?: string;
  logoUrl?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobSkillRequest {
  skillId: number;
  requiredLevel?: SkillLevel;
  isMandatory?: boolean;
}

export interface CreateJobPostRequest {
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  location?: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  status?: JobStatus;
  salaryMin?: number;
  salaryMax?: number;
  deadline?: string;
  maxApplicants?: number;
  skills?: JobSkillRequest[];
}

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
  notes?: string;
}

export interface ApplicationDetailSeeker {
  profileId: number;
  userId: number;
  fullName: string;
  email: string;
  headline?: string;
  location?: string;
  totalExperience?: number;
  expectedSalary?: number;
  resumeUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  completionScore: number;
  activelyLooking: boolean;
  skills: Array<{ skillId: number; skillName: string; level: SkillLevel; years?: number }>;
  experiences: Array<{ company: string; title: string; startDate: string; endDate?: string; isCurrent: boolean }>;
  educations: Array<{ institution: string; degree: string; field?: string; year?: number }>;
}

export interface ApplicationDetail {
  id: number;
  status: ApplicationStatus;
  matchScore?: number;
  coverLetter?: string;
  resumeSnapshot?: string;
  providerNotes?: string;
  appliedAt: string;
  updatedAt: string;
  job: { id: number; title: string; location?: string };
  seeker: ApplicationDetailSeeker;
}

export interface ProviderDashboardStats {
  activeJobs: number;
  totalJobs: number;
  totalApplicants: number;
  shortlisted: number;
  interviewed: number;
  offered: number;
}

// ── Training / Courses ────────────────────────────────────────────

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type MaterialType = 'PDF' | 'SLIDES' | 'ASSIGNMENT' | 'LINK';

export interface TrainerSummary {
  id: number;
  fullName: string;
  email: string;
}

export interface LessonDto {
  id: number;
  title: string;
  videoUrl?: string;
  durationMinutes?: number;
  orderIndex: number;
  isPreview: boolean;
}

export interface MaterialDto {
  id: number;
  title: string;
  fileUrl?: string;
  type: MaterialType;
}

export interface Course {
  id: number;
  trainer: TrainerSummary;
  title: string;
  description?: string;
  syllabus?: string;
  fees: number;
  durationHours?: number;
  status: CourseStatus;
  totalEnrolled: number;
  thumbnailUrl?: string;
  lessons: LessonDto[];
  materials: MaterialDto[];
  skills: string[];
  createdAt: string;
  updatedAt: string;
  enrolled?: boolean;
}

export interface CourseSummary {
  id: number;
  title: string;
  thumbnailUrl?: string;
  totalLessons: number;
}

export interface EnrolmentSeekerSummary {
  id: number;
  fullName: string;
  email: string;
}

export interface Enrolment {
  id: number;
  course: CourseSummary;
  seeker: EnrolmentSeekerSummary;
  progressPct: number;
  enrolledAt: string;
  completedAt?: string;
  completedLessonIds: number[];
}

export interface TrainerDashboardStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalEnrolments: number;
  completedEnrolments: number;
}

export interface CreateCourseRequest {
  title: string;
  description?: string;
  syllabus?: string;
  fees: number;
  durationHours?: number;
  skillIds?: number[];
}

export interface UpdateCourseRequest extends CreateCourseRequest {
  status?: CourseStatus;
}

export interface AddLessonRequest {
  title: string;
  videoUrl?: string;
  durationMinutes?: number;
  orderIndex: number;
  isPreview?: boolean;
}

export interface AddMaterialRequest {
  title: string;
  type: MaterialType;
  fileUrl?: string;
}

// ── Live Sessions ─────────────────────────────────────────────────

export type LiveSessionPlatform = 'ZOOM' | 'JITSI' | 'GOOGLE_MEET' | 'OTHER';

export interface LiveSession {
  id: number;
  courseId: number;
  courseTitle: string;
  title: string;
  description?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  platform: LiveSessionPlatform;
  meetingUrl: string;
  recordingUrl?: string;
  createdAt: string;
}

export interface CreateLiveSessionRequest {
  title: string;
  description?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  platform: LiveSessionPlatform;
  meetingUrl: string;
}

export interface UpdateLiveSessionRequest extends Partial<CreateLiveSessionRequest> {
  recordingUrl?: string;
}

// ── Assessment ────────────────────────────────────────────────────

export type QuestionType = 'MCQ' | 'MULTI_SELECT' | 'SHORT_ANSWER';

export interface AssessmentOption {
  id: number;
  text: string;
  isCorrect: boolean | null; // null when seeker view (answers hidden)
}

export interface AssessmentQuestion {
  id: number;
  type: QuestionType;
  text: string;
  explanation: string | null;
  orderIndex: number;
  marks: number;
  options: AssessmentOption[];
}

export interface Assessment {
  id: number;
  courseId: number;
  courseTitle: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimitMinutes?: number;
  isPublished: boolean;
  questions: AssessmentQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface AnswerResultDto {
  questionId: number;
  questionText: string;
  questionType: QuestionType;
  selectedOptionId: number | null;
  selectedOptionIds: number[] | null;
  answerText: string | null;
  isCorrect: boolean | null;
  marksAwarded: number;
  explanation: string | null;
}

export interface AttemptResult {
  id: number;
  assessmentId: number;
  assessmentTitle: string;
  seekerId?: number;
  seekerName?: string;
  seekerEmail?: string;
  score: number;
  passingScore: number;
  passed: boolean;
  submittedAt: string;
  answers: AnswerResultDto[];
}

export interface CreateAssessmentRequest {
  title: string;
  description?: string;
  passingScore: number;
  timeLimitMinutes?: number;
  isPublished: boolean;
}

export interface OptionRequest {
  text: string;
  isCorrect: boolean;
}

export interface AddQuestionRequest {
  type: QuestionType;
  text: string;
  explanation?: string;
  orderIndex: number;
  marks?: number;
  options?: OptionRequest[];
}

export interface AnswerRequest {
  questionId: number;
  selectedOptionId?: number;
  selectedOptionIds?: number[];
  answerText?: string;
}

// ── Certificate ───────────────────────────────────────────────────

export interface Certificate {
  id: number;
  enrolmentId: number;
  certificateNumber: string;
  seekerName: string;
  courseTitle: string;
  trainerName: string;
  issuedAt: string;
  fileUrl: string;
}

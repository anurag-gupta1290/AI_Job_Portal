import { apiClient } from './client';
import type {
  AddQuestionRequest,
  AnswerRequest,
  Assessment,
  AttemptResult,
  Certificate,
  Course,
  CreateAssessmentRequest,
  CreateLiveSessionRequest,
  Enrolment,
  LiveSession,
  TrainerDashboardStats,
  CreateCourseRequest,
  UpdateCourseRequest,
  UpdateLiveSessionRequest,
  AddLessonRequest,
  AddMaterialRequest,
  PageResponse,
} from '../types';

// ── Dashboard ─────────────────────────────────────────────────────

export const getDashboard = async (): Promise<TrainerDashboardStats> => {
  const { data } = await apiClient.get('/trainer/dashboard');
  return data.data;
};

// ── Courses ───────────────────────────────────────────────────────

export const getMyCourses = async (page = 0, size = 20): Promise<PageResponse<Course>> => {
  const { data } = await apiClient.get('/trainer/courses', { params: { page, size } });
  return data.data;
};

export const getCourseDetail = async (id: number): Promise<Course> => {
  const { data } = await apiClient.get(`/trainer/courses/${id}`);
  return data.data;
};

export const createCourse = async (req: CreateCourseRequest): Promise<Course> => {
  const { data } = await apiClient.post('/trainer/courses', req);
  return data.data;
};

export const updateCourse = async (id: number, req: UpdateCourseRequest): Promise<Course> => {
  const { data } = await apiClient.put(`/trainer/courses/${id}`, req);
  return data.data;
};

export const uploadThumbnail = async (id: number, file: File): Promise<Course> => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post(`/trainer/courses/${id}/thumbnail`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

// ── Lessons ───────────────────────────────────────────────────────

export const addLesson = async (courseId: number, req: AddLessonRequest): Promise<Course> => {
  const { data } = await apiClient.post(`/trainer/courses/${courseId}/lessons`, req);
  return data.data;
};

export const updateLesson = async (
  courseId: number,
  lessonId: number,
  req: AddLessonRequest,
): Promise<Course> => {
  const { data } = await apiClient.put(`/trainer/courses/${courseId}/lessons/${lessonId}`, req);
  return data.data;
};

export const deleteLesson = async (courseId: number, lessonId: number): Promise<void> => {
  await apiClient.delete(`/trainer/courses/${courseId}/lessons/${lessonId}`);
};

export const uploadLessonVideo = async (
  courseId: number,
  lessonId: number,
  file: File,
): Promise<string> => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post(
    `/trainer/courses/${courseId}/lessons/${lessonId}/video`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data;
};

// ── Materials ────────────────────────────────────────────────────

export const addMaterial = async (courseId: number, req: AddMaterialRequest): Promise<Course> => {
  const { data } = await apiClient.post(`/trainer/courses/${courseId}/materials`, req);
  return data.data;
};

export const deleteMaterial = async (courseId: number, materialId: number): Promise<void> => {
  await apiClient.delete(`/trainer/courses/${courseId}/materials/${materialId}`);
};

// ── Enrolments ───────────────────────────────────────────────────

export const getCourseEnrolments = async (
  courseId: number,
  page = 0,
  size = 20,
): Promise<PageResponse<Enrolment>> => {
  const { data } = await apiClient.get(`/trainer/courses/${courseId}/enrolments`, {
    params: { page, size },
  });
  return data.data;
};

// ── Public course browsing ────────────────────────────────────────

export const searchCourses = async (
  keyword?: string,
  page = 0,
  size = 20,
): Promise<PageResponse<Course>> => {
  const { data } = await apiClient.get('/courses', { params: { keyword, page, size } });
  return data.data;
};

export const getPublicCourse = async (id: number): Promise<Course> => {
  const { data } = await apiClient.get(`/courses/${id}`);
  return data.data;
};

export const enrolInCourse = async (id: number): Promise<Enrolment> => {
  const { data } = await apiClient.post(`/courses/${id}/enrol`);
  return data.data;
};

export const getMyEnrolments = async (): Promise<Enrolment[]> => {
  const { data } = await apiClient.get('/courses/my');
  return data.data;
};

export const markLessonComplete = async (
  courseId: number,
  lessonId: number,
): Promise<Enrolment> => {
  const { data } = await apiClient.post(`/courses/${courseId}/lessons/${lessonId}/complete`);
  return data.data;
};

// ── Video watch progress ──────────────────────────────────────────

export const updateWatchProgress = async (
  courseId: number,
  lessonId: number,
  watchedPct: number,
): Promise<void> => {
  await apiClient.post(`/courses/${courseId}/lessons/${lessonId}/watch-progress`, { watchedPct });
};

// ── Certificate ───────────────────────────────────────────────────

export const getCertificate = async (courseId: number): Promise<Certificate> => {
  const { data } = await apiClient.get(`/courses/${courseId}/certificate`);
  return data.data;
};

// ── Live sessions (public) ────────────────────────────────────────

export const getCourseSessions = async (courseId: number): Promise<LiveSession[]> => {
  const { data } = await apiClient.get(`/courses/${courseId}/sessions`);
  return data.data;
};

// ── Live sessions (trainer) ───────────────────────────────────────

export const createSession = async (
  courseId: number,
  req: CreateLiveSessionRequest,
): Promise<LiveSession> => {
  const { data } = await apiClient.post(`/trainer/courses/${courseId}/sessions`, req);
  return data.data;
};

export const updateSession = async (
  courseId: number,
  sessionId: number,
  req: UpdateLiveSessionRequest,
): Promise<LiveSession> => {
  const { data } = await apiClient.put(
    `/trainer/courses/${courseId}/sessions/${sessionId}`,
    req,
  );
  return data.data;
};

export const deleteSession = async (courseId: number, sessionId: number): Promise<void> => {
  await apiClient.delete(`/trainer/courses/${courseId}/sessions/${sessionId}`);
};

// ── Assessment (trainer) ──────────────────────────────────────────

export const createAssessment = async (
  courseId: number,
  req: CreateAssessmentRequest,
): Promise<Assessment> => {
  const { data } = await apiClient.post(`/trainer/courses/${courseId}/assessment`, req);
  return data.data;
};

export const getAssessmentTrainer = async (courseId: number): Promise<Assessment> => {
  const { data } = await apiClient.get(`/trainer/courses/${courseId}/assessment`);
  return data.data;
};

export const updateAssessment = async (
  courseId: number,
  req: CreateAssessmentRequest,
): Promise<Assessment> => {
  const { data } = await apiClient.put(`/trainer/courses/${courseId}/assessment`, req);
  return data.data;
};

export const deleteAssessment = async (courseId: number): Promise<void> => {
  await apiClient.delete(`/trainer/courses/${courseId}/assessment`);
};

export const addQuestion = async (
  courseId: number,
  req: AddQuestionRequest,
): Promise<Assessment> => {
  const { data } = await apiClient.post(`/trainer/courses/${courseId}/assessment/questions`, req);
  return data.data;
};

export const updateQuestion = async (
  courseId: number,
  questionId: number,
  req: AddQuestionRequest,
): Promise<Assessment> => {
  const { data } = await apiClient.put(
    `/trainer/courses/${courseId}/assessment/questions/${questionId}`,
    req,
  );
  return data.data;
};

export const deleteQuestion = async (
  courseId: number,
  questionId: number,
): Promise<Assessment> => {
  const { data } = await apiClient.delete(
    `/trainer/courses/${courseId}/assessment/questions/${questionId}`,
  );
  return data.data;
};

export const getTrainerAttempts = async (courseId: number): Promise<AttemptResult[]> => {
  const { data } = await apiClient.get(`/trainer/courses/${courseId}/assessment/attempts`);
  return data.data;
};

// ── Assessment (seeker) ───────────────────────────────────────────

export const getAssessment = async (courseId: number): Promise<Assessment> => {
  const { data } = await apiClient.get(`/courses/${courseId}/assessment`);
  return data.data;
};

export const submitAttempt = async (
  courseId: number,
  answers: AnswerRequest[],
): Promise<AttemptResult> => {
  const { data } = await apiClient.post(`/courses/${courseId}/assessment/attempt`, { answers });
  return data.data;
};

export const getMyAttempts = async (courseId: number): Promise<AttemptResult[]> => {
  const { data } = await apiClient.get(`/courses/${courseId}/assessment/attempts/my`);
  return data.data;
};

// ── Chunked video upload ──────────────────────────────────────────

const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB per chunk

export const uploadVideoChunked = async (
  courseId: number,
  lessonId: number,
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> => {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  // 1. Init
  const initRes = await apiClient.post(
    `/trainer/courses/${courseId}/lessons/${lessonId}/video/init`,
    { fileName: file.name, totalChunks },
  );
  const uploadId: string = initRes.data.data.uploadId;

  // 2. Upload chunks sequentially
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const form = new FormData();
    form.append('uploadId', uploadId);
    form.append('chunkIndex', String(i));
    form.append('chunk', file.slice(start, end));
    await apiClient.post(
      `/trainer/courses/${courseId}/lessons/${lessonId}/video/chunk`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    onProgress(Math.round(((i + 1) / totalChunks) * 90));
  }

  // 3. Finalize
  const finalRes = await apiClient.post(
    `/trainer/courses/${courseId}/lessons/${lessonId}/video/finalize`,
    { uploadId },
  );
  onProgress(100);
  return finalRes.data.data;
};

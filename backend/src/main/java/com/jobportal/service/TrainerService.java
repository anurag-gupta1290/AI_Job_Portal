package com.jobportal.service;

import com.jobportal.dto.request.TrainerDTOs.*;
import com.jobportal.dto.response.CertificateResponse;
import com.jobportal.dto.response.CourseResponse;
import com.jobportal.dto.response.EnrolmentResponse;
import com.jobportal.dto.response.LiveSessionResponse;
import com.jobportal.dto.response.TrainerDashboardResponse;
import com.jobportal.entity.*;
import com.jobportal.entity.enums.CourseStatus;
import com.jobportal.exception.BusinessException;
import com.jobportal.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class TrainerService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CourseLessonRepository lessonRepository;
    private final CourseMaterialRepository materialRepository;
    private final CourseSkillRepository courseSkillRepository;
    private final SkillRepository skillRepository;
    private final EnrolmentRepository enrolmentRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final VideoProgressRepository videoProgressRepository;
    private final LiveSessionRepository liveSessionRepository;
    private final FileStorageService fileStorageService;
    private final ChunkedUploadService chunkedUploadService;
    private final CertificateService certificateService;

    // ── Course CRUD ───────────────────────────────────────────────────────

    @Transactional
    public CourseResponse createCourse(String email, CreateCourseRequest req) {
        User trainer = getUser(email);
        Course course = Course.builder()
                .trainer(trainer)
                .title(req.title())
                .description(req.description())
                .syllabus(req.syllabus())
                .fees(req.fees())
                .durationHours(req.durationHours())
                .build();
        course = courseRepository.save(course);
        attachSkills(course, req.skillIds());
        return toResponse(course, false);
    }

    public Page<CourseResponse> getMyCourses(String email, int page, int size) {
        User trainer = getUser(email);
        return courseRepository.findByTrainerId(trainer.getId(), PageRequest.of(page, size))
                .map(c -> toResponse(c, false));
    }

    public CourseResponse getCourse(Long id, String emailOrNull) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("Course not found"));
        boolean enrolled = false;
        if (emailOrNull != null) {
            User user = userRepository.findByEmail(emailOrNull).orElse(null);
            if (user != null) enrolled = enrolmentRepository.existsByCourseIdAndSeekerId(id, user.getId());
        }
        return toResponse(course, enrolled);
    }

    public Page<CourseResponse> searchPublishedCourses(String keyword, int page, int size) {
        return courseRepository.searchPublished(keyword, PageRequest.of(page, size))
                .map(c -> toResponse(c, false));
    }

    @Transactional
    public CourseResponse updateCourse(String email, Long id, UpdateCourseRequest req) {
        Course course = getOwnedCourse(email, id);
        course.setTitle(req.title());
        course.setDescription(req.description());
        course.setSyllabus(req.syllabus());
        course.setFees(req.fees());
        course.setDurationHours(req.durationHours());
        if (req.status() != null) course.setStatus(req.status());
        courseSkillRepository.deleteByCourseId(id);
        attachSkills(course, req.skillIds());
        return toResponse(courseRepository.save(course), false);
    }

    @Transactional
    public CourseResponse uploadThumbnail(String email, Long id, MultipartFile file) {
        Course course = getOwnedCourse(email, id);
        String url = fileStorageService.uploadCourseThumbnail(file, id);
        course.setThumbnailUrl(url);
        return toResponse(courseRepository.save(course), false);
    }

    // ── Lessons ──────────────────────────────────────────────────────────

    @Transactional
    public CourseResponse addLesson(String email, Long courseId, AddLessonRequest req) {
        Course course = getOwnedCourse(email, courseId);
        CourseLesson lesson = CourseLesson.builder()
                .course(course)
                .title(req.title())
                .videoUrl(req.videoUrl())
                .durationMinutes(req.durationMinutes())
                .orderIndex(req.orderIndex())
                .isPreview(req.isPreview() != null ? req.isPreview() : false)
                .build();
        lessonRepository.save(lesson);
        return toResponse(courseRepository.findById(courseId).orElseThrow(), false);
    }

    @Transactional
    public CourseResponse updateLesson(String email, Long courseId, Long lessonId, UpdateLessonRequest req) {
        getOwnedCourse(email, courseId);
        CourseLesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> BusinessException.notFound("Lesson not found"));
        lesson.setTitle(req.title());
        lesson.setVideoUrl(req.videoUrl());
        lesson.setDurationMinutes(req.durationMinutes());
        lesson.setOrderIndex(req.orderIndex());
        if (req.isPreview() != null) lesson.setIsPreview(req.isPreview());
        lessonRepository.save(lesson);
        return toResponse(courseRepository.findById(courseId).orElseThrow(), false);
    }

    @Transactional
    public void deleteLesson(String email, Long courseId, Long lessonId) {
        getOwnedCourse(email, courseId);
        lessonRepository.deleteById(lessonId);
    }

    @Transactional
    public String uploadLessonVideo(String email, Long courseId, Long lessonId, MultipartFile file) {
        getOwnedCourse(email, courseId);
        CourseLesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> BusinessException.notFound("Lesson not found"));
        String url = fileStorageService.uploadLessonVideo(file, courseId, lessonId);
        lesson.setVideoUrl(url);
        lessonRepository.save(lesson);
        return url;
    }

    // ── Chunked video upload ──────────────────────────────────────────────

    @Transactional
    public String initChunkedUpload(String email, Long courseId, Long lessonId,
            String fileName, int totalChunks) {
        getOwnedCourse(email, courseId);
        lessonRepository.findById(lessonId)
                .orElseThrow(() -> BusinessException.notFound("Lesson not found"));
        return chunkedUploadService.initUpload(fileName, totalChunks);
    }

    public int uploadVideoChunk(String email, Long courseId, Long lessonId,
            String uploadId, int chunkIndex, MultipartFile chunk) {
        getOwnedCourse(email, courseId);
        return chunkedUploadService.uploadChunk(uploadId, chunkIndex, chunk);
    }

    @Transactional
    public String finalizeVideoUpload(String email, Long courseId, Long lessonId, String uploadId) {
        getOwnedCourse(email, courseId);
        CourseLesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> BusinessException.notFound("Lesson not found"));

        String ext = extractExtension(lesson.getTitle());
        String key = String.format("videos/%d/%d/%s.%s", courseId, lessonId,
                java.util.UUID.randomUUID(), ext);
        String url = chunkedUploadService.finalizeUpload(uploadId, key);
        lesson.setVideoUrl(url);
        lessonRepository.save(lesson);
        return url;
    }

    // ── Materials ────────────────────────────────────────────────────────

    @Transactional
    public CourseResponse addMaterial(String email, Long courseId, AddMaterialRequest req) {
        Course course = getOwnedCourse(email, courseId);
        CourseMaterial material = CourseMaterial.builder()
                .course(course)
                .title(req.title())
                .type(req.type())
                .fileUrl(req.fileUrl())
                .build();
        materialRepository.save(material);
        return toResponse(courseRepository.findById(courseId).orElseThrow(), false);
    }

    @Transactional
    public void deleteMaterial(String email, Long courseId, Long materialId) {
        getOwnedCourse(email, courseId);
        materialRepository.deleteById(materialId);
    }

    // ── Live sessions ─────────────────────────────────────────────────────

    @Transactional
    public LiveSessionResponse createSession(String email, Long courseId, CreateLiveSessionRequest req) {
        Course course = getOwnedCourse(email, courseId);
        LiveSession session = LiveSession.builder()
                .course(course)
                .title(req.title())
                .description(req.description())
                .scheduledAt(req.scheduledAt())
                .durationMinutes(req.durationMinutes())
                .platform(req.platform())
                .meetingUrl(req.meetingUrl())
                .build();
        return toSessionResponse(liveSessionRepository.save(session));
    }

    public List<LiveSessionResponse> getSessions(Long courseId) {
        return liveSessionRepository.findByCourseIdOrderByScheduledAtAsc(courseId)
                .stream().map(this::toSessionResponse).toList();
    }

    @Transactional
    public LiveSessionResponse updateSession(String email, Long courseId, Long sessionId,
            UpdateLiveSessionRequest req) {
        getOwnedCourse(email, courseId);
        LiveSession session = liveSessionRepository.findById(sessionId)
                .orElseThrow(() -> BusinessException.notFound("Session not found"));
        session.setTitle(req.title());
        session.setDescription(req.description());
        session.setScheduledAt(req.scheduledAt());
        session.setDurationMinutes(req.durationMinutes());
        if (req.platform() != null) session.setPlatform(req.platform());
        if (req.meetingUrl() != null) session.setMeetingUrl(req.meetingUrl());
        if (req.recordingUrl() != null) session.setRecordingUrl(req.recordingUrl());
        return toSessionResponse(liveSessionRepository.save(session));
    }

    @Transactional
    public void deleteSession(String email, Long courseId, Long sessionId) {
        getOwnedCourse(email, courseId);
        liveSessionRepository.deleteById(sessionId);
    }

    // ── Enrolments (trainer view) ─────────────────────────────────────────

    public Page<EnrolmentResponse> getCourseEnrolments(String email, Long courseId, int page, int size) {
        getOwnedCourse(email, courseId);
        return enrolmentRepository.findByCourseId(courseId, PageRequest.of(page, size))
                .map(this::toEnrolmentResponse);
    }

    // ── Enrolments (seeker) ───────────────────────────────────────────────

    @Transactional
    public EnrolmentResponse enrol(String email, Long courseId) {
        User seeker = getUser(email);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> BusinessException.notFound("Course not found"));
        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw BusinessException.badRequest("Course is not available for enrolment");
        }
        if (enrolmentRepository.existsByCourseIdAndSeekerId(courseId, seeker.getId())) {
            throw BusinessException.conflict("Already enrolled in this course");
        }
        Enrolment enrolment = Enrolment.builder().course(course).seeker(seeker).build();
        enrolment = enrolmentRepository.save(enrolment);
        course.setTotalEnrolled(course.getTotalEnrolled() + 1);
        courseRepository.save(course);
        return toEnrolmentResponse(enrolment);
    }

    public List<EnrolmentResponse> getMyEnrolments(String email) {
        User seeker = getUser(email);
        return enrolmentRepository.findBySeekerId(seeker.getId()).stream()
                .map(this::toEnrolmentResponse)
                .toList();
    }

    @Transactional
    public EnrolmentResponse markLessonComplete(String email, Long courseId, Long lessonId) {
        User seeker = getUser(email);
        Enrolment enrolment = enrolmentRepository.findByCourseIdAndSeekerId(courseId, seeker.getId())
                .orElseThrow(() -> BusinessException.badRequest("Not enrolled in this course"));

        if (!lessonProgressRepository.existsByEnrolmentIdAndLessonId(enrolment.getId(), lessonId)) {
            CourseLesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> BusinessException.notFound("Lesson not found"));
            lessonProgressRepository.save(LessonProgress.builder()
                    .enrolment(enrolment).lesson(lesson).build());
        }

        long totalLessons = lessonRepository.countByCourseId(courseId);
        long completedLessons = lessonProgressRepository.countByEnrolmentId(enrolment.getId());
        int pct = totalLessons > 0 ? (int) Math.round(completedLessons * 100.0 / totalLessons) : 0;
        enrolment.setProgressPct(pct);
        if (pct == 100 && enrolment.getCompletedAt() == null) {
            enrolment.setCompletedAt(LocalDateTime.now());
            enrolment = enrolmentRepository.save(enrolment);
            // auto-generate certificate
            try {
                certificateService.generateForEnrolment(enrolment);
            } catch (Exception ex) {
                log.warn("Certificate generation failed for enrolment {}: {}", enrolment.getId(), ex.getMessage());
            }
        } else {
            enrolment = enrolmentRepository.save(enrolment);
        }
        return toEnrolmentResponse(enrolment);
    }

    // ── Video watch progress ──────────────────────────────────────────────

    @Transactional
    public void updateVideoProgress(String email, Long courseId, Long lessonId, int watchedPct) {
        User seeker = getUser(email);
        Enrolment enrolment = enrolmentRepository.findByCourseIdAndSeekerId(courseId, seeker.getId())
                .orElseThrow(() -> BusinessException.badRequest("Not enrolled in this course"));
        CourseLesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> BusinessException.notFound("Lesson not found"));

        VideoProgress vp = videoProgressRepository
                .findByEnrolmentIdAndLessonId(enrolment.getId(), lessonId)
                .orElseGet(() -> VideoProgress.builder().enrolment(enrolment).lesson(lesson).build());

        if (watchedPct > vp.getWatchedPct()) {
            vp.setWatchedPct(watchedPct);
        }
        vp.setLastWatchedAt(LocalDateTime.now());
        videoProgressRepository.save(vp);
    }

    public List<Long> getWatchedLessonIds(String email, Long courseId) {
        User seeker = getUser(email);
        Enrolment enrolment = enrolmentRepository.findByCourseIdAndSeekerId(courseId, seeker.getId())
                .orElseThrow(() -> BusinessException.badRequest("Not enrolled in this course"));
        return videoProgressRepository.findByEnrolmentId(enrolment.getId()).stream()
                .filter(vp -> vp.getWatchedPct() >= 80)
                .map(vp -> vp.getLesson().getId())
                .toList();
    }

    // ── Certificate ───────────────────────────────────────────────────────

    @Transactional
    public CertificateResponse getCertificate(String email, Long courseId) {
        User seeker = getUser(email);
        Enrolment enrolment = enrolmentRepository.findByCourseIdAndSeekerId(courseId, seeker.getId())
                .orElseThrow(() -> BusinessException.badRequest("Not enrolled in this course"));
        return certificateService.getOrGenerate(enrolment.getId());
    }

    // ── Dashboard ─────────────────────────────────────────────────────────

    public TrainerDashboardResponse getDashboard(String email) {
        User trainer = getUser(email);
        long total = courseRepository.countByTrainerId(trainer.getId());
        long published = courseRepository.countByTrainerIdAndStatus(trainer.getId(), CourseStatus.PUBLISHED);
        long draft = courseRepository.countByTrainerIdAndStatus(trainer.getId(), CourseStatus.DRAFT);
        long totalEnrolments = enrolmentRepository.countTotalEnrolmentsByTrainer(trainer.getId());
        long completed = enrolmentRepository.countCompletedByTrainer(trainer.getId());
        return new TrainerDashboardResponse(total, published, draft, totalEnrolments, completed);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
    }

    private Course getOwnedCourse(String email, Long courseId) {
        User trainer = getUser(email);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> BusinessException.notFound("Course not found"));
        if (!course.getTrainer().getId().equals(trainer.getId())) {
            throw BusinessException.forbidden("You do not own this course");
        }
        return course;
    }

    private void attachSkills(Course course, List<Long> skillIds) {
        if (skillIds == null || skillIds.isEmpty()) return;
        skillIds.forEach(skillId -> {
            Skill skill = skillRepository.findById(skillId)
                    .orElseThrow(() -> BusinessException.notFound("Skill not found: " + skillId));
            courseSkillRepository.save(CourseSkill.builder().course(course).skill(skill).build());
        });
    }

    private String extractExtension(String name) {
        if (name == null || !name.contains(".")) return "mp4";
        return name.substring(name.lastIndexOf('.') + 1).toLowerCase();
    }

    private CourseResponse toResponse(Course c, boolean enrolled) {
        List<CourseResponse.LessonDto> lessons = c.getLessons().stream()
                .map(l -> new CourseResponse.LessonDto(
                        l.getId(), l.getTitle(), l.getVideoUrl(),
                        l.getDurationMinutes(), l.getOrderIndex(), l.getIsPreview()))
                .toList();
        List<CourseResponse.MaterialDto> materials = c.getMaterials().stream()
                .map(m -> new CourseResponse.MaterialDto(
                        m.getId(), m.getTitle(), m.getFileUrl(), m.getType().name()))
                .toList();
        List<String> skills = c.getCourseSkills().stream()
                .map(cs -> cs.getSkill().getName())
                .toList();
        return new CourseResponse(
                c.getId(),
                new CourseResponse.TrainerSummary(c.getTrainer().getId(),
                        c.getTrainer().getFullName(), c.getTrainer().getEmail()),
                c.getTitle(), c.getDescription(), c.getSyllabus(),
                c.getFees(), c.getDurationHours(), c.getStatus(),
                c.getTotalEnrolled(), c.getThumbnailUrl(),
                lessons, materials, skills,
                c.getCreatedAt(), c.getUpdatedAt(), enrolled);
    }

    private EnrolmentResponse toEnrolmentResponse(Enrolment e) {
        List<Long> completedLessonIds = lessonProgressRepository.findByEnrolmentId(e.getId()).stream()
                .map(lp -> lp.getLesson().getId())
                .toList();
        int totalLessons = e.getCourse().getLessons().size();
        return new EnrolmentResponse(
                e.getId(),
                new EnrolmentResponse.CourseSummary(
                        e.getCourse().getId(), e.getCourse().getTitle(),
                        e.getCourse().getThumbnailUrl(), totalLessons),
                new EnrolmentResponse.SeekerSummary(
                        e.getSeeker().getId(), e.getSeeker().getFullName(), e.getSeeker().getEmail()),
                e.getProgressPct(), e.getEnrolledAt(), e.getCompletedAt(), completedLessonIds);
    }

    private LiveSessionResponse toSessionResponse(LiveSession s) {
        return new LiveSessionResponse(
                s.getId(),
                s.getCourse().getId(),
                s.getCourse().getTitle(),
                s.getTitle(),
                s.getDescription(),
                s.getScheduledAt(),
                s.getDurationMinutes(),
                s.getPlatform(),
                s.getMeetingUrl(),
                s.getRecordingUrl(),
                s.getCreatedAt());
    }
}

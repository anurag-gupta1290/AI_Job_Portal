package com.jobportal.controller;

import com.jobportal.dto.request.TrainerDTOs.*;
import com.jobportal.dto.response.ApiResponse;
import com.jobportal.dto.response.AssessmentResponse;
import com.jobportal.dto.response.AttemptResultResponse;
import com.jobportal.dto.response.CourseResponse;
import com.jobportal.dto.response.EnrolmentResponse;
import com.jobportal.dto.response.LiveSessionResponse;
import com.jobportal.dto.response.TrainerDashboardResponse;
import com.jobportal.service.AssessmentService;
import com.jobportal.service.TrainerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/trainer")
@RequiredArgsConstructor
@Tag(name = "Trainer", description = "Training provider course management and enrolment endpoints")
public class TrainerController {

    private final TrainerService trainerService;
    private final AssessmentService assessmentService;

    // ── Dashboard ─────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    @Operation(summary = "Trainer dashboard stats")
    public ResponseEntity<ApiResponse<TrainerDashboardResponse>> getDashboard(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.ok(trainerService.getDashboard(email)));
    }

    // ── Courses ───────────────────────────────────────────────────────────

    @PostMapping("/courses")
    @Operation(summary = "Create a new course")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody CreateCourseRequest req) {
        CourseResponse course = trainerService.createCourse(email, req);
        return ResponseEntity.created(URI.create("/api/trainer/courses/" + course.id()))
                .body(ApiResponse.ok("Course created", course));
    }

    @GetMapping("/courses")
    @Operation(summary = "List my courses (paginated)")
    public ResponseEntity<ApiResponse<Page<CourseResponse>>> getMyCourses(
            @AuthenticationPrincipal String email,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(trainerService.getMyCourses(email, page, size)));
    }

    @GetMapping("/courses/{id}")
    @Operation(summary = "Get course detail (trainer view)")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourse(
            @AuthenticationPrincipal String email,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(trainerService.getCourse(id, email)));
    }

    @PutMapping("/courses/{id}")
    @Operation(summary = "Update a course")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @AuthenticationPrincipal String email,
            @PathVariable Long id,
            @Valid @RequestBody UpdateCourseRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(trainerService.updateCourse(email, id, req)));
    }

    @PostMapping(value = "/courses/{id}/thumbnail", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload course thumbnail image")
    public ResponseEntity<ApiResponse<CourseResponse>> uploadThumbnail(
            @AuthenticationPrincipal String email,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.ok(trainerService.uploadThumbnail(email, id, file)));
    }

    // ── Lessons ───────────────────────────────────────────────────────────

    @PostMapping("/courses/{courseId}/lessons")
    @Operation(summary = "Add a lesson to a course")
    public ResponseEntity<ApiResponse<CourseResponse>> addLesson(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @Valid @RequestBody AddLessonRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(trainerService.addLesson(email, courseId, req)));
    }

    @PutMapping("/courses/{courseId}/lessons/{lessonId}")
    @Operation(summary = "Update a lesson")
    public ResponseEntity<ApiResponse<CourseResponse>> updateLesson(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @Valid @RequestBody UpdateLessonRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(trainerService.updateLesson(email, courseId, lessonId, req)));
    }

    @DeleteMapping("/courses/{courseId}/lessons/{lessonId}")
    @Operation(summary = "Delete a lesson")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @PathVariable Long lessonId) {
        trainerService.deleteLesson(email, courseId, lessonId);
        return ResponseEntity.ok(ApiResponse.ok("Lesson deleted", null));
    }

    // single-part video (≤500 MB)
    @PostMapping(value = "/courses/{courseId}/lessons/{lessonId}/video",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload lesson video (single part, ≤500 MB)")
    public ResponseEntity<ApiResponse<String>> uploadLessonVideo(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @RequestParam("file") MultipartFile file) {
        String url = trainerService.uploadLessonVideo(email, courseId, lessonId, file);
        return ResponseEntity.ok(ApiResponse.ok("Video uploaded", url));
    }

    // ── Chunked video upload ──────────────────────────────────────────────

    @PostMapping("/courses/{courseId}/lessons/{lessonId}/video/init")
    @Operation(summary = "Initiate a chunked video upload; returns uploadId")
    public ResponseEntity<ApiResponse<Map<String, String>>> initChunkedUpload(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @Valid @RequestBody InitChunkedUploadRequest req) {
        String uploadId = trainerService.initChunkedUpload(email, courseId, lessonId,
                req.fileName(), req.totalChunks());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("uploadId", uploadId)));
    }

    @PostMapping(value = "/courses/{courseId}/lessons/{lessonId}/video/chunk",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a single chunk; returns receivedCount")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> uploadChunk(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @RequestParam("uploadId") String uploadId,
            @RequestParam("chunkIndex") int chunkIndex,
            @RequestParam("chunk") MultipartFile chunk) {
        int received = trainerService.uploadVideoChunk(email, courseId, lessonId,
                uploadId, chunkIndex, chunk);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("receivedChunks", received)));
    }

    @PostMapping("/courses/{courseId}/lessons/{lessonId}/video/finalize")
    @Operation(summary = "Merge all chunks and save video; returns video URL")
    public ResponseEntity<ApiResponse<String>> finalizeChunkedUpload(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @RequestBody Map<String, String> body) {
        String uploadId = body.get("uploadId");
        if (uploadId == null || uploadId.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("uploadId is required"));
        }
        String url = trainerService.finalizeVideoUpload(email, courseId, lessonId, uploadId);
        return ResponseEntity.ok(ApiResponse.ok("Video upload complete", url));
    }

    // ── Materials ────────────────────────────────────────────────────────

    @PostMapping("/courses/{courseId}/materials")
    @Operation(summary = "Add a material to a course")
    public ResponseEntity<ApiResponse<CourseResponse>> addMaterial(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @Valid @RequestBody AddMaterialRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(trainerService.addMaterial(email, courseId, req)));
    }

    @DeleteMapping("/courses/{courseId}/materials/{materialId}")
    @Operation(summary = "Delete a material")
    public ResponseEntity<ApiResponse<Void>> deleteMaterial(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @PathVariable Long materialId) {
        trainerService.deleteMaterial(email, courseId, materialId);
        return ResponseEntity.ok(ApiResponse.ok("Material deleted", null));
    }

    // ── Live sessions ────────────────────────────────────────────────────

    @PostMapping("/courses/{courseId}/sessions")
    @Operation(summary = "Create a live session for a course")
    public ResponseEntity<ApiResponse<LiveSessionResponse>> createSession(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @Valid @RequestBody CreateLiveSessionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Session created",
                trainerService.createSession(email, courseId, req)));
    }

    @PutMapping("/courses/{courseId}/sessions/{sessionId}")
    @Operation(summary = "Update a live session")
    public ResponseEntity<ApiResponse<LiveSessionResponse>> updateSession(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @PathVariable Long sessionId,
            @Valid @RequestBody UpdateLiveSessionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                trainerService.updateSession(email, courseId, sessionId, req)));
    }

    @DeleteMapping("/courses/{courseId}/sessions/{sessionId}")
    @Operation(summary = "Delete a live session")
    public ResponseEntity<ApiResponse<Void>> deleteSession(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @PathVariable Long sessionId) {
        trainerService.deleteSession(email, courseId, sessionId);
        return ResponseEntity.ok(ApiResponse.ok("Session deleted", null));
    }

    // ── Assessment ───────────────────────────────────────────────────────

    @PostMapping("/courses/{courseId}/assessment")
    @Operation(summary = "Create assessment for a course")
    public ResponseEntity<ApiResponse<AssessmentResponse>> createAssessment(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @Valid @RequestBody CreateAssessmentRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Assessment created",
                assessmentService.createAssessment(email, courseId, req)));
    }

    @GetMapping("/courses/{courseId}/assessment")
    @Operation(summary = "Get assessment (trainer view, answers visible)")
    public ResponseEntity<ApiResponse<AssessmentResponse>> getAssessmentTrainer(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.ok(
                assessmentService.getAssessmentForTrainer(email, courseId)));
    }

    @PutMapping("/courses/{courseId}/assessment")
    @Operation(summary = "Update assessment settings")
    public ResponseEntity<ApiResponse<AssessmentResponse>> updateAssessment(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @Valid @RequestBody CreateAssessmentRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                assessmentService.updateAssessment(email, courseId, req)));
    }

    @DeleteMapping("/courses/{courseId}/assessment")
    @Operation(summary = "Delete assessment")
    public ResponseEntity<ApiResponse<Void>> deleteAssessment(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId) {
        assessmentService.deleteAssessment(email, courseId);
        return ResponseEntity.ok(ApiResponse.ok("Assessment deleted", null));
    }

    @PostMapping("/courses/{courseId}/assessment/questions")
    @Operation(summary = "Add a question to the assessment")
    public ResponseEntity<ApiResponse<AssessmentResponse>> addQuestion(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @Valid @RequestBody AddQuestionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                assessmentService.addQuestion(email, courseId, req)));
    }

    @PutMapping("/courses/{courseId}/assessment/questions/{questionId}")
    @Operation(summary = "Update a question")
    public ResponseEntity<ApiResponse<AssessmentResponse>> updateQuestion(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @PathVariable Long questionId,
            @Valid @RequestBody AddQuestionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                assessmentService.updateQuestion(email, courseId, questionId, req)));
    }

    @DeleteMapping("/courses/{courseId}/assessment/questions/{questionId}")
    @Operation(summary = "Delete a question")
    public ResponseEntity<ApiResponse<AssessmentResponse>> deleteQuestion(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @PathVariable Long questionId) {
        return ResponseEntity.ok(ApiResponse.ok(
                assessmentService.deleteQuestion(email, courseId, questionId)));
    }

    @GetMapping("/courses/{courseId}/assessment/attempts")
    @Operation(summary = "List all seeker attempts for course assessment")
    public ResponseEntity<ApiResponse<List<AttemptResultResponse>>> getAttempts(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.ok(
                assessmentService.getAttemptsForCourse(email, courseId)));
    }

    // ── Enrolments ───────────────────────────────────────────────────────

    @GetMapping("/courses/{courseId}/enrolments")
    @Operation(summary = "List enrolments for a course")
    public ResponseEntity<ApiResponse<Page<EnrolmentResponse>>> getCourseEnrolments(
            @AuthenticationPrincipal String email,
            @PathVariable Long courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                trainerService.getCourseEnrolments(email, courseId, page, size)));
    }
}

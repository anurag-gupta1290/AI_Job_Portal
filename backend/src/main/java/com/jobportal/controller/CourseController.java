package com.jobportal.controller;

import com.jobportal.dto.request.TrainerDTOs.SubmitAttemptRequest;
import com.jobportal.dto.request.TrainerDTOs.UpdateVideoProgressRequest;
import com.jobportal.dto.response.ApiResponse;
import com.jobportal.dto.response.AssessmentResponse;
import com.jobportal.dto.response.AttemptResultResponse;
import com.jobportal.dto.response.CertificateResponse;
import com.jobportal.dto.response.CourseResponse;
import com.jobportal.dto.response.EnrolmentResponse;
import com.jobportal.dto.response.LiveSessionResponse;
import com.jobportal.service.AssessmentService;
import com.jobportal.service.TrainerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
@Tag(name = "Courses", description = "Public course browsing and seeker enrolment endpoints")
public class CourseController {

    private final TrainerService trainerService;
    private final AssessmentService assessmentService;

    @GetMapping
    @Operation(summary = "Browse published courses (public)")
    public ResponseEntity<ApiResponse<Page<CourseResponse>>> searchCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(trainerService.searchPublishedCourses(keyword, page, size)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get course detail (public; enrolled flag set if authenticated)")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.ok(trainerService.getCourse(id, email)));
    }

    @PostMapping("/{id}/enrol")
    @Operation(summary = "Enrol in a course (seeker)")
    public ResponseEntity<ApiResponse<EnrolmentResponse>> enrol(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.ok("Enrolled successfully", trainerService.enrol(email, id)));
    }

    @GetMapping("/my")
    @Operation(summary = "Get my course enrolments (seeker)")
    public ResponseEntity<ApiResponse<List<EnrolmentResponse>>> getMyEnrolments(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.ok(trainerService.getMyEnrolments(email)));
    }

    @PostMapping("/{courseId}/lessons/{lessonId}/complete")
    @Operation(summary = "Mark a lesson as complete (seeker)")
    public ResponseEntity<ApiResponse<EnrolmentResponse>> markComplete(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.ok(trainerService.markLessonComplete(email, courseId, lessonId)));
    }

    @PostMapping("/{courseId}/lessons/{lessonId}/watch-progress")
    @Operation(summary = "Update video watch progress for a lesson (seeker)")
    public ResponseEntity<ApiResponse<Void>> updateWatchProgress(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @AuthenticationPrincipal String email,
            @Valid @RequestBody UpdateVideoProgressRequest req) {
        trainerService.updateVideoProgress(email, courseId, lessonId, req.watchedPct());
        return ResponseEntity.ok(ApiResponse.ok("Progress saved", null));
    }

    @GetMapping("/{courseId}/certificate")
    @Operation(summary = "Get or generate completion certificate (seeker)")
    public ResponseEntity<ApiResponse<CertificateResponse>> getCertificate(
            @PathVariable Long courseId,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.ok(trainerService.getCertificate(email, courseId)));
    }

    @GetMapping("/{courseId}/sessions")
    @Operation(summary = "List live sessions for a course (public)")
    public ResponseEntity<ApiResponse<List<LiveSessionResponse>>> getSessions(
            @PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.ok(trainerService.getSessions(courseId)));
    }

    // ── Assessment (seeker) ───────────────────────────────────────────────

    @GetMapping("/{courseId}/assessment")
    @Operation(summary = "Get published assessment for a course (enrolled seeker)")
    public ResponseEntity<ApiResponse<AssessmentResponse>> getAssessment(
            @PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.ok(
                assessmentService.getAssessmentForSeeker(courseId)));
    }

    @PostMapping("/{courseId}/assessment/attempt")
    @Operation(summary = "Submit an assessment attempt (seeker)")
    public ResponseEntity<ApiResponse<AttemptResultResponse>> submitAttempt(
            @PathVariable Long courseId,
            @AuthenticationPrincipal String email,
            @Valid @RequestBody SubmitAttemptRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Attempt submitted",
                assessmentService.submitAttempt(email, courseId, req)));
    }

    @GetMapping("/{courseId}/assessment/attempts/my")
    @Operation(summary = "Get my assessment attempts for a course (seeker)")
    public ResponseEntity<ApiResponse<List<AttemptResultResponse>>> getMyAttempts(
            @PathVariable Long courseId,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.ok(
                assessmentService.getMyAttempts(email, courseId)));
    }
}

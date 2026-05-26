package com.jobportal.controller;

import com.jobportal.dto.request.ApplicationDTOs.ApplyRequest;
import com.jobportal.dto.request.SeekerDTOs.*;
import com.jobportal.dto.response.ApiResponse;
import com.jobportal.dto.response.ApplicationResponse;
import com.jobportal.dto.response.SeekerProfileResponse;
import com.jobportal.service.ApplicationService;
import com.jobportal.service.SeekerProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/seeker")
@RequiredArgsConstructor
@Tag(name = "Job Seeker", description = "Job seeker profile, applications and enrolments")
@SecurityRequirement(name = "BearerAuth")
public class SeekerController {

    private final SeekerProfileService profileService;
    private final ApplicationService applicationService;

    @GetMapping("/profile")
    @Operation(summary = "Get or auto-create seeker profile")
    public ResponseEntity<ApiResponse<SeekerProfileResponse>> getProfile(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(profileService.getOrCreateProfile(auth.getName())));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update profile fields")
    public ResponseEntity<ApiResponse<SeekerProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest req, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", profileService.updateProfile(auth.getName(), req)));
    }

    @PostMapping(value = "/profile/resume", consumes = "multipart/form-data")
    @Operation(summary = "Upload resume (PDF or DOCX, max 5 MB)")
    public ResponseEntity<ApiResponse<String>> uploadResume(
            @RequestParam("file") MultipartFile file, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Resume uploaded", profileService.uploadResume(auth.getName(), file)));
    }

    @PostMapping("/profile/experience")
    @Operation(summary = "Add work experience entry")
    public ResponseEntity<ApiResponse<SeekerProfileResponse>> addExperience(
            @Valid @RequestBody AddExperienceRequest req, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Experience added", profileService.addExperience(auth.getName(), req)));
    }

    @DeleteMapping("/profile/experience/{id}")
    @Operation(summary = "Delete work experience entry")
    public ResponseEntity<ApiResponse<Void>> deleteExperience(
            @PathVariable Long id, Authentication auth) {
        profileService.deleteExperience(auth.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok("Experience deleted", null));
    }

    @PostMapping("/profile/education")
    @Operation(summary = "Add education entry")
    public ResponseEntity<ApiResponse<SeekerProfileResponse>> addEducation(
            @Valid @RequestBody AddEducationRequest req, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Education added", profileService.addEducation(auth.getName(), req)));
    }

    @DeleteMapping("/profile/education/{id}")
    @Operation(summary = "Delete education entry")
    public ResponseEntity<ApiResponse<Void>> deleteEducation(
            @PathVariable Long id, Authentication auth) {
        profileService.deleteEducation(auth.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok("Education deleted", null));
    }

    @PostMapping("/profile/skills")
    @Operation(summary = "Add or update a skill on the profile")
    public ResponseEntity<ApiResponse<SeekerProfileResponse>> addSkill(
            @Valid @RequestBody AddSkillRequest req, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Skill saved", profileService.addOrUpdateSkill(auth.getName(), req)));
    }

    @DeleteMapping("/profile/skills/{skillId}")
    @Operation(summary = "Remove a skill from the profile")
    public ResponseEntity<ApiResponse<Void>> removeSkill(
            @PathVariable Long skillId, Authentication auth) {
        profileService.removeSkill(auth.getName(), skillId);
        return ResponseEntity.ok(ApiResponse.ok("Skill removed", null));
    }

    @PostMapping("/jobs/{jobId}/apply")
    @Operation(summary = "Apply for a job (one-click)")
    public ResponseEntity<ApiResponse<ApplicationResponse>> apply(
            @PathVariable Long jobId,
            @RequestBody(required = false) ApplyRequest req,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Applied successfully",
                applicationService.apply(auth.getName(), jobId, req)));
    }

    @GetMapping("/applications")
    @Operation(summary = "Get my job applications (paginated)")
    public ResponseEntity<ApiResponse<Page<ApplicationResponse>>> getApplications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(applicationService.getMyApplications(auth.getName(), page, size)));
    }

    @GetMapping("/dashboard/stats")
    @Operation(summary = "Get seeker dashboard summary stats")
    public ResponseEntity<ApiResponse<SeekerStats>> getDashboardStats(Authentication auth) {
        long applications = applicationService.countApplications(auth.getName());
        return ResponseEntity.ok(ApiResponse.ok(new SeekerStats(applications, 0, 0)));
    }

    public record SeekerStats(long applications, long savedJobs, long enrolledCourses) {}
}

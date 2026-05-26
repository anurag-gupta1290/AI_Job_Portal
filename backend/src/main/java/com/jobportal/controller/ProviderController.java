package com.jobportal.controller;

import com.jobportal.dto.request.ProviderDTOs.*;
import com.jobportal.dto.response.*;
import com.jobportal.service.ProviderService;
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

@RestController
@RequestMapping("/provider")
@RequiredArgsConstructor
@Tag(name = "Provider", description = "Job provider company, job posting, and ATS endpoints")
public class ProviderController {

    private final ProviderService providerService;

    // ── Company Profile ───────────────────────────────────────────────

    @GetMapping("/company")
    @Operation(summary = "Get my company profile")
    public ResponseEntity<ApiResponse<CompanyResponse>> getCompany(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.ok(providerService.getMyCompany(email)));
    }

   /* @GetMapping("/company")
    @Operation(summary = "Get my company profile")
    public ResponseEntity<ApiResponse<CompanyResponse>> getCompany(
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(providerService.getMyCompany(auth.getName())));
    }*/

    @PostMapping("/company")
    @Operation(summary = "Create company profile")
    public ResponseEntity<ApiResponse<CompanyResponse>> createCompany(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody CreateCompanyRequest req) {
        CompanyResponse company = providerService.createCompany(email, req);
        return ResponseEntity.created(URI.create("/api/provider/company"))
                .body(ApiResponse.ok("Company profile created", company));
    }

    @PutMapping("/company")
    @Operation(summary = "Update company profile")
    public ResponseEntity<ApiResponse<CompanyResponse>> updateCompany(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody UpdateCompanyRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(providerService.updateCompany(email, req)));
    }

    @PostMapping(value = "/company/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload company logo")
    public ResponseEntity<ApiResponse<String>> uploadLogo(
            @AuthenticationPrincipal String email,
            @RequestParam("file") MultipartFile file) {
        String url = providerService.uploadLogo(email, file);
        return ResponseEntity.ok(ApiResponse.ok("Logo uploaded", url));
    }

    @GetMapping("/company/{id}")
    @Operation(summary = "Get a company's public profile by ID")
    public ResponseEntity<ApiResponse<CompanyResponse>> getCompanyById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(providerService.getCompanyById(id)));
    }

    // ── Job Postings ──────────────────────────────────────────────────

    @PostMapping("/jobs")
    @Operation(summary = "Create a new job posting")
    public ResponseEntity<ApiResponse<JobPostResponse>> createJob(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody CreateJobPostRequest req) {
        JobPostResponse job = providerService.createJob(email, req);
        return ResponseEntity.created(URI.create("/api/provider/jobs/" + job.getId()))
                .body(ApiResponse.ok("Job posted successfully", job));
    }

    @GetMapping("/jobs")
    @Operation(summary = "List my job postings (paginated)")
    public ResponseEntity<ApiResponse<Page<JobPostResponse>>> getMyJobs(
            @AuthenticationPrincipal String email,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(providerService.getMyJobs(email, page, size)));
    }

    @PutMapping("/jobs/{id}")
    @Operation(summary = "Update a job posting")
    public ResponseEntity<ApiResponse<JobPostResponse>> updateJob(
            @AuthenticationPrincipal String email,
            @PathVariable Long id,
            @Valid @RequestBody UpdateJobPostRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(providerService.updateJob(email, id, req)));
    }

    @PatchMapping("/jobs/{id}/close")
    @Operation(summary = "Close a job posting")
    public ResponseEntity<ApiResponse<JobPostResponse>> closeJob(
            @AuthenticationPrincipal String email,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(providerService.closeJob(email, id)));
    }

    // ── Applicant Tracking System ──────────────────────────────────────

    @GetMapping("/jobs/{id}/applications")
    @Operation(summary = "Get all applicants for a job (ATS view)")
    public ResponseEntity<ApiResponse<Page<ApplicationDetailResponse>>> getApplicants(
            @AuthenticationPrincipal String email,
            @PathVariable Long id,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                providerService.getApplicants(email, id, status, page, size)));
    }

    @PatchMapping("/applications/{id}/status")
    @Operation(summary = "Update application status and add notes (ATS pipeline)")
    public ResponseEntity<ApiResponse<ApplicationDetailResponse>> updateApplicationStatus(
            @AuthenticationPrincipal String email,
            @PathVariable Long id,
            @Valid @RequestBody UpdateApplicationStatusRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                providerService.updateApplicationStatus(email, id, req)));
    }

    // ── Candidate Database Search ─────────────────────────────────────

    @GetMapping("/candidates")
    @Operation(summary = "Search candidate database by skill, location, and experience")
    public ResponseEntity<ApiResponse<Page<SeekerProfileResponse>>> searchCandidates(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String skillName,
            @RequestParam(required = false) Integer minExp,
            @RequestParam(required = false) Integer maxExp,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                providerService.searchCandidates(keyword, location, skillName, minExp, maxExp, page, size)));
    }

    @GetMapping("/candidates/{profileId}")
    @Operation(summary = "View a candidate's full profile")
    public ResponseEntity<ApiResponse<SeekerProfileResponse>> getCandidateProfile(
            @PathVariable Long profileId) {
        return ResponseEntity.ok(ApiResponse.ok(providerService.getCandidateProfile(profileId)));
    }

    // ── Dashboard ─────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    @Operation(summary = "Provider dashboard stats")
    public ResponseEntity<ApiResponse<ProviderDashboardResponse>> getDashboard(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.ok(providerService.getDashboard(email)));
    }
}

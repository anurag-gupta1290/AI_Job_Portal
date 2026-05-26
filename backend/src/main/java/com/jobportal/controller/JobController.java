package com.jobportal.controller;

import com.jobportal.dto.response.ApiResponse;
import com.jobportal.dto.response.JobPostResponse;
import com.jobportal.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs", description = "Public job search and discovery endpoints")
public class JobController {

    private final JobService jobService;

    @GetMapping("/search")
    @Operation(summary = "Search active jobs with filters")
    public ResponseEntity<ApiResponse<Page<JobPostResponse>>> searchJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String jobType,
            @RequestParam(required = false) String experienceLevel,
            @RequestParam(required = false) Integer salaryMin,
            @RequestParam(required = false) Integer salaryMax,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "relevance") String sortBy) {

        Page<JobPostResponse> results = jobService.searchJobs(
                keyword, location, jobType, experienceLevel,
                salaryMin, salaryMax, page, size, sortBy);

        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get job details (increments view count)")
    public ResponseEntity<ApiResponse<JobPostResponse>> getJob(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(jobService.getJob(id)));
    }
}

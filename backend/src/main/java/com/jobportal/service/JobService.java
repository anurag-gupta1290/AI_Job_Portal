package com.jobportal.service;

import com.jobportal.dto.response.JobPostResponse;
import com.jobportal.entity.JobPost;
import com.jobportal.entity.enums.ExperienceLevel;
import com.jobportal.entity.enums.JobStatus;
import com.jobportal.entity.enums.JobType;
import com.jobportal.exception.BusinessException;
import com.jobportal.repository.JobPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobPostRepository jobPostRepository;

    @Transactional(readOnly = true)
    public Page<JobPostResponse> searchJobs(
            String keyword, String location, String jobType, String experienceLevel,
            Integer salaryMin, Integer salaryMax, int page, int size, String sortBy) {

        JobType jt = (jobType != null && !jobType.isBlank()) ? JobType.valueOf(jobType) : null;
        ExperienceLevel el = (experienceLevel != null && !experienceLevel.isBlank())
                ? ExperienceLevel.valueOf(experienceLevel) : null;

        Sort sort = "date".equalsIgnoreCase(sortBy)
                ? Sort.by(Sort.Direction.DESC, "createdAt")
                : Sort.by(Sort.Direction.DESC, "viewCount");

        return jobPostRepository.searchJobs(
                blankToNull(keyword), blankToNull(location), jt, el,
                salaryMin, salaryMax, JobStatus.ACTIVE,
                PageRequest.of(page, size, sort)
        ).map(this::toResponse);
    }

    @Transactional
    public JobPostResponse getJob(Long id) {
        JobPost job = jobPostRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("Job not found"));
        job.setViewCount(job.getViewCount() + 1);
        return toResponse(jobPostRepository.save(job));
    }

    public JobPostResponse toResponse(JobPost j) {
        return JobPostResponse.builder()
                .id(j.getId())
                .title(j.getTitle())
                .description(j.getDescription())
                .requirements(j.getRequirements())
                .responsibilities(j.getResponsibilities())
                .location(j.getLocation())
                .jobType(j.getJobType())
                .experienceLevel(j.getExperienceLevel())
                .status(j.getStatus())
                .salaryMin(j.getSalaryMin())
                .salaryMax(j.getSalaryMax())
                .deadline(j.getDeadline())
                .viewCount(j.getViewCount())
                .applicationCount(j.getApplications().size())
                .company(j.getCompany() != null ? JobPostResponse.CompanyDto.builder()
                        .id(j.getCompany().getId())
                        .name(j.getCompany().getName())
                        .industry(j.getCompany().getIndustry())
                        .size(j.getCompany().getSize())
                        .location(j.getCompany().getLocation())
                        .logoUrl(j.getCompany().getLogoUrl())
                        .isVerified(j.getCompany().getIsVerified())
                        .build() : null)
                .skills(j.getJobSkills().stream()
                        .map(s -> JobPostResponse.JobSkillDto.builder()
                                .skillId(s.getSkill().getId())
                                .skillName(s.getSkill().getName())
                                .requiredLevel(s.getRequiredLevel())
                                .isMandatory(s.getIsMandatory())
                                .build())
                        .toList())
                .createdAt(j.getCreatedAt())
                .updatedAt(j.getUpdatedAt())
                .build();
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}

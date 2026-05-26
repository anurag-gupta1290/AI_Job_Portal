package com.jobportal.service;

import com.jobportal.dto.request.ApplicationDTOs.ApplyRequest;
import com.jobportal.dto.response.ApplicationResponse;
import com.jobportal.entity.*;
import com.jobportal.entity.enums.ApplicationStatus;
import com.jobportal.entity.enums.JobStatus;
import com.jobportal.exception.BusinessException;
import com.jobportal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobPostRepository jobPostRepository;
    private final SeekerProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public ApplicationResponse apply(String email, Long jobId, ApplyRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> BusinessException.notFound("User not found"));

        SeekerProfile profile = profileRepository.findByUser(user)
                .orElseThrow(() -> BusinessException.badRequest(
                        "Complete your profile before applying (GET /seeker/profile)"));

        JobPost job = jobPostRepository.findById(jobId)
                .orElseThrow(() -> BusinessException.notFound("Job not found"));

        if (job.getStatus() != JobStatus.ACTIVE) {
            throw BusinessException.badRequest("This job is no longer accepting applications");
        }

        if (applicationRepository.existsByJobIdAndProfileId(jobId, profile.getId())) {
            throw BusinessException.conflict("You have already applied for this job");
        }

        Application application = Application.builder()
                .job(job)
                .profile(profile)
                .status(ApplicationStatus.APPLIED)
                .coverLetter(req != null ? req.getCoverLetter() : null)
                .resumeSnapshot(profile.getResumeUrl())
                .build();

        applicationRepository.save(application);

        emailService.sendApplicationStatusEmail(
                user.getEmail(), user.getFullName(), job.getTitle(), "APPLIED");

        return toResponse(application);
    }

    @Transactional(readOnly = true)
    public Page<ApplicationResponse> getMyApplications(String email, int page, int size) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
        SeekerProfile profile = profileRepository.findByUser(user)
                .orElseThrow(() -> BusinessException.notFound("Profile not found"));

        return applicationRepository
                .findByProfileIdOrderByAppliedAtDesc(profile.getId(), PageRequest.of(page, size))
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public long countApplications(String email) {
        return userRepository.findByEmail(email)
                .flatMap(profileRepository::findByUser)
                .map(p -> applicationRepository.countByProfileId(p.getId()))
                .orElse(0L);
    }

    private ApplicationResponse toResponse(Application a) {
        JobPost job = a.getJob();
        return ApplicationResponse.builder()
                .id(a.getId())
                .status(a.getStatus())
                .matchScore(a.getMatchScore())
                .coverLetter(a.getCoverLetter())
                .resumeSnapshot(a.getResumeSnapshot())
                .appliedAt(a.getAppliedAt())
                .updatedAt(a.getUpdatedAt())
                .job(ApplicationResponse.JobSummaryDto.builder()
                        .id(job.getId())
                        .title(job.getTitle())
                        .location(job.getLocation())
                        .companyName(job.getCompany() != null ? job.getCompany().getName() : null)
                        .companyLogo(job.getCompany() != null ? job.getCompany().getLogoUrl() : null)
                        .salaryMin(job.getSalaryMin())
                        .salaryMax(job.getSalaryMax())
                        .build())
                .build();
    }
}

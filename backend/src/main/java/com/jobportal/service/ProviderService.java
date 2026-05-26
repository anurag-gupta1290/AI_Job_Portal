package com.jobportal.service;

import com.jobportal.dto.request.ProviderDTOs.*;
import com.jobportal.dto.response.*;
import com.jobportal.entity.*;
import com.jobportal.entity.enums.ApplicationStatus;
import com.jobportal.entity.enums.JobStatus;
import com.jobportal.entity.enums.ProfileVisibility;
import com.jobportal.exception.BusinessException;
import com.jobportal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProviderService {

    private final CompanyRepository companyRepository;
    private final JobPostRepository jobPostRepository;
    private final ApplicationRepository applicationRepository;
    private final SeekerProfileRepository seekerProfileRepository;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;

    // ── Company ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CompanyResponse getMyCompany(String email) {
        User user = findUser(email);
        Company company = companyRepository.findByUserId(user.getId())
                .orElseThrow(() -> BusinessException.notFound(
                        "Company profile not found. POST /provider/company to create one."));
        return toCompanyResponse(company);
    }

    @Transactional
    public CompanyResponse createCompany(String email, CreateCompanyRequest req) {
        User user = findUser(email);
        if (companyRepository.existsByUserId(user.getId())) {
            throw BusinessException.conflict("You already have a company profile. Use PUT /provider/company to update it.");
        }
        Company company = Company.builder()
                .user(user)
                .name(req.getName())
                .description(req.getDescription())
                .industry(req.getIndustry())
                .size(req.getSize())
                .website(req.getWebsite())
                .location(req.getLocation())
                .build();
        return toCompanyResponse(companyRepository.save(company));
    }

    @Transactional
    public CompanyResponse updateCompany(String email, UpdateCompanyRequest req) {
        User user = findUser(email);
        Company company = companyRepository.findByUserId(user.getId())
                .orElseThrow(() -> BusinessException.notFound("Company profile not found"));

        if (req.getName() != null)        company.setName(req.getName());
        if (req.getDescription() != null) company.setDescription(req.getDescription());
        if (req.getIndustry() != null)    company.setIndustry(req.getIndustry());
        if (req.getSize() != null)        company.setSize(req.getSize());
        if (req.getWebsite() != null)     company.setWebsite(req.getWebsite());
        if (req.getLocation() != null)    company.setLocation(req.getLocation());

        return toCompanyResponse(companyRepository.save(company));
    }

    @Transactional
    public String uploadLogo(String email, MultipartFile file) {
        User user = findUser(email);
        Company company = companyRepository.findByUserId(user.getId())
                .orElseThrow(() -> BusinessException.notFound("Company profile not found"));

        if (company.getLogoUrl() != null) {
            fileStorageService.deleteFile(company.getLogoUrl());
        }
        String url = fileStorageService.uploadCompanyLogo(file, company.getId());
        company.setLogoUrl(url);
        companyRepository.save(company);
        return url;
    }

    @Transactional(readOnly = true)
    public CompanyResponse getCompanyById(Long companyId) {
        return companyRepository.findById(companyId)
                .map(this::toCompanyResponse)
                .orElseThrow(() -> BusinessException.notFound("Company not found"));
    }

    // ── Job Postings ─────────────────────────────────────────────────

    @Transactional
    public JobPostResponse createJob(String email, CreateJobPostRequest req) {
        Company company = findCompany(email);

        JobPost job = JobPost.builder()
                .company(company)
                .title(req.getTitle())
                .description(req.getDescription())
                .requirements(req.getRequirements())
                .responsibilities(req.getResponsibilities())
                .location(req.getLocation())
                .jobType(req.getJobType())
                .experienceLevel(req.getExperienceLevel())
                .status(req.getStatus() != null ? req.getStatus() : JobStatus.ACTIVE)
                .salaryMin(req.getSalaryMin())
                .salaryMax(req.getSalaryMax())
                .deadline(req.getDeadline())
                .maxApplicants(req.getMaxApplicants())
                .build();

        JobPost saved = jobPostRepository.save(job);

        if (req.getSkills() != null) {
            attachSkills(saved, req.getSkills());
            saved = jobPostRepository.save(saved);
        }

        return toJobResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<JobPostResponse> getMyJobs(String email, int page, int size) {
        Company company = findCompany(email);
        return jobPostRepository.findByCompanyId(
                company.getId(),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).map(this::toJobResponse);
    }

    @Transactional
    public JobPostResponse updateJob(String email, Long jobId, UpdateJobPostRequest req) {
        JobPost job = findProviderJob(email, jobId);

        if (req.getTitle() != null)           job.setTitle(req.getTitle());
        if (req.getDescription() != null)     job.setDescription(req.getDescription());
        if (req.getRequirements() != null)    job.setRequirements(req.getRequirements());
        if (req.getResponsibilities() != null) job.setResponsibilities(req.getResponsibilities());
        if (req.getLocation() != null)        job.setLocation(req.getLocation());
        if (req.getJobType() != null)         job.setJobType(req.getJobType());
        if (req.getExperienceLevel() != null) job.setExperienceLevel(req.getExperienceLevel());
        if (req.getStatus() != null)          job.setStatus(req.getStatus());
        if (req.getSalaryMin() != null)       job.setSalaryMin(req.getSalaryMin());
        if (req.getSalaryMax() != null)       job.setSalaryMax(req.getSalaryMax());
        if (req.getDeadline() != null)        job.setDeadline(req.getDeadline());
        if (req.getMaxApplicants() != null)   job.setMaxApplicants(req.getMaxApplicants());

        if (req.getSkills() != null) {
            job.getJobSkills().clear();
            attachSkills(job, req.getSkills());
        }

        return toJobResponse(jobPostRepository.save(job));
    }

    @Transactional
    public JobPostResponse closeJob(String email, Long jobId) {
        JobPost job = findProviderJob(email, jobId);
        job.setStatus(JobStatus.CLOSED);
        return toJobResponse(jobPostRepository.save(job));
    }

    // ── Applicant Tracking System ─────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ApplicationDetailResponse> getApplicants(
            String email, Long jobId, String statusStr, int page, int size) {

        JobPost job = findProviderJob(email, jobId);
        ApplicationStatus status = (statusStr != null && !statusStr.isBlank())
                ? ApplicationStatus.valueOf(statusStr) : null;

        return applicationRepository.findByJobIdWithSeeker(
                job.getId(), status,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "appliedAt"))
        ).map(a -> toApplicationDetail(a, job));
    }

    @Transactional
    public ApplicationDetailResponse updateApplicationStatus(
            String email, Long applicationId, UpdateApplicationStatusRequest req) {

        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> BusinessException.notFound("Application not found"));

        ensureProviderOwnsJob(email, application.getJob().getId());

        ApplicationStatus oldStatus = application.getStatus();
        application.setStatus(req.getStatus());
        if (req.getNotes() != null) application.setProviderNotes(req.getNotes());

        Application saved = applicationRepository.save(application);

        if (oldStatus != req.getStatus()) {
            User seeker = application.getProfile().getUser();
            emailService.sendApplicationStatusEmail(
                    seeker.getEmail(), seeker.getFullName(),
                    application.getJob().getTitle(), req.getStatus().name());
        }

        return toApplicationDetail(saved, saved.getJob());
    }

    // ── Candidate Search ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<SeekerProfileResponse> searchCandidates(
            String keyword, String location, String skillName,
            Integer minExp, Integer maxExp, int page, int size) {

        return seekerProfileRepository.searchCandidates(
                blankToNull(keyword), blankToNull(location),
                blankToNull(skillName), minExp, maxExp,
                ProfileVisibility.PRIVATE,
                PageRequest.of(page, size)
        ).map(this::toSeekerSummary);
    }

    @Transactional(readOnly = true)
    public SeekerProfileResponse getCandidateProfile(Long profileId) {
        SeekerProfile profile = seekerProfileRepository.findById(profileId)
                .orElseThrow(() -> BusinessException.notFound("Candidate profile not found"));
        if (profile.getVisibility() == ProfileVisibility.PRIVATE) {
            throw BusinessException.forbidden("This candidate's profile is private");
        }
        return toSeekerSummary(profile);
    }

    // ── Provider Dashboard Stats ──────────────────────────────────────

    @Transactional(readOnly = true)
    public ProviderDashboardResponse getDashboard(String email) {
        Company company = findCompany(email);
        Long cid = company.getId();

        return ProviderDashboardResponse.builder()
                .activeJobs(jobPostRepository.countByCompanyIdAndStatus(cid, JobStatus.ACTIVE))
                .totalJobs(jobPostRepository.countByCompanyId(cid))
                .totalApplicants(applicationRepository.countByCompanyId(cid))
                .shortlisted(applicationRepository.countByCompanyIdAndStatus(cid, ApplicationStatus.SHORTLISTED))
                .interviewed(applicationRepository.countByCompanyIdAndStatus(cid, ApplicationStatus.INTERVIEW))
                .offered(applicationRepository.countByCompanyIdAndStatus(cid, ApplicationStatus.OFFERED))
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
    }

    private Company findCompany(String email) {
        User user = findUser(email);
        return companyRepository.findByUserId(user.getId())
                .orElseThrow(() -> BusinessException.notFound(
                        "Company profile not found. POST /provider/company to create one."));
    }

    private JobPost findProviderJob(String email, Long jobId) {
        Company company = findCompany(email);
        JobPost job = jobPostRepository.findById(jobId)
                .orElseThrow(() -> BusinessException.notFound("Job not found"));
        if (!job.getCompany().getId().equals(company.getId())) {
            throw BusinessException.forbidden("You do not own this job posting");
        }
        return job;
    }

    private void ensureProviderOwnsJob(String email, Long jobId) {
        findProviderJob(email, jobId);
    }

    private void attachSkills(JobPost job, List<CreateJobPostRequest.JobSkillRequest> skillRequests) {
        for (CreateJobPostRequest.JobSkillRequest sr : skillRequests) {
            Skill skill = skillRepository.findById(sr.getSkillId())
                    .orElseThrow(() -> BusinessException.notFound("Skill not found: " + sr.getSkillId()));
            JobSkill js = JobSkill.builder()
                    .job(job)
                    .skill(skill)
                    .requiredLevel(sr.getRequiredLevel())
                    .isMandatory(sr.getIsMandatory() != null ? sr.getIsMandatory() : true)
                    .build();
            job.getJobSkills().add(js);
        }
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    public CompanyResponse toCompanyResponse(Company c) {
        return CompanyResponse.builder()
                .id(c.getId())
                .userId(c.getUser().getId())
                .name(c.getName())
                .description(c.getDescription())
                .industry(c.getIndustry())
                .size(c.getSize())
                .website(c.getWebsite())
                .location(c.getLocation())
                .logoUrl(c.getLogoUrl())
                .isVerified(c.getIsVerified())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    public JobPostResponse toJobResponse(JobPost j) {
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
                .company(JobPostResponse.CompanyDto.builder()
                        .id(j.getCompany().getId())
                        .name(j.getCompany().getName())
                        .industry(j.getCompany().getIndustry())
                        .size(j.getCompany().getSize())
                        .location(j.getCompany().getLocation())
                        .logoUrl(j.getCompany().getLogoUrl())
                        .isVerified(j.getCompany().getIsVerified())
                        .build())
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

    private ApplicationDetailResponse toApplicationDetail(Application a, JobPost job) {
        SeekerProfile p = a.getProfile();
        return ApplicationDetailResponse.builder()
                .id(a.getId())
                .status(a.getStatus())
                .matchScore(a.getMatchScore())
                .coverLetter(a.getCoverLetter())
                .resumeSnapshot(a.getResumeSnapshot())
                .providerNotes(a.getProviderNotes())
                .appliedAt(a.getAppliedAt())
                .updatedAt(a.getUpdatedAt())
                .job(ApplicationDetailResponse.JobSummaryDto.builder()
                        .id(job.getId())
                        .title(job.getTitle())
                        .location(job.getLocation())
                        .build())
                .seeker(ApplicationDetailResponse.SeekerSummaryDto.builder()
                        .profileId(p.getId())
                        .userId(p.getUser().getId())
                        .fullName(p.getUser().getFullName())
                        .email(p.getUser().getEmail())
                        .headline(p.getHeadline())
                        .location(p.getLocation())
                        .totalExperience(p.getTotalExperience())
                        .expectedSalary(p.getExpectedSalary())
                        .resumeUrl(p.getResumeUrl())
                        .linkedinUrl(p.getLinkedinUrl())
                        .githubUrl(p.getGithubUrl())
                        .completionScore(p.getCompletionScore())
                        .activelyLooking(p.getActivelyLooking())
                        .skills(p.getSkills().stream()
                                .map(s -> ApplicationDetailResponse.SkillDto.builder()
                                        .skillId(s.getSkill().getId())
                                        .skillName(s.getSkill().getName())
                                        .level(s.getLevel())
                                        .years(s.getYears())
                                        .build())
                                .toList())
                        .experiences(p.getExperiences().stream()
                                .map(e -> ApplicationDetailResponse.ExperienceDto.builder()
                                        .company(e.getCompany())
                                        .title(e.getTitle())
                                        .startDate(e.getStartDate())
                                        .endDate(e.getEndDate())
                                        .isCurrent(e.getIsCurrent())
                                        .build())
                                .toList())
                        .educations(p.getEducations().stream()
                                .map(e -> ApplicationDetailResponse.EducationDto.builder()
                                        .institution(e.getInstitution())
                                        .degree(e.getDegree())
                                        .field(e.getField())
                                        .year(e.getYear())
                                        .build())
                                .toList())
                        .build())
                .build();
    }

    private SeekerProfileResponse toSeekerSummary(SeekerProfile p) {
        return SeekerProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .fullName(p.getUser().getFullName())
                .email(p.getVisibility() == ProfileVisibility.EMPLOYERS_ONLY
                        ? p.getUser().getEmail() : p.getUser().getEmail())
                .headline(p.getHeadline())
                .summary(p.getSummary())
                .location(p.getLocation())
                .visibility(p.getVisibility())
                .resumeUrl(p.getResumeUrl())
                .totalExperience(p.getTotalExperience())
                .expectedSalary(p.getExpectedSalary())
                .linkedinUrl(p.getLinkedinUrl())
                .githubUrl(p.getGithubUrl())
                .completionScore(p.getCompletionScore())
                .activelyLooking(p.getActivelyLooking())
                .skills(p.getSkills().stream()
                        .map(s -> SeekerProfileResponse.ProfileSkillDto.builder()
                                .id(s.getId())
                                .skillId(s.getSkill().getId())
                                .skillName(s.getSkill().getName())
                                .skillCategory(s.getSkill().getCategory())
                                .level(s.getLevel())
                                .years(s.getYears())
                                .build())
                        .toList())
                .experiences(p.getExperiences().stream()
                        .map(e -> SeekerProfileResponse.ExperienceDto.builder()
                                .id(e.getId())
                                .company(e.getCompany())
                                .title(e.getTitle())
                                .description(e.getDescription())
                                .startDate(e.getStartDate())
                                .endDate(e.getEndDate())
                                .isCurrent(e.getIsCurrent())
                                .build())
                        .toList())
                .educations(p.getEducations().stream()
                        .map(e -> SeekerProfileResponse.EducationDto.builder()
                                .id(e.getId())
                                .institution(e.getInstitution())
                                .degree(e.getDegree())
                                .field(e.getField())
                                .year(e.getYear())
                                .grade(e.getGrade())
                                .build())
                        .toList())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}

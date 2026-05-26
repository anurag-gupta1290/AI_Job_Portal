package com.jobportal.dto.request;

import com.jobportal.entity.enums.ApplicationStatus;
import com.jobportal.entity.enums.ExperienceLevel;
import com.jobportal.entity.enums.JobStatus;
import com.jobportal.entity.enums.JobType;
import com.jobportal.entity.enums.SkillLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

public class ProviderDTOs {

    @Data
    public static class CreateCompanyRequest {
        @NotBlank
        @Size(max = 200)
        private String name;

        private String description;

        @Size(max = 100)
        private String industry;

        @Size(max = 50)
        private String size;

        private String website;

        @Size(max = 200)
        private String location;
    }

    @Data
    public static class UpdateCompanyRequest {
        @Size(max = 200)
        private String name;

        private String description;

        @Size(max = 100)
        private String industry;

        @Size(max = 50)
        private String size;

        private String website;

        @Size(max = 200)
        private String location;
    }

    @Data
    public static class CreateJobPostRequest {
        @NotBlank
        @Size(max = 200)
        private String title;

        @NotBlank
        private String description;

        private String requirements;
        private String responsibilities;

        @Size(max = 200)
        private String location;

        @NotNull
        private JobType jobType;

        @NotNull
        private ExperienceLevel experienceLevel;

        private JobStatus status = JobStatus.ACTIVE;
        private Integer salaryMin;
        private Integer salaryMax;
        private LocalDate deadline;
        private Integer maxApplicants;

        private List<JobSkillRequest> skills;

        @Data
        public static class JobSkillRequest {
            @NotNull
            private Long skillId;
            private SkillLevel requiredLevel;
            private Boolean isMandatory = true;
        }
    }

    @Data
    public static class UpdateJobPostRequest {
        @Size(max = 200)
        private String title;

        private String description;
        private String requirements;
        private String responsibilities;

        @Size(max = 200)
        private String location;

        private JobType jobType;
        private ExperienceLevel experienceLevel;
        private JobStatus status;
        private Integer salaryMin;
        private Integer salaryMax;
        private LocalDate deadline;
        private Integer maxApplicants;

        private List<CreateJobPostRequest.JobSkillRequest> skills;
    }

    @Data
    public static class UpdateApplicationStatusRequest {
        @NotNull
        private ApplicationStatus status;

        private String notes;
    }

    @Data
    public static class CandidateSearchRequest {
        private String keyword;
        private String location;
        private String skillName;
        private Integer minExperience;
        private Integer maxExperience;
    }
}

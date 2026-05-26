package com.jobportal.dto.response;

import com.jobportal.entity.enums.ExperienceLevel;
import com.jobportal.entity.enums.JobStatus;
import com.jobportal.entity.enums.JobType;
import com.jobportal.entity.enums.SkillLevel;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class JobPostResponse {
    private Long id;
    private String title;
    private String description;
    private String requirements;
    private String responsibilities;
    private String location;
    private JobType jobType;
    private ExperienceLevel experienceLevel;
    private JobStatus status;
    private Integer salaryMin;
    private Integer salaryMax;
    private LocalDate deadline;
    private Integer viewCount;
    private Integer applicationCount;
    private CompanyDto company;
    private List<JobSkillDto> skills;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    public static class CompanyDto {
        private Long id;
        private String name;
        private String industry;
        private String size;
        private String location;
        private String logoUrl;
        private Boolean isVerified;
    }

    @Data
    @Builder
    public static class JobSkillDto {
        private Long skillId;
        private String skillName;
        private SkillLevel requiredLevel;
        private Boolean isMandatory;
    }
}

package com.jobportal.dto.response;

import com.jobportal.entity.enums.ApplicationStatus;
import com.jobportal.entity.enums.SkillLevel;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ApplicationDetailResponse {
    private Long id;
    private ApplicationStatus status;
    private Double matchScore;
    private String coverLetter;
    private String resumeSnapshot;
    private String providerNotes;
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;
    private JobSummaryDto job;
    private SeekerSummaryDto seeker;

    @Data
    @Builder
    public static class JobSummaryDto {
        private Long id;
        private String title;
        private String location;
    }

    @Data
    @Builder
    public static class SeekerSummaryDto {
        private Long profileId;
        private Long userId;
        private String fullName;
        private String email;
        private String headline;
        private String location;
        private Integer totalExperience;
        private Integer expectedSalary;
        private String resumeUrl;
        private String linkedinUrl;
        private String githubUrl;
        private Integer completionScore;
        private Boolean activelyLooking;
        private List<SkillDto> skills;
        private List<ExperienceDto> experiences;
        private List<EducationDto> educations;
    }

    @Data
    @Builder
    public static class SkillDto {
        private Long skillId;
        private String skillName;
        private SkillLevel level;
        private Integer years;
    }

    @Data
    @Builder
    public static class ExperienceDto {
        private String company;
        private String title;
        private LocalDate startDate;
        private LocalDate endDate;
        private Boolean isCurrent;
    }

    @Data
    @Builder
    public static class EducationDto {
        private String institution;
        private String degree;
        private String field;
        private Integer year;
    }
}

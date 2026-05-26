package com.jobportal.dto.response;

import com.jobportal.entity.enums.ProfileVisibility;
import com.jobportal.entity.enums.SkillLevel;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class SeekerProfileResponse {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String headline;
    private String summary;
    private String location;
    private ProfileVisibility visibility;
    private String resumeUrl;
    private Integer currentSalary;
    private Integer expectedSalary;
    private Integer totalExperience;
    private String linkedinUrl;
    private String githubUrl;
    private String portfolioUrl;
    private Integer completionScore;
    private Boolean activelyLooking;
    private List<ExperienceDto> experiences;
    private List<EducationDto> educations;
    private List<ProfileSkillDto> skills;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    public static class ExperienceDto {
        private Long id;
        private String company;
        private String title;
        private String description;
        private LocalDate startDate;
        private LocalDate endDate;
        private Boolean isCurrent;
    }

    @Data
    @Builder
    public static class EducationDto {
        private Long id;
        private String institution;
        private String degree;
        private String field;
        private Integer year;
        private String grade;
    }

    @Data
    @Builder
    public static class ProfileSkillDto {
        private Long id;
        private Long skillId;
        private String skillName;
        private String skillCategory;
        private SkillLevel level;
        private Integer years;
    }
}

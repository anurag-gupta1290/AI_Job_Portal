package com.jobportal.dto.request;

import com.jobportal.entity.enums.ProfileVisibility;
import com.jobportal.entity.enums.SkillLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

public class SeekerDTOs {

    @Data
    public static class UpdateProfileRequest {
        @Size(max = 200)
        private String headline;
        private String summary;
        @Size(max = 200)
        private String location;
        private ProfileVisibility visibility;
        private Integer currentSalary;
        private Integer expectedSalary;
        private Integer totalExperience;
        private String linkedinUrl;
        private String githubUrl;
        private String portfolioUrl;
        private Boolean activelyLooking;
    }

    @Data
    public static class AddExperienceRequest {
        @NotBlank
        @Size(max = 200)
        private String company;

        @NotBlank
        @Size(max = 200)
        private String title;

        private String description;

        @NotNull
        private LocalDate startDate;

        private LocalDate endDate;

        private Boolean isCurrent = false;
    }

    @Data
    public static class AddEducationRequest {
        @NotBlank
        @Size(max = 200)
        private String institution;

        @NotBlank
        @Size(max = 200)
        private String degree;

        @Size(max = 200)
        private String field;

        private Integer year;

        @Size(max = 50)
        private String grade;
    }

    @Data
    public static class AddSkillRequest {
        @NotNull
        private Long skillId;

        @NotNull
        private SkillLevel level;

        private Integer years;
    }
}

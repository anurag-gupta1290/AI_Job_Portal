package com.jobportal.dto.response;

import com.jobportal.entity.enums.ApplicationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ApplicationResponse {
    private Long id;
    private ApplicationStatus status;
    private Double matchScore;
    private String coverLetter;
    private String resumeSnapshot;
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;
    private JobSummaryDto job;

    @Data
    @Builder
    public static class JobSummaryDto {
        private Long id;
        private String title;
        private String location;
        private String companyName;
        private String companyLogo;
        private Integer salaryMin;
        private Integer salaryMax;
    }
}

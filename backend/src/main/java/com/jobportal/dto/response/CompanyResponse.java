package com.jobportal.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CompanyResponse {
    private Long id;
    private Long userId;
    private String name;
    private String description;
    private String industry;
    private String size;
    private String website;
    private String location;
    private String logoUrl;
    private Boolean isVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

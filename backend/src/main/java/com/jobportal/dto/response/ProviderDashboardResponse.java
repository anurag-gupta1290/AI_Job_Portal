package com.jobportal.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProviderDashboardResponse {
    private long activeJobs;
    private long totalJobs;
    private long totalApplicants;
    private long shortlisted;
    private long interviewed;
    private long offered;
}

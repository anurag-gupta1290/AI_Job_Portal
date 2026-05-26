package com.jobportal.dto.request;

import lombok.Data;

public class ApplicationDTOs {

    @Data
    public static class ApplyRequest {
        private String coverLetter;
    }
}

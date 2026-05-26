package com.jobportal.dto.response;

import java.time.LocalDateTime;

public record CertificateResponse(
        Long id,
        Long enrolmentId,
        String certificateNumber,
        String seekerName,
        String courseTitle,
        String trainerName,
        LocalDateTime issuedAt,
        String fileUrl
) {}

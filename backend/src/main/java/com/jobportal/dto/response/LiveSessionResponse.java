package com.jobportal.dto.response;

import com.jobportal.entity.enums.LiveSessionPlatform;

import java.time.LocalDateTime;

public record LiveSessionResponse(
        Long id,
        Long courseId,
        String courseTitle,
        String title,
        String description,
        LocalDateTime scheduledAt,
        Integer durationMinutes,
        LiveSessionPlatform platform,
        String meetingUrl,
        String recordingUrl,
        LocalDateTime createdAt
) {}

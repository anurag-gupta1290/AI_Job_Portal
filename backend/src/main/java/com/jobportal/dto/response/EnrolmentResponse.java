package com.jobportal.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record EnrolmentResponse(
        Long id,
        CourseSummary course,
        SeekerSummary seeker,
        Integer progressPct,
        LocalDateTime enrolledAt,
        LocalDateTime completedAt,
        List<Long> completedLessonIds
) {
    public record CourseSummary(Long id, String title, String thumbnailUrl, Integer totalLessons) {}

    public record SeekerSummary(Long id, String fullName, String email) {}
}

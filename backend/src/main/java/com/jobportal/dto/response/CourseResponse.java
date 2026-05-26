package com.jobportal.dto.response;

import com.jobportal.entity.enums.CourseStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CourseResponse(
        Long id,
        TrainerSummary trainer,
        String title,
        String description,
        String syllabus,
        BigDecimal fees,
        BigDecimal durationHours,
        CourseStatus status,
        Integer totalEnrolled,
        String thumbnailUrl,
        List<LessonDto> lessons,
        List<MaterialDto> materials,
        List<String> skills,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Boolean enrolled
) {
    public record TrainerSummary(Long id, String fullName, String email) {}

    public record LessonDto(
            Long id,
            String title,
            String videoUrl,
            Integer durationMinutes,
            Integer orderIndex,
            Boolean isPreview
    ) {}

    public record MaterialDto(
            Long id,
            String title,
            String fileUrl,
            String type
    ) {}
}

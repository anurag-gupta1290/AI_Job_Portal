package com.jobportal.dto.response;

import com.jobportal.entity.enums.QuestionType;

import java.time.LocalDateTime;
import java.util.List;

public record AssessmentResponse(
        Long id,
        Long courseId,
        String courseTitle,
        String title,
        String description,
        Integer passingScore,
        Integer timeLimitMinutes,
        Boolean isPublished,
        List<QuestionDto> questions,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public record QuestionDto(
            Long id,
            QuestionType type,
            String text,
            String explanation,
            Integer orderIndex,
            Integer marks,
            List<OptionDto> options
    ) {}

    public record OptionDto(
            Long id,
            String text,
            Boolean isCorrect   // null when sent to seeker to hide answer
    ) {}
}

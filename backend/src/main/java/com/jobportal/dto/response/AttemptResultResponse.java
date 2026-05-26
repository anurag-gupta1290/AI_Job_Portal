package com.jobportal.dto.response;

import com.jobportal.entity.enums.QuestionType;

import java.time.LocalDateTime;
import java.util.List;

public record AttemptResultResponse(
        Long id,
        Long assessmentId,
        String assessmentTitle,
        Long seekerId,
        String seekerName,
        String seekerEmail,
        Integer score,
        Integer passingScore,
        Boolean passed,
        LocalDateTime submittedAt,
        List<AnswerResultDto> answers
) {

    public record AnswerResultDto(
            Long questionId,
            String questionText,
            QuestionType questionType,
            Long selectedOptionId,
            List<Long> selectedOptionIds,
            String answerText,
            Boolean isCorrect,
            Integer marksAwarded,
            String explanation
    ) {}
}

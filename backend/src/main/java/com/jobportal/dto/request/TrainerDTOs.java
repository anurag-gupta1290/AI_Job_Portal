package com.jobportal.dto.request;

import com.jobportal.entity.enums.CourseStatus;
import com.jobportal.entity.enums.LiveSessionPlatform;
import com.jobportal.entity.enums.MaterialType;
import com.jobportal.entity.enums.QuestionType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class TrainerDTOs {

    public record CreateCourseRequest(
            @NotBlank @Size(max = 200) String title,
            String description,
            String syllabus,
            @NotNull @DecimalMin("0.0") BigDecimal fees,
            @DecimalMin("0.1") BigDecimal durationHours,
            List<Long> skillIds
    ) {}

    public record UpdateCourseRequest(
            @NotBlank @Size(max = 200) String title,
            String description,
            String syllabus,
            @NotNull @DecimalMin("0.0") BigDecimal fees,
            @DecimalMin("0.1") BigDecimal durationHours,
            CourseStatus status,
            List<Long> skillIds
    ) {}

    public record AddLessonRequest(
            @NotBlank @Size(max = 200) String title,
            String videoUrl,
            @Min(1) Integer durationMinutes,
            @NotNull @Min(0) Integer orderIndex,
            Boolean isPreview
    ) {}

    public record UpdateLessonRequest(
            @NotBlank @Size(max = 200) String title,
            String videoUrl,
            @Min(1) Integer durationMinutes,
            @NotNull @Min(0) Integer orderIndex,
            Boolean isPreview
    ) {}

    public record AddMaterialRequest(
            @NotBlank @Size(max = 200) String title,
            @NotNull MaterialType type,
            String fileUrl
    ) {}

    public record MarkLessonCompleteRequest(
            @NotNull Long lessonId
    ) {}

    public record UpdateVideoProgressRequest(
            @NotNull @Min(0) @Max(100) Integer watchedPct
    ) {}

    public record InitChunkedUploadRequest(
            @NotBlank String fileName,
            @NotNull @Min(1) Integer totalChunks
    ) {}

    public record CreateLiveSessionRequest(
            @NotBlank @Size(max = 200) String title,
            String description,
            LocalDateTime scheduledAt,
            @Min(1) Integer durationMinutes,
            @NotNull LiveSessionPlatform platform,
            @NotBlank @Size(max = 500) String meetingUrl
    ) {}

    public record UpdateLiveSessionRequest(
            @NotBlank @Size(max = 200) String title,
            String description,
            LocalDateTime scheduledAt,
            @Min(1) Integer durationMinutes,
            LiveSessionPlatform platform,
            @Size(max = 500) String meetingUrl,
            @Size(max = 500) String recordingUrl
    ) {}

    // ── Assessment ─────────────────────────────────────────────────

    public record CreateAssessmentRequest(
            @NotBlank @Size(max = 200) String title,
            String description,
            @NotNull @Min(0) @Max(100) Integer passingScore,
            @Min(1) Integer timeLimitMinutes,
            boolean isPublished
    ) {}

    public record AddQuestionRequest(
            @NotNull QuestionType type,
            @NotBlank String text,
            String explanation,
            @NotNull @Min(0) Integer orderIndex,
            @Min(1) Integer marks,
            List<OptionRequest> options
    ) {}

    public record OptionRequest(
            @NotBlank String text,
            boolean isCorrect
    ) {}

    public record SubmitAttemptRequest(
            @NotNull List<AnswerRequest> answers
    ) {}

    public record AnswerRequest(
            @NotNull Long questionId,
            Long selectedOptionId,
            List<Long> selectedOptionIds,
            String answerText
    ) {}
}

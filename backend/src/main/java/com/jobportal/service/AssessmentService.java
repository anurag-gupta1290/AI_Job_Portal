package com.jobportal.service;

import com.jobportal.dto.request.TrainerDTOs.*;
import com.jobportal.dto.response.AssessmentResponse;
import com.jobportal.dto.response.AttemptResultResponse;
import com.jobportal.entity.*;
import com.jobportal.entity.enums.QuestionType;
import com.jobportal.exception.BusinessException;
import com.jobportal.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final AssessmentQuestionRepository questionRepository;
    private final AssessmentOptionRepository optionRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final AttemptAnswerRepository answerRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrolmentRepository enrolmentRepository;

    // ── Trainer: Assessment CRUD ──────────────────────────────────────────

    @Transactional
    public AssessmentResponse createAssessment(String trainerEmail, Long courseId,
            CreateAssessmentRequest req) {
        Course course = getOwnedCourse(trainerEmail, courseId);
        if (assessmentRepository.existsByCourseId(courseId)) {
            throw BusinessException.conflict("Assessment already exists for this course");
        }
        Assessment a = Assessment.builder()
                .course(course)
                .title(req.title())
                .description(req.description())
                .passingScore(req.passingScore())
                .timeLimitMinutes(req.timeLimitMinutes())
                .isPublished(req.isPublished())
                .build();
        return toResponse(assessmentRepository.save(a), true);
    }

    public AssessmentResponse getAssessmentForTrainer(String trainerEmail, Long courseId) {
        getOwnedCourse(trainerEmail, courseId);
        Assessment a = assessmentRepository.findByCourseId(courseId)
                .orElseThrow(() -> BusinessException.notFound("No assessment found for this course"));
        return toResponse(a, true);
    }

    @Transactional
    public AssessmentResponse updateAssessment(String trainerEmail, Long courseId,
            CreateAssessmentRequest req) {
        getOwnedCourse(trainerEmail, courseId);
        Assessment a = assessmentRepository.findByCourseId(courseId)
                .orElseThrow(() -> BusinessException.notFound("No assessment found"));
        a.setTitle(req.title());
        a.setDescription(req.description());
        a.setPassingScore(req.passingScore());
        a.setTimeLimitMinutes(req.timeLimitMinutes());
        a.setIsPublished(req.isPublished());
        return toResponse(assessmentRepository.save(a), true);
    }

    @Transactional
    public void deleteAssessment(String trainerEmail, Long courseId) {
        getOwnedCourse(trainerEmail, courseId);
        Assessment a = assessmentRepository.findByCourseId(courseId)
                .orElseThrow(() -> BusinessException.notFound("No assessment found"));
        assessmentRepository.delete(a);
    }

    // ── Trainer: Question CRUD ────────────────────────────────────────────

    @Transactional
    public AssessmentResponse addQuestion(String trainerEmail, Long courseId,
            AddQuestionRequest req) {
        getOwnedCourse(trainerEmail, courseId);
        Assessment a = assessmentRepository.findByCourseId(courseId)
                .orElseThrow(() -> BusinessException.notFound("No assessment found"));

        AssessmentQuestion q = AssessmentQuestion.builder()
                .assessment(a)
                .type(req.type())
                .text(req.text())
                .explanation(req.explanation())
                .orderIndex(req.orderIndex())
                .marks(req.marks() != null ? req.marks() : 1)
                .build();
        q = questionRepository.save(q);

        if ((req.type() == QuestionType.MCQ || req.type() == QuestionType.MULTI_SELECT) && req.options() != null) {
            attachOptions(q, req.options());
        }
        return toResponse(assessmentRepository.findById(a.getId()).orElseThrow(), true);
    }

    @Transactional
    public AssessmentResponse updateQuestion(String trainerEmail, Long courseId, Long questionId,
            AddQuestionRequest req) {
        getOwnedCourse(trainerEmail, courseId);
        AssessmentQuestion q = questionRepository.findById(questionId)
                .orElseThrow(() -> BusinessException.notFound("Question not found"));
        q.setType(req.type());
        q.setText(req.text());
        q.setExplanation(req.explanation());
        q.setOrderIndex(req.orderIndex());
        if (req.marks() != null) q.setMarks(req.marks());

        q.getOptions().clear();
        questionRepository.save(q);

        if ((req.type() == QuestionType.MCQ || req.type() == QuestionType.MULTI_SELECT) && req.options() != null) {
            attachOptions(q, req.options());
        }
        Long assessmentId = q.getAssessment().getId();
        return toResponse(assessmentRepository.findById(assessmentId).orElseThrow(), true);
    }

    @Transactional
    public AssessmentResponse deleteQuestion(String trainerEmail, Long courseId, Long questionId) {
        getOwnedCourse(trainerEmail, courseId);
        AssessmentQuestion q = questionRepository.findById(questionId)
                .orElseThrow(() -> BusinessException.notFound("Question not found"));
        Long assessmentId = q.getAssessment().getId();
        questionRepository.delete(q);
        return toResponse(assessmentRepository.findById(assessmentId).orElseThrow(), true);
    }

    // ── Trainer: Attempts list ────────────────────────────────────────────

    public List<AttemptResultResponse> getAttemptsForCourse(String trainerEmail, Long courseId) {
        getOwnedCourse(trainerEmail, courseId);
        Assessment a = assessmentRepository.findByCourseId(courseId)
                .orElseThrow(() -> BusinessException.notFound("No assessment found"));
        return attemptRepository.findByAssessmentId(a.getId()).stream()
                .map(this::toAttemptResult)
                .toList();
    }

    // ── Seeker: Get assessment (options without isCorrect) ────────────────

    public AssessmentResponse getAssessmentForSeeker(Long courseId) {
        Assessment a = assessmentRepository.findByCourseId(courseId)
                .orElseThrow(() -> BusinessException.notFound("No assessment for this course"));
        if (!a.getIsPublished()) {
            throw BusinessException.badRequest("Assessment is not yet published");
        }
        return toResponse(a, false);
    }

    // ── Seeker: Submit attempt ────────────────────────────────────────────

    @Transactional
    public AttemptResultResponse submitAttempt(String seekerEmail, Long courseId,
            SubmitAttemptRequest req) {
        User seeker = userRepository.findByEmail(seekerEmail)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
        Assessment a = assessmentRepository.findByCourseId(courseId)
                .orElseThrow(() -> BusinessException.notFound("No assessment found"));
        if (!a.getIsPublished()) {
            throw BusinessException.badRequest("Assessment is not published");
        }
        if (!enrolmentRepository.existsByCourseIdAndSeekerId(courseId, seeker.getId())) {
            throw BusinessException.badRequest("You must be enrolled in this course");
        }

        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .assessment(a)
                .seeker(seeker)
                .build();
        attempt = attemptRepository.save(attempt);

        int totalMarks = 0;
        int earnedMarks = 0;

        for (AnswerRequest ar : req.answers()) {
            AssessmentQuestion q = questionRepository.findById(ar.questionId())
                    .orElseThrow(() -> BusinessException.notFound("Question not found: " + ar.questionId()));

            Boolean correct = null;
            int awarded = 0;
            String storedMultiIds = null;

            if (q.getType() == QuestionType.MCQ) {
                totalMarks += q.getMarks();
                if (ar.selectedOptionId() != null) {
                    AssessmentOption correctOpt = optionRepository
                            .findByQuestionIdAndIsCorrectTrue(q.getId());
                    correct = correctOpt != null && correctOpt.getId().equals(ar.selectedOptionId());
                    if (Boolean.TRUE.equals(correct)) {
                        awarded = q.getMarks();
                        earnedMarks += awarded;
                    }
                }
            } else if (q.getType() == QuestionType.MULTI_SELECT) {
                totalMarks += q.getMarks();
                List<Long> correctIds = optionRepository.findAllByQuestionIdAndIsCorrectTrue(q.getId())
                        .stream().map(AssessmentOption::getId).sorted().toList();
                List<Long> selectedIds = ar.selectedOptionIds() != null
                        ? ar.selectedOptionIds().stream().sorted().toList()
                        : List.of();
                storedMultiIds = selectedIds.stream().map(String::valueOf).collect(Collectors.joining(","));
                correct = correctIds.equals(selectedIds);
                if (Boolean.TRUE.equals(correct)) {
                    awarded = q.getMarks();
                    earnedMarks += awarded;
                }
            }
            // SHORT_ANSWER: totalMarks not counted for auto-score; isCorrect stays null

            AttemptAnswer ans = AttemptAnswer.builder()
                    .attempt(attempt)
                    .question(q)
                    .selectedOptionId(ar.selectedOptionId())
                    .selectedOptionIds(storedMultiIds)
                    .answerText(ar.answerText())
                    .isCorrect(correct)
                    .marksAwarded(awarded)
                    .build();
            answerRepository.save(ans);
        }

        int score = totalMarks > 0 ? (int) Math.round(earnedMarks * 100.0 / totalMarks) : 0;
        boolean passed = score >= a.getPassingScore();
        attempt.setScore(score);
        attempt.setPassed(passed);
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt = attemptRepository.save(attempt);

        log.info("Assessment attempt: seeker={} course={} score={}% passed={}", seekerEmail, courseId, score, passed);
        return toAttemptResult(attempt);
    }

    // ── Seeker: My attempts ───────────────────────────────────────────────

    public List<AttemptResultResponse> getMyAttempts(String seekerEmail, Long courseId) {
        User seeker = userRepository.findByEmail(seekerEmail)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
        Assessment a = assessmentRepository.findByCourseId(courseId)
                .orElseThrow(() -> BusinessException.notFound("No assessment found"));
        return attemptRepository.findByAssessmentIdAndSeekerId(a.getId(), seeker.getId()).stream()
                .map(this::toAttemptResult)
                .toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private void attachOptions(AssessmentQuestion q, List<OptionRequest> opts) {
        opts.forEach(o -> optionRepository.save(
                AssessmentOption.builder().question(q).text(o.text()).isCorrect(o.isCorrect()).build()));
    }

    private Course getOwnedCourse(String email, Long courseId) {
        User trainer = userRepository.findByEmail(email)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> BusinessException.notFound("Course not found"));
        if (!course.getTrainer().getId().equals(trainer.getId())) {
            throw BusinessException.forbidden("You do not own this course");
        }
        return course;
    }

    private AssessmentResponse toResponse(Assessment a, boolean showAnswers) {
        List<AssessmentResponse.QuestionDto> qdtos = a.getQuestions().stream()
                .map(q -> {
                    List<AssessmentResponse.OptionDto> opts = q.getOptions().stream()
                            .map(o -> new AssessmentResponse.OptionDto(
                                    o.getId(), o.getText(),
                                    showAnswers ? o.getIsCorrect() : null))
                            .toList();
                    return new AssessmentResponse.QuestionDto(
                            q.getId(), q.getType(), q.getText(),
                            showAnswers ? q.getExplanation() : null,
                            q.getOrderIndex(), q.getMarks(), opts);
                })
                .toList();

        return new AssessmentResponse(
                a.getId(),
                a.getCourse().getId(),
                a.getCourse().getTitle(),
                a.getTitle(),
                a.getDescription(),
                a.getPassingScore(),
                a.getTimeLimitMinutes(),
                a.getIsPublished(),
                qdtos,
                a.getCreatedAt(),
                a.getUpdatedAt());
    }

    private AttemptResultResponse toAttemptResult(AssessmentAttempt at) {
        List<AttemptResultResponse.AnswerResultDto> adtos =
                answerRepository.findByAttemptId(at.getId()).stream()
                        .map(a -> {
                            List<Long> multiIds = null;
                            if (a.getSelectedOptionIds() != null && !a.getSelectedOptionIds().isBlank()) {
                                multiIds = Arrays.stream(a.getSelectedOptionIds().split(","))
                                        .filter(s -> !s.isBlank())
                                        .map(Long::parseLong)
                                        .toList();
                            }
                            return new AttemptResultResponse.AnswerResultDto(
                                    a.getQuestion().getId(),
                                    a.getQuestion().getText(),
                                    a.getQuestion().getType(),
                                    a.getSelectedOptionId(),
                                    multiIds,
                                    a.getAnswerText(),
                                    a.getIsCorrect(),
                                    a.getMarksAwarded(),
                                    a.getQuestion().getExplanation());
                        })
                        .toList();

        return new AttemptResultResponse(
                at.getId(),
                at.getAssessment().getId(),
                at.getAssessment().getTitle(),
                at.getSeeker().getId(),
                at.getSeeker().getFullName(),
                at.getSeeker().getEmail(),
                at.getScore(),
                at.getAssessment().getPassingScore(),
                at.getPassed(),
                at.getSubmittedAt(),
                adtos);
    }
}

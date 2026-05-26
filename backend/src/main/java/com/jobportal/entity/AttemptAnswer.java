package com.jobportal.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "attempt_answers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AttemptAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private AssessmentAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private AssessmentQuestion question;

    private Long selectedOptionId;

    @Column(columnDefinition = "TEXT")
    private String selectedOptionIds;

    @Column(columnDefinition = "TEXT")
    private String answerText;

    private Boolean isCorrect;

    @Builder.Default
    private Integer marksAwarded = 0;
}

package com.jobportal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "video_progress",
    uniqueConstraints = @UniqueConstraint(columnNames = {"enrolment_id", "lesson_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VideoProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrolment_id", nullable = false)
    private Enrolment enrolment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private CourseLesson lesson;

    @Builder.Default
    @Column(nullable = false)
    private Integer watchedPct = 0;

    private LocalDateTime lastWatchedAt;
}

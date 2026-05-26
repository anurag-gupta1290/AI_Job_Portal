package com.jobportal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "enrolments",
    uniqueConstraints = @UniqueConstraint(columnNames = {"course_id", "seeker_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Enrolment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seeker_id", nullable = false)
    private User seeker;

    @Builder.Default
    private Integer progressPct = 0;

    @CreationTimestamp
    private LocalDateTime enrolledAt;

    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "enrolment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LessonProgress> lessonProgresses = new ArrayList<>();
}

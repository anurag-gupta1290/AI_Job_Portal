package com.jobportal.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "course_lessons")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CourseLesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false, length = 200)
    private String title;

    private String videoUrl;

    private Integer durationMinutes;

    @Column(nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;

    @Builder.Default
    private Boolean isPreview = false;
}

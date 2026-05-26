package com.jobportal.entity;

import com.jobportal.entity.enums.MaterialType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "course_materials")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CourseMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false, length = 200)
    private String title;

    private String fileUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private MaterialType type;
}

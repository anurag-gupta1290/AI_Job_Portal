package com.jobportal.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "educations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Education {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private SeekerProfile profile;

    @Column(nullable = false, length = 200)
    private String institution;

    @Column(nullable = false, length = 200)
    private String degree;

    @Column(length = 200)
    private String field;

    private Integer year;

    @Column(length = 50)
    private String grade;
}

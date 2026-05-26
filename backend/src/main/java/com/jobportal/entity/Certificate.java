package com.jobportal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "certificates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrolment_id", nullable = false, unique = true)
    private Enrolment enrolment;

    @Column(unique = true, nullable = false, length = 50)
    private String certificateNumber;

    @Column(nullable = false)
    private String seekerName;

    @Column(nullable = false)
    private String courseTitle;

    @Column(nullable = false)
    private String trainerName;

    @CreationTimestamp
    private LocalDateTime issuedAt;

    @Column(nullable = false)
    private String fileUrl;
}

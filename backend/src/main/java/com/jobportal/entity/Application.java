package com.jobportal.entity;

import com.jobportal.entity.enums.ApplicationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications",
    uniqueConstraints = @UniqueConstraint(columnNames = {"job_id", "profile_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private JobPost job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private SeekerProfile profile;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.APPLIED;

    private Double matchScore;

    @Column(columnDefinition = "TEXT")
    private String coverLetter;

    private String resumeSnapshot;

    @Column(columnDefinition = "TEXT")
    private String providerNotes;

    @CreationTimestamp
    private LocalDateTime appliedAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

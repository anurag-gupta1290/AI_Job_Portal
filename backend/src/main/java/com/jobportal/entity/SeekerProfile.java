package com.jobportal.entity;

import com.jobportal.entity.enums.ProfileVisibility;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "seeker_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SeekerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 200)
    private String headline;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(length = 200)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private ProfileVisibility visibility = ProfileVisibility.PUBLIC;

    private String resumeUrl;

    private Integer currentSalary;
    private Integer expectedSalary;
    private Integer totalExperience;

    private String linkedinUrl;
    private String githubUrl;
    private String portfolioUrl;

    @Builder.Default
    private Integer completionScore = 0;

    @Builder.Default
    private Boolean activelyLooking = false;

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Experience> experiences = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Education> educations = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProfileSkill> skills = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

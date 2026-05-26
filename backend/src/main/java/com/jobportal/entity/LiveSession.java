package com.jobportal.entity;

import com.jobportal.entity.enums.LiveSessionPlatform;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "live_sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LiveSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDateTime scheduledAt;

    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    private LiveSessionPlatform platform;

    @Column(length = 500)
    private String meetingUrl;

    @Column(length = 500)
    private String recordingUrl;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

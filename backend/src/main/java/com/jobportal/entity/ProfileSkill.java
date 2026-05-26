package com.jobportal.entity;

import com.jobportal.entity.enums.SkillLevel;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "profile_skills",
    uniqueConstraints = @UniqueConstraint(columnNames = {"profile_id", "skill_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProfileSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private SeekerProfile profile;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private SkillLevel level;

    private Integer years;
}

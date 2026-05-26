package com.jobportal.entity;

import com.jobportal.entity.enums.SkillLevel;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "job_skills")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private JobPost job;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private SkillLevel requiredLevel;

    @Builder.Default
    private Boolean isMandatory = true;
}

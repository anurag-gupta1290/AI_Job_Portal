package com.jobportal.repository;

import com.jobportal.entity.ProfileSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfileSkillRepository extends JpaRepository<ProfileSkill, Long> {
    List<ProfileSkill> findByProfileId(Long profileId);
    Optional<ProfileSkill> findByProfileIdAndSkillId(Long profileId, Long skillId);
    boolean existsByProfileIdAndSkillId(Long profileId, Long skillId);
    void deleteByProfileIdAndSkillId(Long profileId, Long skillId);
    long countByProfileId(Long profileId);
}

package com.jobportal.repository;

import com.jobportal.entity.SeekerProfile;
import com.jobportal.entity.User;
import com.jobportal.entity.enums.ProfileVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SeekerProfileRepository extends JpaRepository<SeekerProfile, Long> {
    Optional<SeekerProfile> findByUser(User user);
    Optional<SeekerProfile> findByUserId(Long userId);
    boolean existsByUserId(Long userId);

    @Query("""
            SELECT p FROM SeekerProfile p
            WHERE p.visibility != :privateVis
              AND (:keyword IS NULL
                   OR LOWER(p.headline) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(p.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:location IS NULL OR LOWER(p.location) LIKE LOWER(CONCAT('%', :location, '%')))
              AND (:minExp IS NULL OR p.totalExperience >= :minExp)
              AND (:maxExp IS NULL OR p.totalExperience <= :maxExp)
              AND (:skillName IS NULL OR EXISTS (
                    SELECT ps FROM ProfileSkill ps
                    WHERE ps.profile = p
                    AND LOWER(ps.skill.name) LIKE LOWER(CONCAT('%', :skillName, '%'))))
            ORDER BY p.completionScore DESC
            """)
    Page<SeekerProfile> searchCandidates(
            @Param("keyword") String keyword,
            @Param("location") String location,
            @Param("skillName") String skillName,
            @Param("minExp") Integer minExp,
            @Param("maxExp") Integer maxExp,
            @Param("privateVis") ProfileVisibility privateVis,
            Pageable pageable);
}

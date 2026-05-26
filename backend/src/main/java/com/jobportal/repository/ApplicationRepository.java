package com.jobportal.repository;

import com.jobportal.entity.Application;
import com.jobportal.entity.enums.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    boolean existsByJobIdAndProfileId(Long jobId, Long profileId);
    Optional<Application> findByJobIdAndProfileId(Long jobId, Long profileId);
    Page<Application> findByProfileIdOrderByAppliedAtDesc(Long profileId, Pageable pageable);
    Page<Application> findByJobId(Long jobId, Pageable pageable);
    long countByProfileId(Long profileId);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.job.company.id = :companyId")
    long countByCompanyId(@Param("companyId") Long companyId);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.job.company.id = :companyId AND a.status = :status")
    long countByCompanyIdAndStatus(@Param("companyId") Long companyId, @Param("status") ApplicationStatus status);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.job.id = :jobId AND a.status = :status")
    long countByJobIdAndStatus(@Param("jobId") Long jobId, @Param("status") ApplicationStatus status);

    @Query("""
            SELECT a FROM Application a
            JOIN FETCH a.profile p
            JOIN FETCH p.user u
            WHERE a.job.id = :jobId
              AND (:status IS NULL OR a.status = :status)
            ORDER BY a.appliedAt DESC
            """)
    Page<Application> findByJobIdWithSeeker(
            @Param("jobId") Long jobId,
            @Param("status") ApplicationStatus status,
            Pageable pageable);
}

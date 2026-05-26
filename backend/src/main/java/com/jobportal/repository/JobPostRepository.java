package com.jobportal.repository;

import com.jobportal.entity.JobPost;
import com.jobportal.entity.enums.ExperienceLevel;
import com.jobportal.entity.enums.JobStatus;
import com.jobportal.entity.enums.JobType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface JobPostRepository extends JpaRepository<JobPost, Long> {

    @Query("""
            SELECT j FROM JobPost j
            WHERE j.status = :status
              AND (:keyword IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%')))
              AND (:jobType IS NULL OR j.jobType = :jobType)
              AND (:experienceLevel IS NULL OR j.experienceLevel = :experienceLevel)
              AND (:salaryMin IS NULL OR j.salaryMax >= :salaryMin)
              AND (:salaryMax IS NULL OR j.salaryMin <= :salaryMax)
            """)
    Page<JobPost> searchJobs(
            @Param("keyword") String keyword,
            @Param("location") String location,
            @Param("jobType") JobType jobType,
            @Param("experienceLevel") ExperienceLevel experienceLevel,
            @Param("salaryMin") Integer salaryMin,
            @Param("salaryMax") Integer salaryMax,
            @Param("status") JobStatus status,
            Pageable pageable
    );

    Page<JobPost> findByCompanyId(Long companyId, Pageable pageable);

    long countByCompanyId(Long companyId);

    long countByCompanyIdAndStatus(Long companyId, JobStatus status);
}

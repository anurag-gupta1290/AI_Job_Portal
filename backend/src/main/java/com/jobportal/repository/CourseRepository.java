package com.jobportal.repository;

import com.jobportal.entity.Course;
import com.jobportal.entity.enums.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourseRepository extends JpaRepository<Course, Long> {

    Page<Course> findByTrainerId(Long trainerId, Pageable pageable);

    long countByTrainerId(Long trainerId);

    long countByTrainerIdAndStatus(Long trainerId, CourseStatus status);

    @Query("""
            SELECT c FROM Course c
            WHERE c.status = 'PUBLISHED'
              AND (:keyword IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<Course> searchPublished(@Param("keyword") String keyword, Pageable pageable);
}

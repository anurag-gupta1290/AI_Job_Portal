package com.jobportal.repository;

import com.jobportal.entity.Enrolment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EnrolmentRepository extends JpaRepository<Enrolment, Long> {

    Optional<Enrolment> findByCourseIdAndSeekerId(Long courseId, Long seekerId);

    boolean existsByCourseIdAndSeekerId(Long courseId, Long seekerId);

    List<Enrolment> findBySeekerId(Long seekerId);

    Page<Enrolment> findByCourseId(Long courseId, Pageable pageable);

    long countByCourseIdAndProgressPct(Long courseId, Integer progressPct);

    @Query("SELECT COUNT(e) FROM Enrolment e WHERE e.course.trainer.id = :trainerId")
    long countTotalEnrolmentsByTrainer(@Param("trainerId") Long trainerId);

    @Query("SELECT COUNT(e) FROM Enrolment e WHERE e.course.trainer.id = :trainerId AND e.completedAt IS NOT NULL")
    long countCompletedByTrainer(@Param("trainerId") Long trainerId);
}

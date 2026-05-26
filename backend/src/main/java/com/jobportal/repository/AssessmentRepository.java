package com.jobportal.repository;

import com.jobportal.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    Optional<Assessment> findByCourseId(Long courseId);
    boolean existsByCourseId(Long courseId);
}

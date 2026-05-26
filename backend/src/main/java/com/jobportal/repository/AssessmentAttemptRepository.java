package com.jobportal.repository;

import com.jobportal.entity.AssessmentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, Long> {
    List<AssessmentAttempt> findByAssessmentIdAndSeekerId(Long assessmentId, Long seekerId);
    List<AssessmentAttempt> findByAssessmentId(Long assessmentId);
    List<AssessmentAttempt> findBySeekerId(Long seekerId);
}

package com.jobportal.repository;

import com.jobportal.entity.AssessmentQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssessmentQuestionRepository extends JpaRepository<AssessmentQuestion, Long> {
    List<AssessmentQuestion> findByAssessmentIdOrderByOrderIndexAsc(Long assessmentId);
    void deleteByAssessmentId(Long assessmentId);
}

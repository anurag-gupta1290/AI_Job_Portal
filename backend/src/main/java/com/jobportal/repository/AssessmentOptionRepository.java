package com.jobportal.repository;

import com.jobportal.entity.AssessmentOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssessmentOptionRepository extends JpaRepository<AssessmentOption, Long> {
    List<AssessmentOption> findByQuestionId(Long questionId);
    AssessmentOption findByQuestionIdAndIsCorrectTrue(Long questionId);
    List<AssessmentOption> findAllByQuestionIdAndIsCorrectTrue(Long questionId);
}

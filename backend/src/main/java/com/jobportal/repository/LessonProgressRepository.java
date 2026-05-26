package com.jobportal.repository;

import com.jobportal.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

    List<LessonProgress> findByEnrolmentId(Long enrolmentId);

    Optional<LessonProgress> findByEnrolmentIdAndLessonId(Long enrolmentId, Long lessonId);

    boolean existsByEnrolmentIdAndLessonId(Long enrolmentId, Long lessonId);

    long countByEnrolmentId(Long enrolmentId);
}

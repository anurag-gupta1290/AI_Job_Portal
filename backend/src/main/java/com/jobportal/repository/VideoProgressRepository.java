package com.jobportal.repository;

import com.jobportal.entity.VideoProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VideoProgressRepository extends JpaRepository<VideoProgress, Long> {
    Optional<VideoProgress> findByEnrolmentIdAndLessonId(Long enrolmentId, Long lessonId);
    List<VideoProgress> findByEnrolmentId(Long enrolmentId);
}

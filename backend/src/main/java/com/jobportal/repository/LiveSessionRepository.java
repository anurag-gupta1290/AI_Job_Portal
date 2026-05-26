package com.jobportal.repository;

import com.jobportal.entity.LiveSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LiveSessionRepository extends JpaRepository<LiveSession, Long> {
    List<LiveSession> findByCourseIdOrderByScheduledAtAsc(Long courseId);
}

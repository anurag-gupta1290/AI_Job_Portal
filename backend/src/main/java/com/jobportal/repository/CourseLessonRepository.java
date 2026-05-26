package com.jobportal.repository;

import com.jobportal.entity.CourseLesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseLessonRepository extends JpaRepository<CourseLesson, Long> {

    List<CourseLesson> findByCourseIdOrderByOrderIndexAsc(Long courseId);

    long countByCourseId(Long courseId);
}

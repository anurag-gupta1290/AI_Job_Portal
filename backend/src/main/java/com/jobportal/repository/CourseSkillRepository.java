package com.jobportal.repository;

import com.jobportal.entity.CourseSkill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseSkillRepository extends JpaRepository<CourseSkill, Long> {

    List<CourseSkill> findByCourseId(Long courseId);

    void deleteByCourseId(Long courseId);
}

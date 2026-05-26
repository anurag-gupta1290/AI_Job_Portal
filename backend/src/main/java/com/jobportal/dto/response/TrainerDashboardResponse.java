package com.jobportal.dto.response;

public record TrainerDashboardResponse(
        long totalCourses,
        long publishedCourses,
        long draftCourses,
        long totalEnrolments,
        long completedEnrolments
) {}

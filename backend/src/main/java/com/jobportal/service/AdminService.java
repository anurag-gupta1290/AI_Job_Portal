package com.jobportal.service;

import com.jobportal.dto.response.ApiResponse;
import com.jobportal.entity.User;
import com.jobportal.exception.BusinessException;
import com.jobportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;

    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Transactional
    public User toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> BusinessException.notFound("User not found: " + userId));

        if (user.getRole() == User.Role.ROLE_ADMIN) {
            throw BusinessException.badRequest("Cannot suspend an admin account");
        }

        user.setIsActive(!user.getIsActive());
        return userRepository.save(user);
    }

    public Map<String, Long> getDashboardStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActive(true);
        long jobSeekers = userRepository.countByRole(User.Role.ROLE_JOB_SEEKER);
        long jobProviders = userRepository.countByRole(User.Role.ROLE_JOB_PROVIDER);
        long trainers = userRepository.countByRole(User.Role.ROLE_TRAINING_PROVIDER);

        return Map.of(
            "totalUsers", totalUsers,
            "activeUsers", activeUsers,
            "jobSeekers", jobSeekers,
            "jobProviders", jobProviders,
            "trainers", trainers
        );
    }
}

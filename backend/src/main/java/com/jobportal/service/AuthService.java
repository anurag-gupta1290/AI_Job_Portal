package com.jobportal.service;

import com.jobportal.dto.request.AuthDTOs;
import com.jobportal.dto.response.AuthResponse;
import com.jobportal.entity.RefreshToken;
import com.jobportal.entity.User;
import com.jobportal.exception.BusinessException;
import com.jobportal.repository.RefreshTokenRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;

    @Value("${app.jwt.access-token-expiry-ms}")
    private long accessTokenExpiryMs;

    @Value("${app.jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    @Transactional
    public AuthResponse register(AuthDTOs.RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw BusinessException.conflict("Email already in use: " + req.getEmail());
        }

        // Prevent registering as ADMIN via public endpoint
        if (req.getRole() == User.Role.ROLE_ADMIN) {
            throw BusinessException.badRequest("Cannot register as ADMIN via this endpoint");
        }

        User user = User.builder()
            .fullName(req.getFullName())
            .email(req.getEmail())
            .passwordHash(passwordEncoder.encode(req.getPassword()))
            .role(req.getRole())
            .phone(req.getPhone())
            .isActive(true)
            .isEmailVerified(false)
            .build();

        user = userRepository.save(user);

        // Send verification email asynchronously
        emailService.sendVerificationEmail(user);

        log.info("New user registered: {} with role {}", user.getEmail(), user.getRole());
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(AuthDTOs.LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
            .orElseThrow(() -> BusinessException.unauthorized("Invalid email or password"));

        if (!user.getIsActive()) {
            throw BusinessException.locked("Account is suspended. Please contact support.");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw BusinessException.unauthorized("Invalid email or password");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(rawRefreshToken)
            .orElseThrow(() -> BusinessException.unauthorized("Invalid refresh token"));

        if (!refreshToken.isValid()) {
            throw BusinessException.unauthorized("Refresh token expired or revoked");
        }

        // Rotate: revoke old, issue new
        refreshToken.setIsRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return buildAuthResponse(refreshToken.getUser());
    }

    @Transactional
    public void logout(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> BusinessException.notFound("User not found"));

        int revoked = refreshTokenRepository.revokeAllByUser(user);
        log.info("Revoked {} refresh tokens for user {}", revoked, email);
    }

    // ── Private helpers ──────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtils.generateAccessToken(user.getEmail(), user.getRole().name());
        String rawRefreshToken = UUID.randomUUID().toString();

        RefreshToken refreshToken = RefreshToken.builder()
            .user(user)
            .token(rawRefreshToken)
            .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000))
            .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(rawRefreshToken)
            .tokenType("Bearer")
            .expiresIn(accessTokenExpiryMs / 1000)
            .user(AuthResponse.UserInfo.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .isEmailVerified(user.getIsEmailVerified())
                .build())
            .build();
    }
}

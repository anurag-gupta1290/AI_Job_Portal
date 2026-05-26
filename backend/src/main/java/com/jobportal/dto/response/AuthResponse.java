package com.jobportal.dto.response;

import com.jobportal.entity.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Long expiresIn;
    private UserInfo user;

    @Data
    @Builder
    public static class UserInfo {
        private Long id;
        private String fullName;
        private String email;
        private User.Role role;
        private Boolean isEmailVerified;
    }
}

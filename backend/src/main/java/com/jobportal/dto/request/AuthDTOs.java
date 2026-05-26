package com.jobportal.dto.request;

import com.jobportal.entity.User;
import jakarta.validation.constraints.*;
import lombok.Data;

public class AuthDTOs {

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "Full name is required")
        @Size(max = 100)
        private String fullName;

        @NotBlank @Email(message = "Invalid email format")
        @Size(max = 150)
        private String email;

        @NotBlank
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String password;

        @NotNull(message = "Role is required")
        private User.Role role;

        @Pattern(regexp = "^\\+?[0-9]{7,15}$", message = "Invalid phone number")
        private String phone;
    }

    @Data
    public static class LoginRequest {
        @NotBlank @Email
        private String email;

        @NotBlank
        private String password;
    }

    @Data
    public static class RefreshRequest {
        @NotBlank
        private String refreshToken;
    }
}

package com.jobportal.controller;

import com.jobportal.dto.response.ApiResponse;
import com.jobportal.entity.User;
import com.jobportal.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Platform administration endpoints")
@SecurityRequirement(name = "BearerAuth")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get platform analytics summary")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getDashboardStats()));
    }

    @GetMapping("/users")
    @Operation(summary = "List all users (paginated)")
    public ResponseEntity<ApiResponse<Page<User>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
            ? Sort.by(sortBy).ascending()
            : Sort.by(sortBy).descending();

        Page<User> users = adminService.getAllUsers(PageRequest.of(page, size, sort));
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PatchMapping("/users/{id}/toggle-status")
    @Operation(summary = "Activate or suspend a user account")
    public ResponseEntity<ApiResponse<User>> toggleStatus(@PathVariable Long id) {
        User user = adminService.toggleUserStatus(id);
        String msg = user.getIsActive() ? "User activated" : "User suspended";
        return ResponseEntity.ok(ApiResponse.ok(msg, user));
    }
}

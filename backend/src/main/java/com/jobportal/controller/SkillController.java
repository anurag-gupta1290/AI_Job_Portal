package com.jobportal.controller;

import com.jobportal.dto.response.ApiResponse;
import com.jobportal.entity.Skill;
import com.jobportal.service.SkillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/skills")
@RequiredArgsConstructor
@Tag(name = "Skills", description = "Canonical skill taxonomy")
public class SkillController {

    private final SkillService skillService;

    @GetMapping("/search")
    @Operation(summary = "Search skills by name fragment")
    public ResponseEntity<ApiResponse<List<Skill>>> search(
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.ok(skillService.search(q)));
    }

    @GetMapping
    @Operation(summary = "Get all skills")
    public ResponseEntity<ApiResponse<List<Skill>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(skillService.getAll()));
    }
}

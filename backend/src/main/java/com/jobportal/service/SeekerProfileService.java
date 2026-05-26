package com.jobportal.service;

import com.jobportal.dto.request.SeekerDTOs.AddEducationRequest;
import com.jobportal.dto.request.SeekerDTOs.AddExperienceRequest;
import com.jobportal.dto.request.SeekerDTOs.AddSkillRequest;
import com.jobportal.dto.request.SeekerDTOs.UpdateProfileRequest;
import com.jobportal.dto.response.SeekerProfileResponse;
import com.jobportal.entity.*;
import com.jobportal.entity.enums.ProfileVisibility;
import com.jobportal.exception.BusinessException;
import com.jobportal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class SeekerProfileService {

    private final SeekerProfileRepository profileRepository;
    private final ExperienceRepository experienceRepository;
    private final EducationRepository educationRepository;
    private final ProfileSkillRepository profileSkillRepository;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public SeekerProfileResponse getOrCreateProfile(String email) {
        User user = findUser(email);
        SeekerProfile profile = profileRepository.findByUser(user).orElseGet(() -> {
            SeekerProfile p = SeekerProfile.builder()
                    .user(user)
                    .visibility(ProfileVisibility.PUBLIC)
                    .build();
            return profileRepository.save(p);
        });
        return toResponse(profile);
    }

    @Transactional
    public SeekerProfileResponse updateProfile(String email, UpdateProfileRequest req) {
        SeekerProfile profile = findProfile(email);

        if (req.getHeadline() != null) profile.setHeadline(req.getHeadline());
        if (req.getSummary() != null) profile.setSummary(req.getSummary());
        if (req.getLocation() != null) profile.setLocation(req.getLocation());
        if (req.getVisibility() != null) profile.setVisibility(req.getVisibility());
        if (req.getCurrentSalary() != null) profile.setCurrentSalary(req.getCurrentSalary());
        if (req.getExpectedSalary() != null) profile.setExpectedSalary(req.getExpectedSalary());
        if (req.getTotalExperience() != null) profile.setTotalExperience(req.getTotalExperience());
        if (req.getLinkedinUrl() != null) profile.setLinkedinUrl(req.getLinkedinUrl());
        if (req.getGithubUrl() != null) profile.setGithubUrl(req.getGithubUrl());
        if (req.getPortfolioUrl() != null) profile.setPortfolioUrl(req.getPortfolioUrl());
        if (req.getActivelyLooking() != null) profile.setActivelyLooking(req.getActivelyLooking());

        recalcScore(profile);
        return toResponse(profileRepository.save(profile));
    }

    @Transactional
    public String uploadResume(String email, MultipartFile file) {
        User user = findUser(email);
        SeekerProfile profile = findProfile(email);

        if (profile.getResumeUrl() != null) {
            fileStorageService.deleteFile(profile.getResumeUrl());
        }

        String url = fileStorageService.uploadResume(file, user.getId());
        profile.setResumeUrl(url);
        recalcScore(profile);
        profileRepository.save(profile);
        return url;
    }

    @Transactional
    public SeekerProfileResponse addExperience(String email, AddExperienceRequest req) {
        SeekerProfile profile = findProfile(email);

        Experience exp = Experience.builder()
                .profile(profile)
                .company(req.getCompany())
                .title(req.getTitle())
                .description(req.getDescription())
                .startDate(req.getStartDate())
                .endDate(Boolean.TRUE.equals(req.getIsCurrent()) ? null : req.getEndDate())
                .isCurrent(req.getIsCurrent())
                .build();

        experienceRepository.save(exp);
        recalcScore(profile);
        profileRepository.save(profile);
        return toResponse(profileRepository.findById(profile.getId()).orElseThrow());
    }

    @Transactional
    public void deleteExperience(String email, Long expId) {
        SeekerProfile profile = findProfile(email);
        if (!experienceRepository.existsByIdAndProfileId(expId, profile.getId())) {
            throw BusinessException.notFound("Experience not found");
        }
        experienceRepository.deleteById(expId);
        recalcScore(profile);
        profileRepository.save(profile);
    }

    @Transactional
    public SeekerProfileResponse addEducation(String email, AddEducationRequest req) {
        SeekerProfile profile = findProfile(email);

        Education edu = Education.builder()
                .profile(profile)
                .institution(req.getInstitution())
                .degree(req.getDegree())
                .field(req.getField())
                .year(req.getYear())
                .grade(req.getGrade())
                .build();

        educationRepository.save(edu);
        recalcScore(profile);
        profileRepository.save(profile);
        return toResponse(profileRepository.findById(profile.getId()).orElseThrow());
    }

    @Transactional
    public void deleteEducation(String email, Long eduId) {
        SeekerProfile profile = findProfile(email);
        if (!educationRepository.existsByIdAndProfileId(eduId, profile.getId())) {
            throw BusinessException.notFound("Education not found");
        }
        educationRepository.deleteById(eduId);
        recalcScore(profile);
        profileRepository.save(profile);
    }

    @Transactional
    public SeekerProfileResponse addOrUpdateSkill(String email, AddSkillRequest req) {
        SeekerProfile profile = findProfile(email);

        Skill skill = skillRepository.findById(req.getSkillId())
                .orElseThrow(() -> BusinessException.notFound("Skill not found"));

        profileSkillRepository.findByProfileIdAndSkillId(profile.getId(), skill.getId())
                .ifPresentOrElse(existing -> {
                    existing.setLevel(req.getLevel());
                    existing.setYears(req.getYears());
                    profileSkillRepository.save(existing);
                }, () -> {
                    ProfileSkill ps = ProfileSkill.builder()
                            .profile(profile)
                            .skill(skill)
                            .level(req.getLevel())
                            .years(req.getYears())
                            .build();
                    profileSkillRepository.save(ps);
                });

        recalcScore(profile);
        profileRepository.save(profile);
        return toResponse(profileRepository.findById(profile.getId()).orElseThrow());
    }

    @Transactional
    public void removeSkill(String email, Long skillId) {
        SeekerProfile profile = findProfile(email);
        if (!profileSkillRepository.existsByProfileIdAndSkillId(profile.getId(), skillId)) {
            throw BusinessException.notFound("Skill not in profile");
        }
        profileSkillRepository.deleteByProfileIdAndSkillId(profile.getId(), skillId);
        recalcScore(profile);
        profileRepository.save(profile);
    }

    // ── helpers ──────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
    }

    private SeekerProfile findProfile(String email) {
        User user = findUser(email);
        return profileRepository.findByUser(user)
                .orElseThrow(() -> BusinessException.notFound("Profile not found. GET /seeker/profile to create one."));
    }

    private void recalcScore(SeekerProfile p) {
        int score = 0;
        if (hasText(p.getHeadline()))    score += 15;
        if (hasText(p.getSummary()))     score += 15;
        if (hasText(p.getLocation()))    score += 5;
        if (hasText(p.getResumeUrl()))   score += 20;
        if (experienceRepository.countByProfileId(p.getId()) > 0)  score += 15;
        if (educationRepository.countByProfileId(p.getId()) > 0)   score += 15;
        if (profileSkillRepository.countByProfileId(p.getId()) > 0) score += 10;
        if (hasText(p.getLinkedinUrl())) score += 5;
        p.setCompletionScore(score);
    }

    private boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    public SeekerProfileResponse toResponse(SeekerProfile p) {
        return SeekerProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .fullName(p.getUser().getFullName())
                .email(p.getUser().getEmail())
                .headline(p.getHeadline())
                .summary(p.getSummary())
                .location(p.getLocation())
                .visibility(p.getVisibility())
                .resumeUrl(p.getResumeUrl())
                .currentSalary(p.getCurrentSalary())
                .expectedSalary(p.getExpectedSalary())
                .totalExperience(p.getTotalExperience())
                .linkedinUrl(p.getLinkedinUrl())
                .githubUrl(p.getGithubUrl())
                .portfolioUrl(p.getPortfolioUrl())
                .completionScore(p.getCompletionScore())
                .activelyLooking(p.getActivelyLooking())
                .experiences(p.getExperiences().stream()
                        .map(e -> SeekerProfileResponse.ExperienceDto.builder()
                                .id(e.getId())
                                .company(e.getCompany())
                                .title(e.getTitle())
                                .description(e.getDescription())
                                .startDate(e.getStartDate())
                                .endDate(e.getEndDate())
                                .isCurrent(e.getIsCurrent())
                                .build())
                        .toList())
                .educations(p.getEducations().stream()
                        .map(e -> SeekerProfileResponse.EducationDto.builder()
                                .id(e.getId())
                                .institution(e.getInstitution())
                                .degree(e.getDegree())
                                .field(e.getField())
                                .year(e.getYear())
                                .grade(e.getGrade())
                                .build())
                        .toList())
                .skills(p.getSkills().stream()
                        .map(s -> SeekerProfileResponse.ProfileSkillDto.builder()
                                .id(s.getId())
                                .skillId(s.getSkill().getId())
                                .skillName(s.getSkill().getName())
                                .skillCategory(s.getSkill().getCategory())
                                .level(s.getLevel())
                                .years(s.getYears())
                                .build())
                        .toList())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}

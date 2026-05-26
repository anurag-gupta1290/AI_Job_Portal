package com.jobportal.config;

import com.jobportal.entity.Skill;
import com.jobportal.entity.User;
import com.jobportal.repository.SkillRepository;
import com.jobportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final PasswordEncoder passwordEncoder;

    private static final List<String[]> CANONICAL_SKILLS = List.of(
        // Programming Languages
        new String[]{"Java", "Programming"},
        new String[]{"Python", "Programming"},
        new String[]{"JavaScript", "Programming"},
        new String[]{"TypeScript", "Programming"},
        new String[]{"C++", "Programming"},
        new String[]{"Go", "Programming"},
        new String[]{"Rust", "Programming"},
        new String[]{"Kotlin", "Programming"},
        // Frameworks
        new String[]{"Spring Boot", "Backend"},
        new String[]{"React", "Frontend"},
        new String[]{"Angular", "Frontend"},
        new String[]{"Vue.js", "Frontend"},
        new String[]{"Node.js", "Backend"},
        new String[]{"FastAPI", "Backend"},
        new String[]{"Django", "Backend"},
        new String[]{"Next.js", "Frontend"},
        // Data & AI
        new String[]{"Machine Learning", "AI/ML"},
        new String[]{"Deep Learning", "AI/ML"},
        new String[]{"TensorFlow", "AI/ML"},
        new String[]{"PyTorch", "AI/ML"},
        new String[]{"NLP", "AI/ML"},
        new String[]{"Data Analysis", "Data"},
        new String[]{"SQL", "Database"},
        new String[]{"NoSQL", "Database"},
        new String[]{"MongoDB", "Database"},
        new String[]{"PostgreSQL", "Database"},
        new String[]{"Redis", "Database"},
        // DevOps & Cloud
        new String[]{"Docker", "DevOps"},
        new String[]{"Kubernetes", "DevOps"},
        new String[]{"AWS", "Cloud"},
        new String[]{"Azure", "Cloud"},
        new String[]{"GCP", "Cloud"},
        new String[]{"CI/CD", "DevOps"},
        new String[]{"Git", "DevOps"},
        // Soft Skills / Management
        new String[]{"Agile", "Management"},
        new String[]{"Scrum", "Management"},
        new String[]{"Project Management", "Management"},
        new String[]{"Communication", "Soft Skills"},
        new String[]{"Problem Solving", "Soft Skills"},
        new String[]{"Leadership", "Soft Skills"}
    );

    @Override
    public void run(String... args) {
        seedAdmin();
        seedSkills();
    }

    private void seedAdmin() {
        String adminEmail = "admin@jobportal.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                .fullName("Platform Admin")
                .email(adminEmail)
                .passwordHash(passwordEncoder.encode("Admin@1234"))
                .role(User.Role.ROLE_ADMIN)
                .isActive(true)
                .isEmailVerified(true)
                .build();
            userRepository.save(admin);
            log.info("Admin user seeded: {} (password: Admin@1234)", adminEmail);
        }
    }

    private void seedSkills() {
        int count = 0;
        for (String[] skill : CANONICAL_SKILLS) {
            if (!skillRepository.existsByNameIgnoreCase(skill[0])) {
                skillRepository.save(Skill.builder()
                    .name(skill[0])
                    .category(skill[1])
                    .build());
                count++;
            }
        }
        if (count > 0) {
            log.info("Seeded {} canonical skills", count);
        }
    }
}

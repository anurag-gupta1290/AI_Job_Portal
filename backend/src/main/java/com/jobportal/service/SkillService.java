package com.jobportal.service;

import com.jobportal.entity.Skill;
import com.jobportal.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;

    public List<Skill> search(String query) {
        if (query == null || query.isBlank()) {
            return skillRepository.findAll();
        }
        return skillRepository.findByNameContainingIgnoreCase(query);
    }

    public List<Skill> getAll() {
        return skillRepository.findAll();
    }
}

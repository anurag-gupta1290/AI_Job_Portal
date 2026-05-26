package com.jobportal.repository;

import com.jobportal.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    Optional<Certificate> findByEnrolmentId(Long enrolmentId);
}

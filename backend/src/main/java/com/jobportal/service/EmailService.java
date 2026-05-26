package com.jobportal.service;

import com.jobportal.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    @Value("${app.mail.from-name}")
    private String fromName;

    @Async
    public void sendVerificationEmail(User user) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(user.getEmail());
            message.setSubject("Verify your JobPortal account");
            message.setText(String.format("""
                Hi %s,
                
                Welcome to JobPortal! Please verify your email address.
                
                (In production, include a verification link here.)
                
                Thank you,
                The JobPortal Team
                """, user.getFullName()));
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send verification email to {}: {}", user.getEmail(), e.getMessage());
        }
    }

    @Async
    public void sendApplicationStatusEmail(String toEmail, String seekerName,
                                            String jobTitle, String newStatus) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(toEmail);
            message.setSubject("Application Update: " + jobTitle);
            message.setText(String.format("""
                Hi %s,
                
                Your application for "%s" has been updated to: %s
                
                Log in to your dashboard to view full details.
                
                Best regards,
                The JobPortal Team
                """, seekerName, jobTitle, newStatus));
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send status email to {}: {}", toEmail, e.getMessage());
        }
    }
}

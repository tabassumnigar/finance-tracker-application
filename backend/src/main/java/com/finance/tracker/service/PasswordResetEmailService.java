package com.finance.tracker.service;

import com.finance.tracker.entity.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class PasswordResetEmailService {
    private static final Logger log = LoggerFactory.getLogger(PasswordResetEmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:}")
    private String mailFrom;

    @Value("${app.auth.reset-base-url:http://localhost:5173/reset-password}")
    private String resetBaseUrl;

    public boolean sendResetLink(User user, String token) {
        if (mailFrom == null || mailFrom.isBlank()) {
            log.warn("Password reset email skipped because app.mail.from is not configured");
            return false;
        }

        try {
            String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
            String resetUrl = "%s?token=%s".formatted(resetBaseUrl, encodedToken);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(user.getEmail());
            message.setSubject("Finance Tracker password reset");
            message.setText("""
                Hello %s,

                We received a request to reset your Finance Tracker password.

                Open this link to choose a new password:
                %s

                If you did not request this, you can ignore this email.
                """.formatted(
                user.getDisplayName() != null && !user.getDisplayName().isBlank() ? user.getDisplayName() : "there",
                resetUrl
            ));

            mailSender.send(message);
            return true;
        } catch (Exception ex) {
            log.warn("Unable to send password reset email to {}", user.getEmail(), ex);
            return false;
        }
    }
}

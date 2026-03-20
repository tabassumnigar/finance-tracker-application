package com.finance.tracker.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Provide a valid email")
    String email
) {}

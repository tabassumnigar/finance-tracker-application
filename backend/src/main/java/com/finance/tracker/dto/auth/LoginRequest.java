package com.finance.tracker.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    String email,
    @NotBlank(message = "Password cannot be blank")
    String password
) {}

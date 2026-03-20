package com.finance.tracker.dto.auth;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @JsonAlias("displayName")
    @NotBlank(message = "Display name is required")
    String displayName,
    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    String email,
    @NotBlank(message = "Password cannot be blank")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).+$",
        message = "Password must include uppercase, lowercase, and a number")
    String password
) {}

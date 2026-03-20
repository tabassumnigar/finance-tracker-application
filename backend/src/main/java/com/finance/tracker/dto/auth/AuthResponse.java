package com.finance.tracker.dto.auth;

public record AuthResponse(String accessToken, String refreshToken, long refreshExpiresAt) {}

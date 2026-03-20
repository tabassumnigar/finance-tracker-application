package com.finance.tracker.service;

import com.finance.tracker.dto.auth.AuthResponse;
import com.finance.tracker.dto.auth.ForgotPasswordRequest;
import com.finance.tracker.dto.auth.ForgotPasswordResponse;
import com.finance.tracker.dto.auth.LoginRequest;
import com.finance.tracker.dto.auth.RefreshTokenRequest;
import com.finance.tracker.dto.auth.RegisterRequest;
import com.finance.tracker.dto.auth.ResetPasswordRequest;
import com.finance.tracker.entity.PasswordResetToken;
import com.finance.tracker.entity.RefreshToken;
import com.finance.tracker.entity.User;
import com.finance.tracker.exception.BadRequestException;
import com.finance.tracker.exception.ConflictException;
import com.finance.tracker.exception.UnauthorizedException;
import com.finance.tracker.repository.PasswordResetTokenRepository;
import com.finance.tracker.repository.RefreshTokenRepository;
import com.finance.tracker.repository.UserRepository;
import com.finance.tracker.security.JwtService;
import com.finance.tracker.util.UuidUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final String FORGOT_PASSWORD_MESSAGE =
        "If the email exists, password reset instructions have been issued.";

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final CategoryService categoryService;
    private final PasswordResetEmailService passwordResetEmailService;

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    @Value("${app.auth.password-reset-expiration-ms:3600000}")
    private long passwordResetExpirationMs;

    @Value("${app.auth.expose-reset-token:false}")
    private boolean exposeResetToken;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        log.debug("Register request for {}", normalizedEmail);
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ConflictException("Email already registered");
        }
        User user = new User();
        user.setEmail(normalizedEmail);
        user.setDisplayName(request.displayName().trim());
        user.setPassword(passwordEncoder.encode(request.password()));
        User saved = userRepository.save(user);
        categoryService.ensureDefaultCategories(saved);
        return buildAuthResponse(saved);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.password()));
        } catch (Exception ex) {
            throw new UnauthorizedException("Invalid credentials");
        }
        User user = userRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
            .filter(token -> !token.isRevoked() && token.getExpiresAt().isAfter(OffsetDateTime.now()))
            .orElseThrow(() -> new BadRequestException("Invalid or expired refresh token"));
        refreshToken.setToken(UuidUtils.random());
        refreshToken.setExpiresAt(OffsetDateTime.now().plus(Duration.ofMillis(refreshExpirationMs)));
        RefreshToken updated = refreshTokenRepository.save(refreshToken);
        String jwt = jwtService.generateToken(updated.getUser());
        return new AuthResponse(jwt, updated.getToken(), updated.getExpiresAt().toEpochSecond());
    }

    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenRepository.findByToken(request.getRefreshToken()).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        final String[] issuedToken = {null};
        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {
            expirePasswordResetTokens(user);
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUser(user);
            resetToken.setToken(UuidUtils.random());
            resetToken.setExpiresAt(OffsetDateTime.now().plus(Duration.ofMillis(passwordResetExpirationMs)));
            passwordResetTokenRepository.save(resetToken);
            issuedToken[0] = resetToken.getToken();
            boolean emailSent = passwordResetEmailService.sendResetLink(user, resetToken.getToken());
            if (!emailSent) {
                log.warn("Password reset link could not be emailed for {}", normalizedEmail);
            }
            log.info("Password reset token issued for {}", normalizedEmail);
        });
        return new ForgotPasswordResponse(
            FORGOT_PASSWORD_MESSAGE,
            exposeResetToken ? issuedToken[0] : null);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.token())
            .filter(token -> token.getUsedAt() == null)
            .filter(token -> token.getExpiresAt().isAfter(OffsetDateTime.now()))
            .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        OffsetDateTime now = OffsetDateTime.now();
        resetToken.setUsedAt(now);
        passwordResetTokenRepository.save(resetToken);
        expirePasswordResetTokens(user);
        revokeActiveRefreshTokens(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        RefreshToken refreshToken = createRefreshToken(user);
        String accessToken = jwtService.generateToken(user);
        return new AuthResponse(accessToken, refreshToken.getToken(), refreshToken.getExpiresAt().toEpochSecond());
    }

    private RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(UuidUtils.random());
        refreshToken.setExpiresAt(OffsetDateTime.now().plus(Duration.ofMillis(refreshExpirationMs)));
        refreshToken.setRevoked(false);
        return refreshTokenRepository.save(refreshToken);
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private void expirePasswordResetTokens(User user) {
        OffsetDateTime now = OffsetDateTime.now();
        passwordResetTokenRepository.findAllByUserAndUsedAtIsNull(user).forEach(token -> {
            token.setUsedAt(now);
            passwordResetTokenRepository.save(token);
        });
    }

    private void revokeActiveRefreshTokens(User user) {
        refreshTokenRepository.findAllByUserAndRevokedFalse(user).forEach(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }
}

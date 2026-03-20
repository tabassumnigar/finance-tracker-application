package com.finance.tracker.service;

import com.finance.tracker.dto.auth.AuthResponse;
import com.finance.tracker.dto.auth.LoginRequest;
import com.finance.tracker.dto.auth.RegisterRequest;
import com.finance.tracker.entity.RefreshToken;
import com.finance.tracker.entity.User;
import com.finance.tracker.repository.PasswordResetTokenRepository;
import com.finance.tracker.repository.RefreshTokenRepository;
import com.finance.tracker.repository.UserRepository;
import com.finance.tracker.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private AuthService authService;

    @Test
    void registerPersistsNormalizedUserAndSeedsDefaults() {
        RegisterRequest request = new RegisterRequest("Sandesh", "  USER@Example.com ", "Password1");

        when(userRepository.existsByEmail("user@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password1")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> {
            RefreshToken token = invocation.getArgument(0);
            token.setId(99L);
            token.setExpiresAt(OffsetDateTime.now().plusDays(7));
            return token;
        });
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt-token");

        AuthResponse response = authService.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User persistedUser = userCaptor.getValue();

        assertThat(persistedUser.getEmail()).isEqualTo("user@example.com");
        assertThat(persistedUser.getDisplayName()).isEqualTo("Sandesh");
        assertThat(persistedUser.getPassword()).isEqualTo("encoded-password");
        assertThat(response.accessToken()).isEqualTo("jwt-token");
        assertThat(response.refreshToken()).isNotBlank();
        verify(categoryService).ensureDefaultCategories(persistedUser);
    }

    @Test
    void loginAuthenticatesAndReturnsTokensForNormalizedEmail() {
        LoginRequest request = new LoginRequest(" USER@Example.com ", "Password1");
        User user = new User();
        user.setId(15L);
        user.setEmail("user@example.com");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> {
            RefreshToken token = invocation.getArgument(0);
            token.setId(42L);
            token.setExpiresAt(OffsetDateTime.now().plusDays(7));
            return token;
        });
        when(jwtService.generateToken(user)).thenReturn("jwt-token");

        AuthResponse response = authService.login(request);

        verify(authenticationManager).authenticate(
            new UsernamePasswordAuthenticationToken("user@example.com", "Password1"));
        assertThat(response.accessToken()).isEqualTo("jwt-token");
        assertThat(response.refreshToken()).isNotBlank();
    }
}

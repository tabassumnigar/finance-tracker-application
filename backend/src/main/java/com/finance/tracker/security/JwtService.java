package com.finance.tracker.security;

import com.finance.tracker.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Base64;
import java.util.Date;

@Service
public class JwtService {
    @Value("${app.jwt.secret:change-me-secret}")
    private String secretKey;

    @Value("${app.jwt.expiration-ms:900000}")
    private long expirationMs;

    private Key key;

    @PostConstruct
    public void init() {
        byte[] keyBytes;
        try {
            keyBytes = java.util.Base64.getDecoder().decode(secretKey);
        } catch (IllegalArgumentException ex) {
            keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        }
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                "JWT secret must be at least 32 bytes when decoded. Update app.jwt.secret with a longer value.");
        }
        key = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(User user) {
        var now = new Date();
        var expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
            .setSubject(user.getEmail())
            .setIssuedAt(now)
            .setExpiration(expiry)
            .signWith(key, SignatureAlgorithm.HS256)
            .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    public String extractUsername(String token) {
        var claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
        return claims.getBody().getSubject();
    }
}

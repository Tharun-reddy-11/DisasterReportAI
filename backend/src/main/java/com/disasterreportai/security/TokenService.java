package com.disasterreportai.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Service
public class TokenService {
  private final byte[] secret;

  public TokenService(@Value("${app.jwt-secret}") String s) {
    secret = Arrays.copyOf(s.getBytes(StandardCharsets.UTF_8), 32);
  }

  public String issue(Long id, String role) {
    return Jwts.builder()
        .subject(id.toString())
        .claim("role", role)
        .issuedAt(Date.from(Instant.now()))
        .expiration(Date.from(Instant.now().plusSeconds(28800)))
        .signWith(Keys.hmacShaKeyFor(secret))
        .compact();
  }

  public Long subject(String token) {
    return Long.valueOf(Jwts.parser()
        .verifyWith(Keys.hmacShaKeyFor(secret))
        .build()
        .parseSignedClaims(token)
        .getPayload()
        .getSubject());
  }

  public String role(String token) {
    Object roleClaim = Jwts.parser()
        .verifyWith(Keys.hmacShaKeyFor(secret))
        .build()
        .parseSignedClaims(token)
        .getPayload()
        .get("role");
    return roleClaim != null ? roleClaim.toString() : "CITIZEN";
  }
}

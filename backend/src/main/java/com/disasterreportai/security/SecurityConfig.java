package com.disasterreportai.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class SecurityConfig {

  @Bean
  SecurityFilterChain chain(HttpSecurity http, TokenService tokens) throws Exception {
    return http.csrf(c -> c.disable())
        .cors(c -> {})
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(a -> a
            .requestMatchers("/api/auth/**", "/api/health", "/actuator/**", "/error").permitAll()
            .requestMatchers("/api/official/**").hasAnyRole("AUTHORITY", "ADMIN")
            .anyRequest().authenticated()
        )
        .addFilterBefore(new JwtFilter(tokens), UsernamePasswordAuthenticationFilter.class)
        .build();
  }

  @Bean
  CorsConfigurationSource cors(@org.springframework.beans.factory.annotation.Value("${app.frontend-origin}") String origin) {
    var c = new CorsConfiguration();
    c.setAllowedOrigins(List.of(origin, "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"));
    c.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    c.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));
    var s = new UrlBasedCorsConfigurationSource();
    s.registerCorsConfiguration("/**", c);
    return s;
  }

  static class JwtFilter extends OncePerRequestFilter {
    final TokenService tokens;
    JwtFilter(TokenService t) { tokens = t; }

    @Override
    protected void doFilterInternal(HttpServletRequest r, HttpServletResponse p, FilterChain c)
        throws ServletException, IOException {
      String h = r.getHeader("Authorization");
      if (h != null && h.startsWith("Bearer ")) {
        try {
          String jwt = h.substring(7);
          Long id = tokens.subject(jwt);
          String roleName = tokens.role(jwt);
          List<SimpleGrantedAuthority> authorities = new ArrayList<>();
          authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
          authorities.add(new SimpleGrantedAuthority("ROLE_" + roleName.toUpperCase()));
          SecurityContextHolder.getContext().setAuthentication(
              new UsernamePasswordAuthenticationToken(id, null, authorities)
          );
        } catch (Exception ignored) {}
      }
      c.doFilter(r, p);
    }
  }
}

package com.campusclubs.config;

import com.campusclubs.security.JwtAuthFilter;
import com.campusclubs.security.RateLimitFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter  jwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;

    @Value("${app.cors.allowed-origins}")
    private String[] allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // ── Public ──────────────────────────────────────────────
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/api-docs/**", "/swagger-ui.html").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/clubs", "/api/clubs/{id}").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/events/approved").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/posts", "/api/posts/club/{clubId}").permitAll()

                // ── Admin-only (MUST come before broader coordinator rules) ──
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/clubs/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/clubs/*/coordinator").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/clubs/*/advisor").hasRole("ADMIN")

                // ── Coordinator & above ──────────────────────────────────
                .requestMatchers("/api/coordinator/**").hasAnyRole("COORDINATOR", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/events/*/review").hasAnyRole("COORDINATOR", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/clubs/*/members/*/approve").hasAnyRole("COORDINATOR", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/clubs/*/members/*/reject").hasAnyRole("COORDINATOR", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/clubs/*").hasAnyRole("COORDINATOR", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/events/**").hasAnyRole("COORDINATOR", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/posts/**").hasAnyRole("STUDENT", "COORDINATOR", "ADVISOR", "ADMIN")

                // ── All authenticated users ──────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/notifications/**").authenticated()
                .requestMatchers("/api/clubs/*/join").hasAnyRole("STUDENT", "COORDINATOR", "ADVISOR", "ADMIN")
                .requestMatchers("/api/events/*/register").hasAnyRole("STUDENT", "COORDINATOR", "ADVISOR", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/posts").hasAnyRole("STUDENT", "COORDINATOR", "ADVISOR", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/events").hasAnyRole("STUDENT", "COORDINATOR", "ADVISOR", "ADMIN")

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(rateLimitFilter, JwtAuthFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins));
        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}

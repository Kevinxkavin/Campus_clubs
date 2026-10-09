package com.campusclubs.security;

import io.github.bucket4j.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-IP rate limiting using Bucket4j (in-memory).
 *
 * Auth endpoints  → 10 requests / 10 s
 * All other APIs  → 60 requests / 10 s
 */
@Slf4j
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // IP → Bucket
    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> apiBuckets  = new ConcurrentHashMap<>();

    private Bucket authBucket(String ip) {
        return authBuckets.computeIfAbsent(ip, k ->
            Bucket.builder()
                .addLimit(Bandwidth.classic(10, Refill.intervally(10, Duration.ofSeconds(10))))
                .build());
    }

    private Bucket apiBucket(String ip) {
        return apiBuckets.computeIfAbsent(ip, k ->
            Bucket.builder()
                .addLimit(Bandwidth.classic(60, Refill.intervally(60, Duration.ofSeconds(10))))
                .build());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String ip   = getClientIp(request);
        String path = request.getRequestURI();

        boolean isAuth   = path.startsWith("/api/auth/");
        boolean isSwagger = path.startsWith("/swagger") || path.startsWith("/api-docs");

        if (isSwagger) { chain.doFilter(request, response); return; }

        Bucket bucket = isAuth ? authBucket(ip) : apiBucket(ip);

        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for IP {} on path {}", ip, path);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"success\":false,\"message\":\"Too many requests. Please slow down and try again.\"}");
        }
    }

    private String getClientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        return (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : req.getRemoteAddr();
    }
}

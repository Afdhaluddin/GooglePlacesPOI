package com.cards.places.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Logs REQUEST and RESPONSE info (method, URI, body, status, duration)
 * for every API call. Bodies are captured via content-caching wrappers so
 * the underlying stream can still be read by the dispatcher/servlet.
 */
@Component
public class RequestResponseLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger("API_LOG");
    private static final int MAX_BODY_LOG = 1000;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        long startTime = System.currentTimeMillis();
        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
        } finally {
            long duration = System.currentTimeMillis() - startTime;

            String requestBody = getBodyAsString(wrappedRequest.getContentAsByteArray());
            log.info("REQUEST  | method={} uri={} query={} body={}",
                    request.getMethod(),
                    request.getRequestURI(),
                    request.getQueryString() == null ? "" : request.getQueryString(),
                    truncate(requestBody));

            String responseBody = getBodyAsString(wrappedResponse.getContentAsByteArray());
            log.info("RESPONSE | method={} uri={} status={} durationMs={} body={}",
                    request.getMethod(),
                    request.getRequestURI(),
                    wrappedResponse.getStatus(),
                    duration,
                    truncate(responseBody));

            // Important: copy cached body back to the real response.
            wrappedResponse.copyBodyToResponse();
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/");
    }

    private String getBodyAsString(byte[] content) {
        if (content == null || content.length == 0) {
            return "";
        }
        return new String(content, StandardCharsets.UTF_8).replaceAll("\\s+", " ").trim();
    }

    private String truncate(String body) {
        if (body == null) {
            return "";
        }
        return body.length() <= MAX_BODY_LOG ? body : body.substring(0, MAX_BODY_LOG) + "...";
    }
}

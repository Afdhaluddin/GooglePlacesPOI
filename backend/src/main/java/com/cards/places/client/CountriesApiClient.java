package com.cards.places.client;

import com.cards.places.dto.CountryInfoResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Non-blocking client for the api.first.org countries API, wrapped with
 * Resilience4j retry + circuit breaker + rate limiter. The MVC controller
 * path blocks on the reactive call with a 5s timeout.
 */
@Component
public class CountriesApiClient {

    private static final Logger log = LoggerFactory.getLogger(CountriesApiClient.class);

    private final WebClient webClient;
    private final long timeoutMs;

    public CountriesApiClient(WebClient countriesWebClient,
                              @Value("${countries-api.timeout-ms:5000}") long timeoutMs) {
        this.webClient = countriesWebClient;
        this.timeoutMs = timeoutMs;
    }

    @Retry(name = "countriesApi")
    @CircuitBreaker(name = "countriesApi", fallbackMethod = "fetchAllCountriesFallback")
    @RateLimiter(name = "countriesApi")
    public List<CountryInfoResponse.CountrySummary> fetchAllCountries() {
        log.info("Calling external API: /data/v1/countries");
        Map<String, Object> body = webClient.get()
                .uri("/data/v1/countries")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block(Duration.ofMillis(timeoutMs));

        if (body == null || !(body.get("data") instanceof Map<?, ?> data)) {
            return List.of();
        }
        // data shape: { "MY": {"country": "Malaysia", "region": "Asia"}, ... }
        List<CountryInfoResponse.CountrySummary> result = new ArrayList<>();
        for (Map.Entry<?, ?> entry : data.entrySet()) {
            if (entry.getValue() instanceof Map<?, ?> country) {
                Object name = country.get("country");
                Object region = country.get("region");
                result.add(new CountryInfoResponse.CountrySummary(
                        name != null ? name.toString() : null,
                        entry.getKey() != null ? entry.getKey().toString() : null,
                        region != null ? region.toString() : null));
            }
        }
        return result;
    }

    /**
     * Graceful degradation: when the external API is down / circuit is open /
     * rate limit exceeded, return a small static sample instead of failing.
     */
    @SuppressWarnings("unused")
    private List<CountryInfoResponse.CountrySummary> fetchAllCountriesFallback(Throwable t) {
        log.warn("Countries API fallback triggered ({}); returning static sample", t.toString());
        return List.of(
                new CountryInfoResponse.CountrySummary("Malaysia", "MY", "Asia"),
                new CountryInfoResponse.CountrySummary("Singapore", "SG", "Asia"),
                new CountryInfoResponse.CountrySummary("Indonesia", "ID", "Asia"));
    }
}

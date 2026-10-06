package com.cards.places.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

/**
 * Caffeine-backed Spring Cache. The cache manager is auto-configured from
 * spring.cache.caffeine.spec in application.yml (10 minute TTL).
 */
@Configuration
@EnableCaching
public class CacheConfig {
}

package com.cards.places.dto;

import java.util.List;

/**
 * Trimmed response for the nested third-party API call (api.first.org countries API).
 * Carries the place this info was fetched for, plus a small projection of
 * the external API payload.
 */
public class CountryInfoResponse {

    private Long placeId;
    private String placeName;
    private String matchedBy;
    private List<CountrySummary> countries;

    public CountryInfoResponse(Long placeId, String placeName, String matchedBy,
                               List<CountrySummary> countries) {
        this.placeId = placeId;
        this.placeName = placeName;
        this.matchedBy = matchedBy;
        this.countries = countries;
    }

    public Long getPlaceId() {
        return placeId;
    }

    public String getPlaceName() {
        return placeName;
    }

    public String getMatchedBy() {
        return matchedBy;
    }

    public List<CountrySummary> getCountries() {
        return countries;
    }

    public static class CountrySummary {
        private String name;
        private String cca2;
        private String region;

        public CountrySummary(String name, String cca2, String region) {
            this.name = name;
            this.cca2 = cca2;
            this.region = region;
        }

        public String getName() {
            return name;
        }

        public String getCca2() {
            return cca2;
        }

        public String getRegion() {
            return region;
        }
    }
}

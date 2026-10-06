package com.cards.places.service;

import com.cards.places.client.CountriesApiClient;
import com.cards.places.dto.CountryInfoResponse;
import com.cards.places.dto.PlaceRequest;
import com.cards.places.dto.PlaceResponse;
import com.cards.places.exception.ResourceNotFoundException;
import com.cards.places.model.Place;
import com.cards.places.model.User;
import com.cards.places.repository.PlaceRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlaceService {

    private final PlaceRepository placeRepository;
    private final CountriesApiClient countriesApiClient;
    private final CurrentUserService currentUserService;

    public PlaceService(PlaceRepository placeRepository,
                        CountriesApiClient countriesApiClient,
                        CurrentUserService currentUserService) {
        this.placeRepository = placeRepository;
        this.countriesApiClient = countriesApiClient;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public PlaceResponse create(PlaceRequest request) {
        Place place = new Place();
        applyRequest(place, request);
        place.setUser(currentUserService.getCurrentUser());
        Place saved = placeRepository.save(place);
        return PlaceResponse.fromEntity(saved);
    }

    @Transactional
    public PlaceResponse update(Long id, PlaceRequest request) {
        Place place = findOwnedPlace(id);
        applyRequest(place, request);
        Place saved = placeRepository.save(place);
        return PlaceResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public PlaceResponse getById(Long id) {
        return PlaceResponse.fromEntity(findOwnedPlace(id));
    }

    @Transactional(readOnly = true)
    public Page<PlaceResponse> getAll(Pageable pageable) {
        User user = currentUserService.getCurrentUser();
        return placeRepository.findAllByUserId(user.getId(), pageable)
                .map(PlaceResponse::fromEntity);
    }

    @Transactional
    public void delete(Long id) {
        placeRepository.delete(findOwnedPlace(id));
    }

    /**
     * Nested third-party API call: reads the place from the DB, then calls the
     * public countries API at api.first.org via a resilient non-blocking
     * WebClient and returns a trimmed projection of the external payload.
     * Results are cached per place id (Caffeine, 10 min TTL).
     */
    @Cacheable(cacheNames = "countryInfo", key = "#id")
    @Transactional(readOnly = true)
    public CountryInfoResponse getCountryInfo(Long id) {
        Place place = findOwnedPlace(id);

        String countryGuess = extractLastSegment(place.getAddress());
        List<CountryInfoResponse.CountrySummary> all = countriesApiClient.fetchAllCountries();

        // Prefer entries whose name matches the country segment of the address;
        // fall back to a small sample of the full list when nothing matches.
        List<CountryInfoResponse.CountrySummary> matched = all.stream()
                .filter(c -> c.getName() != null && countryGuess != null
                        && c.getName().toLowerCase().contains(countryGuess.toLowerCase()))
                .toList();
        List<CountryInfoResponse.CountrySummary> countries =
                !matched.isEmpty() ? matched : all.stream().limit(5).toList();

        return new CountryInfoResponse(place.getId(), place.getName(), countryGuess, countries);
    }

    /**
     * Loads a place and enforces ownership: a place belonging to another user
     * is reported as not found (avoids leaking existence across users).
     */
    private Place findOwnedPlace(Long id) {
        User user = currentUserService.getCurrentUser();
        return placeRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + id));
    }

    private String extractLastSegment(String address) {
        if (address == null || address.isBlank()) {
            return "";
        }
        String[] parts = address.split(",");
        return parts[parts.length - 1].trim();
    }

    private void applyRequest(Place place, PlaceRequest request) {
        place.setName(request.getName());
        place.setAddress(request.getAddress());
        place.setLatitude(request.getLatitude());
        place.setLongitude(request.getLongitude());
        place.setGooglePlaceId(request.getGooglePlaceId());
        place.setFavourite(request.isFavourite());
    }
}

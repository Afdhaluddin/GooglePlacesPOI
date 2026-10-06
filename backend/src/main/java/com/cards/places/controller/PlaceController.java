package com.cards.places.controller;

import com.cards.places.dto.CountryInfoResponse;
import com.cards.places.dto.PlaceRequest;
import com.cards.places.dto.PlaceResponse;
import com.cards.places.service.PlaceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/places")
public class PlaceController {

    private final PlaceService placeService;

    public PlaceController(PlaceService placeService) {
        this.placeService = placeService;
    }

    @PostMapping
    public ResponseEntity<PlaceResponse> create(@Valid @RequestBody PlaceRequest request) {
        PlaceResponse created = placeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlaceResponse> update(@PathVariable Long id,
                                                @Valid @RequestBody PlaceRequest request) {
        return ResponseEntity.ok(placeService.update(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaceResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(placeService.getById(id));
    }

    /**
     * Paginated list, 10 records per page by default. Spring's Page is
     * serialized with content, page number, size, totalElements and
     * totalPages metadata.
     */
    @GetMapping
    public ResponseEntity<Page<PlaceResponse>> getAll(
            @PageableDefault(page = 0, size = 10) Pageable pageable) {
        return ResponseEntity.ok(placeService.getAll(pageable));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        placeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Demonstrates a nested third-party API call: this endpoint loads the
     * place, then calls the api.first.org countries API and returns a trimmed result.
     */
    @GetMapping("/{id}/country-info")
    public ResponseEntity<CountryInfoResponse> getCountryInfo(@PathVariable Long id) {
        return ResponseEntity.ok(placeService.getCountryInfo(id));
    }
}

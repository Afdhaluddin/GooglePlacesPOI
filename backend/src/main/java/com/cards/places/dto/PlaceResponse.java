package com.cards.places.dto;

import com.cards.places.model.Place;

import java.time.LocalDateTime;

/**
 * Outbound DTO for a place.
 */
public class PlaceResponse {

    private Long id;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private String googlePlaceId;
    private boolean favourite;
    private LocalDateTime createdAt;

    public static PlaceResponse fromEntity(Place place) {
        PlaceResponse response = new PlaceResponse();
        response.setId(place.getId());
        response.setName(place.getName());
        response.setAddress(place.getAddress());
        response.setLatitude(place.getLatitude());
        response.setLongitude(place.getLongitude());
        response.setGooglePlaceId(place.getGooglePlaceId());
        response.setFavourite(place.isFavourite());
        response.setCreatedAt(place.getCreatedAt());
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getGooglePlaceId() {
        return googlePlaceId;
    }

    public void setGooglePlaceId(String googlePlaceId) {
        this.googlePlaceId = googlePlaceId;
    }

    public boolean isFavourite() {
        return favourite;
    }

    public void setFavourite(boolean favourite) {
        this.favourite = favourite;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

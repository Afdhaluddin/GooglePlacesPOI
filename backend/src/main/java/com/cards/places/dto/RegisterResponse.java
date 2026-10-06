package com.cards.places.dto;

import com.cards.places.model.User;

/**
 * Outbound DTO for a successful registration (never exposes the password).
 */
public class RegisterResponse {

    private Long id;
    private String username;

    public RegisterResponse(Long id, String username) {
        this.id = id;
        this.username = username;
    }

    public static RegisterResponse fromEntity(User user) {
        return new RegisterResponse(user.getId(), user.getUsername());
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }
}

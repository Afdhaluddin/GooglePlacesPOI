package com.cards.places.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Inbound DTO for register and login.
 */
public class AuthRequest {

    @NotBlank(message = "username is required")
    @Size(max = 100, message = "username must be at most 100 characters")
    private String username;

    @NotBlank(message = "password is required")
    @Size(min = 6, max = 72, message = "password must be between 6 and 72 characters")
    private String password;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

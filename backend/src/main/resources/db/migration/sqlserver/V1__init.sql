-- SQL Server schema for Favourite Places (matches JPA entities, ddl-auto=validate)

CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(100) NOT NULL,
    password NVARCHAR(100) NOT NULL,
    CONSTRAINT uq_users_username UNIQUE (username)
);

CREATE TABLE places (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    address NVARCHAR(500) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    google_place_id NVARCHAR(300) NULL,
    favourite BIT NOT NULL,
    created_at DATETIME2 NOT NULL,
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_places_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT uq_places_user_google_place UNIQUE (user_id, google_place_id)
);

CREATE INDEX idx_places_google_place_id ON places (google_place_id);
CREATE INDEX idx_places_created_at ON places (created_at);
CREATE INDEX idx_places_user_id ON places (user_id);

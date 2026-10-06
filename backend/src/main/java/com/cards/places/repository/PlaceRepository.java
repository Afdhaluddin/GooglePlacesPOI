package com.cards.places.repository;

import com.cards.places.model.Place;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlaceRepository extends JpaRepository<Place, Long> {

    Page<Place> findAllByUserId(Long userId, Pageable pageable);

    Optional<Place> findByIdAndUserId(Long id, Long userId);
}

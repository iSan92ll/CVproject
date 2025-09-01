package com.curriculum.cv_backend.repository;

import com.curriculum.cv_backend.model.CVHabilidades;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CVHabilidadesRepository extends JpaRepository<CVHabilidades, Long> {
}
package com.curriculum.cv_backend.repository;

import com.curriculum.cv_backend.model.CV;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CVRepository extends JpaRepository<CV, Long> { }

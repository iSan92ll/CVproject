package com.curriculum.cv_backend.service;

import com.curriculum.cv_backend.model.CV;
import com.curriculum.cv_backend.repository.CVRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CVService {
    private final CVRepository repo;
    public CVService(CVRepository repo) { this.repo = repo; }

    public CV save(CV cv){ return repo.save(cv); }
    public List<CV> findAll(){ return repo.findAll(); }
    public CV findById(Long id){ return repo.findById(id).orElse(null); }
    public void delete(Long id){ repo.deleteById(id); }
}

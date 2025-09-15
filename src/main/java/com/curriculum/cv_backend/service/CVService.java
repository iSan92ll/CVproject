package com.curriculum.cv_backend.service;

import com.curriculum.cv_backend.model.CV;
import com.curriculum.cv_backend.repository.CVRepository;
import com.curriculum.cv_backend.repository.CVHabilidadesRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CVService {

    private final CVRepository cvRepo;

    public CVService(CVRepository cvRepo, CVHabilidadesRepository habilidadesRepo) {
        this.cvRepo = cvRepo;
    }

    public CV save(CV cv) {
        if (cv.getHabilidades() != null) {
            cv.getHabilidades().setCv(cv);
        }
        return cvRepo.save(cv);
    }

    public List<CV> findAll() {
        return cvRepo.findAll();
    }

    public CV findById(Long id) {
        return cvRepo.findById(id).orElse(null);
    }

    public void delete(Long id) {
        cvRepo.deleteById(id);
    }
}

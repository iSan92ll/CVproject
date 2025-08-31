package com.curriculum.cv_backend.controller;

import com.curriculum.cv_backend.model.CV;
import com.curriculum.cv_backend.service.CVService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/cv")
public class CVController {
    private final CVService service;

    public CVController(CVService service) {
        this.service = service;
    }

    // Crear un CV
    @PostMapping
    public ResponseEntity<CV> create(@Valid @RequestBody CV cv) {
        return ResponseEntity.ok(service.save(cv));
    }

    // Listar todos los CVs
    @GetMapping
    public List<CV> list() {
        return service.findAll();
    }

    // Obtener CV por ID
    @GetMapping("/{id}")
    public ResponseEntity<CV> get(@PathVariable Long id) {
        var cv = service.findById(id);
        return (cv != null) ? ResponseEntity.ok(cv) : ResponseEntity.notFound().build();
    }

    // Actualizar un CV existente
    @PutMapping("/{id}")
    public ResponseEntity<CV> update(@PathVariable Long id, @Valid @RequestBody CV updatedCV) {
        var existingCV = service.findById(id);
        if (existingCV == null) {
            return ResponseEntity.notFound().build();
        }

        // Actualizamos los campos
        existingCV.setNombre(updatedCV.getNombre());
        existingCV.setEmail(updatedCV.getEmail());
        existingCV.setTelefono(updatedCV.getTelefono());
        existingCV.setCiudad(updatedCV.getCiudad());
        existingCV.setHabilidades(updatedCV.getHabilidades());

        // Guardamos y devolvemos
        CV savedCV = service.save(existingCV);
        return ResponseEntity.ok(savedCV);
    }

    // Eliminar un CV
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

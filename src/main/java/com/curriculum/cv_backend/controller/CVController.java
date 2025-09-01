package com.curriculum.cv_backend.controller;

import com.curriculum.cv_backend.model.CV;
import com.curriculum.cv_backend.model.CVHabilidades;
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

    @PostMapping
    public ResponseEntity<CV> create(@Valid @RequestBody CV cv) {
        return ResponseEntity.ok(service.save(cv));
    }

    @GetMapping
    public List<CV> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CV> get(@PathVariable Long id) {
        var cv = service.findById(id);
        return (cv != null) ? ResponseEntity.ok(cv) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<CV> update(@PathVariable Long id, @Valid @RequestBody CV updatedCV) {
        CV existingCV = service.findById(id);
        if (existingCV == null) return ResponseEntity.notFound().build();

        existingCV.setNombre(updatedCV.getNombre());
        existingCV.setEmail(updatedCV.getEmail());
        existingCV.setTelefono(updatedCV.getTelefono());
        existingCV.setGenero(updatedCV.getGenero());
        existingCV.setCiudad(updatedCV.getCiudad());
        existingCV.setDireccion(updatedCV.getDireccion());
        existingCV.setTipoiden(updatedCV.getTipoiden());
        existingCV.setNumeroiden(updatedCV.getNumeroiden());
        existingCV.setFechanac(updatedCV.getFechanac());
        existingCV.setOcupacion(updatedCV.getOcupacion());
        existingCV.setPuesto(updatedCV.getPuesto());
        existingCV.setEstadocivil(updatedCV.getEstadocivil());
        existingCV.setNacionalidad(updatedCV.getNacionalidad());
        existingCV.setObjetivo(updatedCV.getObjetivo());

        if (updatedCV.getHabilidades() != null) {
            CVHabilidades habilidades = existingCV.getHabilidades();
            if (habilidades == null) {
                habilidades = new CVHabilidades();
                habilidades.setCv(existingCV);
                existingCV.setHabilidades(habilidades);
            }
            habilidades.setHabilidad(updatedCV.getHabilidades().getHabilidad());
            habilidades.setExperiencia(updatedCV.getHabilidades().getExperiencia());
            habilidades.setEducacion(updatedCV.getHabilidades().getEducacion());
            habilidades.setIdiomas(updatedCV.getHabilidades().getIdiomas());
        }

        return ResponseEntity.ok(service.save(existingCV));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

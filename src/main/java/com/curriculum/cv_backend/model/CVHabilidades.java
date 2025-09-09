package com.curriculum.cv_backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;

@Entity
@Table(name = "cv_habilidades")
@Data
public class CVHabilidades {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Las habilidades son obligatorias")
    private String habilidad;

    @Column(columnDefinition = "TEXT")
    @NotBlank(message = "La experiencia es obligatoria")
    private String experiencia;

    @Column(columnDefinition = "TEXT")
    @NotBlank(message = "La educación es obligatoria")
    private String educacion;

    @NotBlank(message = "Los idiomas son obligatorios")
    private String idiomas;

    @OneToOne
    @JoinColumn(name = "cv_id")
    @JsonBackReference
    private CV cv;
}

package com.curriculum.cv_backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Entity
@Table(name = "cv")
@Data
public class CV {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @Email(message = "Correo inválido")
    private String email;

    @Pattern(regexp = "\\d{7,15}", message = "Teléfono inválido")
    private String telefono;

    @NotBlank(message = "La ciudad es obligatoria")
    private String ciudad;

    @ElementCollection
    @CollectionTable(name = "cv_habilidades", joinColumns = @JoinColumn(name = "cv_id"))
    @Column(name = "habilidad")
    private List<@NotBlank String> habilidades;
}


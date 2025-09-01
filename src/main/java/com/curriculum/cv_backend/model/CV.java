package com.curriculum.cv_backend.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;

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

    @Pattern(regexp = "\\d{10}", message = "Teléfono inválido")
    private String telefono;

    @NotBlank(message = "La ciudad es obligatoria")
    private String ciudad;

    @NotBlank(message = "La dirección es obligatoria")
    private String direccion;

    @OneToOne(mappedBy = "cv", cascade = CascadeType.ALL)
    @JsonManagedReference
    private CVHabilidades habilidades;
}


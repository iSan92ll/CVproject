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

    @NotBlank(message = "Teléfono inválido")
    private String telefono;

    @NotBlank(message = "La ciudad es obligatoria")
    private String ciudad;

    @NotBlank(message = "La dirección es obligatoria")
    private String direccion;

    @NotBlank(message = "El género es obligatorio")
    private String genero;

    @NotBlank(message = "El tipo de identificación es obligatorio")
    private String tipoiden;

    @NotBlank(message = "El número de identificación es obligatorio")
    private String numeroiden;

    @NotBlank(message = "La fecha de nacimiento es obligatoria")
    private String fechanac;

    @NotBlank(message = "La ocupación es obligatoria")
    private String ocupacion;

    @NotBlank(message = "El puesto a aplicar es obligatorio")
    private String puesto;

    @NotBlank(message = "El estado civil es obligatorio")
    private String estadocivil;

    @NotBlank(message = "La nacionalidad es obligatoria")
    private String nacionalidad;

    @NotBlank(message = "El objetivo dentro de la empresa es obligatorio")
    private String objetivo;

    @OneToOne(mappedBy = "cv", cascade = CascadeType.ALL)
    @JsonManagedReference
    private CVHabilidades habilidades;
}


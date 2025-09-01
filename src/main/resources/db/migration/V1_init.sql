CREATE TABLE cv (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefono VARCHAR(50),
  ciudad VARCHAR(100),
  direccion VARCHAR(255)
);

CREATE TABLE cv_habilidades (
  cv_id BIGINT NOT NULL,
  habilidad VARCHAR(255),
  experiencia VARCHAR(255),
  educacion VARCHAR(255),
  idiomas VARCHAR(255),
  CONSTRAINT fk_cv FOREIGN KEY (cv_id) REFERENCES cv(id) ON DELETE CASCADE
);

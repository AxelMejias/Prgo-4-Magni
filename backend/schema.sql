CREATE TABLE IF NOT EXISTS participantes (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  edad           INTEGER      NOT NULL,
  pais           VARCHAR(100) NOT NULL,
  modalidad      VARCHAR(50)  NOT NULL,
  tecnologias    TEXT[]       NOT NULL,
  nivel          VARCHAR(50)  NOT NULL,
  acepta_terminos BOOLEAN     NOT NULL
);

-- Base de datos y tablas
IF DB_ID('ColaHospital') IS NULL
BEGIN
  CREATE DATABASE ColaHospital;
END
GO
USE ColaHospital;
GO

IF OBJECT_ID('Usuarios','U') IS NULL
CREATE TABLE Usuarios (
  id INT IDENTITY PRIMARY KEY,
  nombre NVARCHAR(100) NOT NULL,
  correo NVARCHAR(100) NOT NULL UNIQUE,
  password NVARCHAR(255) NOT NULL,
  rol NVARCHAR(20) NOT NULL
);
GO

IF OBJECT_ID('Clinicas','U') IS NULL
CREATE TABLE Clinicas (
  id INT IDENTITY PRIMARY KEY,
  nombre NVARCHAR(100) NOT NULL
);
GO

IF OBJECT_ID('Pacientes','U') IS NULL
CREATE TABLE Pacientes (
  id INT IDENTITY PRIMARY KEY,
  nombre NVARCHAR(100) NOT NULL,
  edad INT NULL,
  sintomas NVARCHAR(255) NULL,
  estado NVARCHAR(20) NOT NULL
);
GO

IF OBJECT_ID('Turnos','U') IS NULL
CREATE TABLE Turnos (
  id INT IDENTITY PRIMARY KEY,
  paciente_id INT NOT NULL FOREIGN KEY REFERENCES Pacientes(id),
  clinica_id INT NOT NULL FOREIGN KEY REFERENCES Clinicas(id),
  estado NVARCHAR(20) NOT NULL,
  fechaHora DATETIME DEFAULT GETDATE()
);
GO

-- Seed básico
IF NOT EXISTS(SELECT 1 FROM Usuarios WHERE correo='admin@demo.com')
  INSERT INTO Usuarios (nombre, correo, password, rol) VALUES
  ('Administrador','admin@hospital.com','password','admin'),
  ('Enfermería','enfermeria@hospital.com','password','enfermeria'),
  ('Médico','medico@hospital.com','password','medico');
GO

IF NOT EXISTS(SELECT 1 FROM Clinicas)
  INSERT INTO Clinicas (nombre) VALUES ('Medicina General'), ('Pediatría'), ('Ginecología'), ('Odontología'), ('Trauma');
GO

-- Pacientes de ejemplo
IF NOT EXISTS(SELECT 1 FROM Pacientes)
  INSERT INTO Pacientes (nombre, edad, sintomas, estado) VALUES
  ('Juan Pérez', 34, 'Dolor de cabeza', 'Registrado'),
  ('María López', 7, 'Fiebre y tos', 'Registrado'),
  ('Carlos Díaz', 53, 'Dolor abdominal', 'Registrado');
GO

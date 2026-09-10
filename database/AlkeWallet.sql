-- ============================================
-- PROYECTO MÓDULO 5 - ALKE WALLET
-- Fundamentos de Bases de Datos Relacionales
-- ============================================


-- ============================================
-- 1. CREACIÓN DE LA BASE DE DATOS
-- ============================================

-- Ejecutar por separado en una conexión de administración:
-- CREATE DATABASE "AlkeWallet";
-- Después conectarse a AlkeWallet y ejecutar este archivo (ver README.md).


-- ============================================
-- 2. CREACIÓN DE TABLAS
-- ============================================

-- Tabla Usuario

CREATE TABLE usuario (
    user_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    saldo DECIMAL(12,2) NOT NULL DEFAULT 0
);


-- Tabla Moneda

CREATE TABLE moneda (
    currency_id SERIAL PRIMARY KEY,
    currency_name VARCHAR(50) NOT NULL,
    currency_symbol VARCHAR(10) NOT NULL
);


-- Tabla Transacción

CREATE TABLE transaccion (
    transaction_id SERIAL PRIMARY KEY,
    sender_user_id INTEGER NOT NULL,
    receiver_user_id INTEGER NOT NULL,
    currency_id INTEGER NOT NULL,
    importe DECIMAL(12,2) NOT NULL,
    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sender_user_id)
        REFERENCES usuario(user_id),

    FOREIGN KEY (receiver_user_id)
        REFERENCES usuario(user_id),

    FOREIGN KEY (currency_id)
        REFERENCES moneda(currency_id)
);


-- ============================================
-- 3. RELACIÓN ENTRE USUARIO Y MONEDA
-- ============================================

ALTER TABLE usuario
ADD COLUMN currency_id INTEGER;

ALTER TABLE usuario
ADD CONSTRAINT fk_usuario_moneda
FOREIGN KEY (currency_id)
REFERENCES moneda(currency_id);


-- ============================================
-- 4. DATOS DE PRUEBA
-- ============================================

-- Monedas

INSERT INTO moneda (currency_name, currency_symbol)
VALUES
('Peso Chileno', 'CLP'),
('Dólar Estadounidense', 'USD'),
('Euro', 'EUR');


-- Usuarios

INSERT INTO usuario
(nombre, correo, contrasena, saldo)
VALUES
('Ana Torres', 'ana@ejemplo.cl', 'clave123', 250000),
('Carlos Soto', 'carlos@ejemplo.cl', 'clave123', 180000),
('Maria Lopez', 'maria@ejemplo.cl', 'clave123', 320000);


-- Asignación de moneda a los usuarios

UPDATE usuario
SET currency_id = 1
WHERE nombre = 'Ana Torres';

UPDATE usuario
SET currency_id = 1
WHERE nombre = 'Carlos Soto';

UPDATE usuario
SET currency_id = 2
WHERE nombre = 'Maria Lopez';


-- Transacciones iniciales

INSERT INTO transaccion
(sender_user_id, receiver_user_id, currency_id, importe)
VALUES
(1, 2, 1, 25000),
(2, 3, 1, 15000),
(3, 1, 2, 50);


-- ============================================
-- 5. CONSULTAS BÁSICAS
-- ============================================

-- Mostrar todos los usuarios

SELECT * FROM usuario;


-- Mostrar todas las transacciones

SELECT * FROM transaccion;


-- ============================================
-- 6. CONSULTAR MONEDA DE UN USUARIO
-- ============================================

SELECT
    u.nombre,
    m.currency_name
FROM usuario u
INNER JOIN moneda m
    ON u.currency_id = m.currency_id
WHERE u.user_id = 1;


-- ============================================
-- 7. TRANSACCIONES DE UN USUARIO ESPECÍFICO
-- ============================================

SELECT
    t.transaction_id,
    u.nombre AS emisor,
    t.receiver_user_id,
    t.importe,
    t.transaction_date
FROM transaccion t
INNER JOIN usuario u
    ON t.sender_user_id = u.user_id
WHERE t.sender_user_id = 1;


-- ============================================
-- 8. ACTUALIZAR CORREO DE UN USUARIO
-- ============================================

UPDATE usuario
SET correo = 'ana.nuevo@ejemplo.cl'
WHERE user_id = 1;


-- Comprobar actualización

SELECT
    user_id,
    nombre,
    correo
FROM usuario
WHERE user_id = 1;


-- ============================================
-- 9. ELIMINAR UNA TRANSACCIÓN
-- ============================================

DELETE FROM transaccion
WHERE transaction_id = 3;


-- Comprobar eliminación

SELECT * FROM transaccion;


-- ============================================
-- 10. TRANSACCIÓN CON COMMIT
-- ============================================

START TRANSACTION;

UPDATE usuario
SET saldo = saldo - 10000
WHERE user_id = 1;

UPDATE usuario
SET saldo = saldo + 10000
WHERE user_id = 2;

INSERT INTO transaccion
(sender_user_id, receiver_user_id, currency_id, importe)
VALUES
(1, 2, 1, 10000);

COMMIT;


-- Comprobar saldos

SELECT
    user_id,
    nombre,
    saldo
FROM usuario
WHERE user_id IN (1, 2);


-- ============================================
-- 11. TRANSACCIÓN CON ROLLBACK
-- ============================================

START TRANSACTION;

UPDATE usuario
SET saldo = saldo - 5000
WHERE user_id = 1;

UPDATE usuario
SET saldo = saldo + 5000
WHERE user_id = 2;

ROLLBACK;


-- Comprobar que los saldos no cambiaron

SELECT
    user_id,
    nombre,
    saldo
FROM usuario
WHERE user_id IN (1, 2);


-- ============================================
-- 12. PRUEBA DE INTEGRIDAD REFERENCIAL
-- ============================================

-- Prueba opcional: ejecutar este bloque por separado, línea por línea.
-- Tras el error esperado, ejecutar ROLLBACK para cerrar la transacción.
/*
START TRANSACTION;

-- Esta consulta genera un error de forma intencional
-- porque el usuario 999 no existe.

INSERT INTO transaccion
(sender_user_id, receiver_user_id, currency_id, importe)
VALUES
(999, 2, 1, 5000);

ROLLBACK;
*/


-- ============================================
-- 13. INNER JOIN
-- ============================================

SELECT
    t.transaction_id,
    u1.nombre AS emisor,
    u2.nombre AS receptor,
    m.currency_name AS moneda,
    t.importe,
    t.transaction_date
FROM transaccion t
INNER JOIN usuario u1
    ON t.sender_user_id = u1.user_id
INNER JOIN usuario u2
    ON t.receiver_user_id = u2.user_id
INNER JOIN moneda m
    ON t.currency_id = m.currency_id
ORDER BY t.transaction_id;


-- ============================================
-- 14. TOTAL DE TRANSACCIONES POR USUARIO
-- ============================================

SELECT
    u.user_id,
    u.nombre,
    (
        SELECT COUNT(*)
        FROM transaccion t
        WHERE t.sender_user_id = u.user_id
    ) AS total_transacciones
FROM usuario u
ORDER BY u.user_id;


-- ============================================
-- 15. ÍNDICE COMPUESTO
-- ============================================

CREATE INDEX idx_transaccion_usuarios
ON transaccion
(sender_user_id, receiver_user_id);


-- Comprobar índice

SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'transaccion';


-- ============================================
-- 16. ESTRUCTURA DE LAS TABLAS
-- ============================================

SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN (
    'usuario',
    'moneda',
    'transaccion'
)
ORDER BY table_name, ordinal_position;
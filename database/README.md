# Ejercicio complementario de PostgreSQL

Este archivo conserva el trabajo del Módulo 5. **No está conectado al frontend de Alke Wallet** y no es necesario para usar la demo.

## Ejecutar con psql

Requiere PostgreSQL instalado, servidor iniciado y un usuario con permiso para crear bases. Desde la raíz del repositorio:

```bash
psql -U postgres -d postgres -c 'CREATE DATABASE "AlkeWallet";'
psql -U postgres -d AlkeWallet -v ON_ERROR_STOP=1 -f database/AlkeWallet.sql
```

Si la terminal interpreta las comillas de manera distinta, ejecutar `CREATE DATABASE "AlkeWallet";` directamente en una conexión de psql a `postgres`, fuera de una transacción. Conectarse después usando `\connect AlkeWallet` y ejecutar `\i database/AlkeWallet.sql` desde la raíz del proyecto.

En **pgAdmin**, crear la base AlkeWallet desde el panel, abrir Query Tool sobre esa base y ejecutar el archivo. Crear una base no cambia automáticamente la conexión activa.

## Qué esperar

- Tres usuarios, tres monedas y transacciones de ejemplo.
- Consultas, cambio de correo, eliminación de una transacción de ejemplo e índice compuesto.
- El ejemplo con `COMMIT` mueve 10.000 entre los usuarios 1 y 2: quedan 240.000 y 190.000.
- El ejemplo con `ROLLBACK` no altera esos saldos.
- La sección 12 contiene un bloque comentado que intenta usar el usuario inexistente 999. Es una **prueba intencionalmente fallida**: ejecutarla por separado y terminar con `ROLLBACK` después del error esperado.

Usar una base vacía de práctica. El archivo no es idempotente: volver a ejecutarlo sobre las mismas tablas puede producir errores de objetos o datos duplicados. No eliminar una base con información útil para repetir el ejercicio.

## Alcance

El archivo es evidencia de modelado y consultas, no un backend bancario. Incluye contraseñas ficticias en texto plano, monedas independientes de la demo y transacciones iniciales que no recalculan automáticamente los saldos. No implementa conversión de moneda ni todas las restricciones de un sistema financiero real.

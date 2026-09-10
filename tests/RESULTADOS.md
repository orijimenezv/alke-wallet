# Verificación de Alke Wallet

Fecha: 10 de septiembre de 2026. Pruebas realizadas en la rama de mejoras antes de su integración a main. La rama fue posteriormente publicada en GitHub para revisión mediante Pull Request.

## Pruebas automatizadas

Ejecutar `node --test tests/wallet.test.cjs` desde la raíz. El entorno de estas pruebas usa almacenamiento en memoria y no modifica los datos del navegador.

Se verifican datos demo coherentes, montos inválidos y límites, las cuatro operaciones, precisión, persistencia, saldo insuficiente, sesión ausente, contactos duplicados, recuperación de JSON y estructuras inválidas, saldo corrupto, fechas antiguas, errores de escritura, rutas, identificadores HTML y encabezados. También se comprueban saldos de la versión anterior con ruido decimal.

Resultado: **11 pruebas aprobadas**. `node --check` aprobó ambos archivos JavaScript.

## Recorrido en navegador

Se utilizó un servidor local bajo `/alke-wallet/`, para comprobar las rutas relativas bajo un subdirectorio como en GitHub Pages.

| Comprobación | Resultado |
| --- | --- |
| Login incorrecto | Rechazado con mensaje |
| Login demo correcto | Acceso al menú y saldo inicial de 15.000 |
| Login con Tab y Enter | Botón accesible y navegación correcta |
| Depósito con 0.001 | Rechazado sin alterar saldo |
| Depósito de 100.50 | Saldo 15.100,50 |
| Retiro superior al saldo | Rechazado |
| Retiro de 20 | Saldo 15.080,50 |
| Recepción de 50 | Saldo 15.130,50 |
| Alta y búsqueda de contacto | Contacto encontrado por alias |
| Contacto con nombre `<b>Contacto de prueba</b>` | Nombre literal, sin interpretar HTML |
| Contacto con CBU duplicado | Rechazado |
| Envío de 10.25 | Saldo 15.120,25; confirmación segura |
| Recarga | Saldo y contacto conservados |
| Historial | Ocho movimientos, nuevos primero y fechas consistentes |
| Filtros | Todos 8; compra 1; depósito 2; retiro 1; recepción 2; envío 2 |
| Cierre de sesión | Vuelta al login |
| Acceso directo sin sesión | Las seis páginas de operaciones/menú redirigen al login |
| Móvil a 375 px | Sin desbordamiento horizontal en las seis páginas; inspección visual de login e historial |
| Consola durante el recorrido | Sin errores registrados |

## Límites de esta verificación

- Los casos de almacenamiento corrupto, cuota de escritura y compatibilidad de datos anteriores se prueban automáticamente en memoria; no se modificó manualmente el almacenamiento real del usuario.
- No se ejecutó PostgreSQL: `psql` no está disponible en este entorno. Se revisó el SQL y se documentó su ejecución; la prueba de integridad intencionalmente fallida está comentada.
- No se activó GitHub Pages. Falta verificar la URL real después del push y despliegue.
- La revisión móvil y de teclado es básica; no constituye una auditoría completa con lectores de pantalla ni una matriz de navegadores.

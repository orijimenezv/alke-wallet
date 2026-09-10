# Alke Wallet

Simulador de billetera digital para consultar saldo, gestionar contactos y realizar operaciones ficticias desde el navegador.

Proyecto realizado por **Orielle Jiménez** durante su formación **Full Stack JavaScript**, inicialmente para el Módulo 2, Fundamentos del Desarrollo Frontend. Incluye un ejercicio complementario del Módulo 5, Bases de Datos Relacionales.

## Objetivo

Practicar formularios, eventos, manipulación del DOM, validaciones y persistencia local mediante una aplicación con varias pantallas y un recorrido completo de operaciones simuladas.

## Demo y capturas

**GitHub Pages:** pendiente de publicación. Aquí se agregará el enlace verificado.

**Capturas:** pendientes de incorporar. Se agregarán imágenes reales del login, menú, envío e historial, en escritorio y móvil.

## Funcionalidades

- Inicio y cierre de sesión demo.
- Consulta del saldo disponible en pesos argentinos (ARS).
- Depósitos, retiros, envíos a contactos y recepción simulada de dinero.
- Agenda con alta y búsqueda por nombre o alias.
- Historial y filtros por compra, depósito, retiro y transferencias recibidas o enviadas.
- Persistencia del saldo, los contactos y los movimientos al recargar.

Las compras aparecen como movimientos de ejemplo; no existe una pantalla para realizar compras.

## Tecnologías utilizadas

| Tecnología | Uso |
| --- | --- |
| HTML5 y CSS3 | Estructura, formularios y estilos propios |
| JavaScript | Validaciones, saldo, sesión demo y movimientos |
| jQuery 3.7.1 | Eventos, DOM y animaciones |
| Bootstrap 5.3.3 | Grilla, formularios y componentes |
| Bootstrap Icons 1.11.3 | Iconos |
| localStorage | Persistencia en el navegador |
| Git y GitHub | Control de versiones y repositorio |
| PostgreSQL | Ejercicio SQL independiente |

## Ejecutar localmente

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/orijimenezv/alke-wallet.git
   cd alke-wallet
   ```

2. Abrir la carpeta en Visual Studio Code.
3. Iniciar `index.html` con la extensión **Live Server** y usar la URL local que indique.
4. Mantener conexión a Internet: Bootstrap, sus iconos y jQuery se cargan desde CDN.

No se necesita instalar paquetes npm, compilar ni configurar una base de datos para usar la aplicación. Se recomienda un servidor local en lugar de abrir archivos con `file://`, para mantener un origen consistente de almacenamiento.

### Credenciales demo

| Campo | Valor |
| --- | --- |
| Correo | `usuario@wallet.com` |
| Contraseña | `1234` |

Son credenciales públicas de demostración. El control de sesión se ejecuta en el frontend y **no es autenticación real**.

## Recorrido sugerido

1. Iniciar sesión con las credenciales demo.
2. Consultar el saldo y depositar `100.50`.
3. Retirar `20` y probar un retiro superior al saldo para comprobar el rechazo.
4. Buscar un contacto por nombre o alias y enviar `10.25`.
5. Agregar un contacto ficticio con un CBU de 22 dígitos y un alias único; buscarlo y seleccionarlo.
6. Simular la recepción de `50`.
7. Revisar el historial y cada filtro, incluido uno sin resultados.
8. Recargar para comprobar la persistencia. Cerrar sesión y comprobar que las operaciones requieren volver a ingresar.

## Estructura principal

```text
alke-wallet/
├── index.html             # Entrada a la aplicación
├── login.html             # Acceso demo
├── menu.html              # Saldo y navegación
├── deposit.html           # Depósitos
├── withdraw.html          # Retiros
├── sendmoney.html         # Contactos y envíos
├── receive.html           # Recepción simulada
├── transactions.html      # Historial y filtros
├── css/style.css          # Identidad visual y responsive
├── js/wallet.js           # Datos, sesión y reglas de operaciones
├── js/script.js           # Eventos e interfaz de las pantallas
├── database/AlkeWallet.sql # Ejercicio complementario
├── database/README.md     # Ejecución en PostgreSQL
├── tests/wallet.test.cjs   # Pruebas de reglas y rutas
├── tests/RESULTADOS.md     # Alcance de la verificación
└── README.md
```

## localStorage y datos iniciales

Se guardan las claves `walletSaldo`, `walletContactos`, `walletMovimientos` y `walletUserEmail`. Los datos pertenecen al navegador y al origen (protocolo, dominio y puerto): la demo publicada y el servidor local no comparten información.

El saldo inicial de **ARS 15.000** corresponde a una apertura de ARS 11.100 más los cuatro movimientos demo (−2.500 + 5.000 + 3.200 − 1.800). La apertura no es una operación adicional. Cerrar sesión conserva los movimientos.

Para empezar de nuevo, eliminar únicamente esas cuatro claves desde las herramientas de desarrollo del navegador y recargar. No usar datos personales, contraseñas reales ni información bancaria real.

### Recuperación y validaciones

Las listas con JSON o registros inválidos se respaldan en claves con sufijo `Respaldo-<fecha en milisegundos>` antes de repararlas. Se conservan los registros válidos; una lista de contactos ilegible vuelve a los ejemplos y un historial ilegible queda vacío. Aparece un aviso: el historial recuperado puede estar incompleto y el saldo no se recalcula a partir de él. Si no se puede guardar el respaldo, no se sobrescribe el original.

Un saldo inválido se conserva y bloquea las operaciones hasta corregirlo o reiniciar la demo. Los pequeños errores decimales producidos por la versión anterior se normalizan al leerlos. Un navegador sin almacenamiento disponible muestra un error y no confirma operaciones.

Los montos nuevos admiten de 0,01 a 999.999.999,99 ARS, con hasta dos decimales. Los cálculos se hacen con centavos enteros y se conserva el formato anterior de las claves para no perder datos existentes. Las fechas nuevas se guardan en ISO; también se leen las fechas antiguas día/mes/año y se ordena el historial del más reciente al más antiguo.

## Pruebas

Para ejecutar las pruebas de reglas, almacenamiento y rutas se necesita Node.js 18 o posterior, únicamente como herramienta de desarrollo:

```bash
node --check js/wallet.js
node --check js/script.js
node --test tests/wallet.test.cjs
```

No se requieren dependencias npm. Consultar [resultados y alcance de las pruebas](tests/RESULTADOS.md). La aplicación publicada no necesita Node.js.

## Ejercicio SQL complementario

`database/AlkeWallet.sql` practica usuarios, monedas y transacciones, claves foráneas, consultas, índices y operaciones con `COMMIT` y `ROLLBACK`.

**No está conectado al frontend.** La aplicación utiliza localStorage y no incluye API ni servidor. El SQL tiene sus propios datos y monedas CLP, USD y EUR, independientes de los ARS de la demo.

Para ejecutarlo, instalar PostgreSQL y seguir [las instrucciones de la base de datos](database/README.md). Las contraseñas del ejercicio están en texto plano y son exclusivamente ejemplos.

## Aprendizajes obtenidos

- Construcción de pantallas y formularios con HTML, CSS y Bootstrap.
- Manejo de eventos y actualización del DOM con JavaScript y jQuery.
- Validación de entradas y gestión de estados de interfaz.
- Serialización con JSON y persistencia local.
- Navegación entre páginas y organización de un proyecto frontend.
- Control de versiones con Git y GitHub.
- Modelado relacional y consultas SQL en un ejercicio separado.

## Limitaciones actuales

- Simulación educativa: no realiza operaciones bancarias.
- Sesión y datos modificables desde el navegador; no hay autenticación de servidor ni cuentas reales.
- Sin sincronización entre dispositivos ni garantía transaccional entre pestañas simultáneas. Usar una pestaña para operar.
- Dependencia de CDN y del almacenamiento del navegador.
- La validación de CBU verifica 22 dígitos; no comprueba una cuenta bancaria real.
- Sin edición o eliminación de contactos ni integración con PostgreSQL.

## Publicar en GitHub Pages

Después de revisar y subir la versión final:

1. Abrir **Settings → Pages** en GitHub.
2. Seleccionar **Deploy from a branch**.
3. Elegir la rama con la versión final (por ejemplo `main`) y **/ (root)**.
4. Guardar y esperar el despliegue.
5. Probar las operaciones desde la URL publicada antes de agregarla a este README.

La entrada es `index.html` y las rutas son relativas para funcionar bajo el nombre del repositorio. Pages publica el frontend estático; no ejecuta PostgreSQL. [Documentación oficial](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Posibles mejoras futuras

- Backend con autenticación real y conexión a PostgreSQL.
- Múltiples usuarios y operaciones persistidas en el servidor.
- Edición de contactos y paginación del historial.
- Ampliación de pruebas automatizadas y evaluación de accesibilidad.

Estas mejoras no forman parte de la implementación actual.

## Autora

**Orielle Jiménez** · Estudiante Full Stack JavaScript

[Perfil de GitHub](https://github.com/orijimenezv)

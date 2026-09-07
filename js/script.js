/* =========================================================
   BILLETERA DIGITAL - JAVASCRIPT + JQUERY
   El mismo archivo se utiliza en las cinco pantallas
   ========================================================= */

const USUARIO_VALIDO = {
  email: 'usuario@wallet.com',
  password: '1234'
};

const CONTACTOS_DEFECTO = [
  { nombre: 'María González', cbu: '0000003100000000123456', alias: 'maria.gonzalez.mp', banco: 'Banco Nación' },
  { nombre: 'Carlos Rodríguez', cbu: '0000003100000000654321', alias: 'carlos.rodri', banco: 'Banco Galicia' },
  { nombre: 'Lucía Fernández', cbu: '0000003100000000987654', alias: 'lu.fernandez', banco: 'Banco Santander' },
  { nombre: 'Karol Tello', cbu: '0000003100000000111111', alias: 'karol.tello', banco: 'Banco Digital' },
  { nombre: 'Merceedes Segovia', cbu: '0000003100000000222222', alias: 'merceedes.segovia', banco: 'Banco Digital' },
  { nombre: 'Darwin Jimenez', cbu: '0000003100000000333333', alias: 'darwin.jimenez', banco: 'Banco Digital' }
];

/* Lista ficticia solicitada en la consigna
   Luego se guarda en Local Storage y se va actualizando con los movimientos reales */
const listaTransacciones = [
  { tipo: 'compra', detalle: 'Compra en supermercado', monto: -2500, fecha: '02/09/2026' },
  { tipo: 'deposito', detalle: 'Depósito a tu cuenta', monto: 5000, fecha: '03/09/2026' },
  { tipo: 'transferencia_recibida', detalle: 'Transferencia recibida de Ana', monto: 3200, fecha: '04/09/2026' },
  { tipo: 'transferencia_enviada', detalle: 'Transferencia enviada a Carlos', monto: -1800, fecha: '05/09/2026' }
];

function inicializarDatos() {
  if (localStorage.getItem('walletSaldo') === null) {
    localStorage.setItem('walletSaldo', '15000');
  }

  if (localStorage.getItem('walletContactos') === null) {
    localStorage.setItem('walletContactos', JSON.stringify(CONTACTOS_DEFECTO));
  } else {
    const contactosGuardados = JSON.parse(localStorage.getItem('walletContactos') || '[]');

    CONTACTOS_DEFECTO.forEach(function (contacto) {
      const yaExiste = contactosGuardados.some(function (guardado) {
        return guardado.nombre.toLowerCase() === contacto.nombre.toLowerCase();
      });

      if (!yaExiste) {
        contactosGuardados.push(contacto);
      }
    });

    localStorage.setItem('walletContactos', JSON.stringify(contactosGuardados));
  }

  if (localStorage.getItem('walletMovimientos') === null) {
    localStorage.setItem('walletMovimientos', JSON.stringify(listaTransacciones));
  }
}

function formatearMonto(valor) {
  return Number(valor).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS'
  });
}

function obtenerSaldo() {
  return Number(localStorage.getItem('walletSaldo') || 0);
}

function guardarSaldo(nuevoSaldo) {
  localStorage.setItem('walletSaldo', String(nuevoSaldo));
}

function agregarMovimiento(tipo, detalle, monto) {
  const movimientos = JSON.parse(localStorage.getItem('walletMovimientos') || '[]');

  movimientos.unshift({
    tipo: tipo,
    detalle: detalle,
    monto: monto,
    fecha: new Date().toLocaleDateString('es-AR')
  });

  localStorage.setItem('walletMovimientos', JSON.stringify(movimientos));
}

function crearAlerta(tipo, mensaje) {
  return `
    <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    </div>
  `;
}

function getTipoTransaccion(tipo) {
  const tipos = {
    compra: 'Compra',
    deposito: 'Depósito',
    retiro: 'Retiro',
    transferencia_recibida: 'Transferencia recibida',
    transferencia_enviada: 'Transferencia enviada'
  };

  return tipos[tipo] || tipo;
}

$(document).ready(function () {
  inicializarDatos();

  /* =======================================================
     LOGIN
     Uso de selectores y submit de jQuery
     ======================================================= */
  if ($('#loginForm').length) {
    $('#loginForm').submit(function (event) {
      event.preventDefault();

      const formulario = this;

      if (!formulario.checkValidity()) {
        $(formulario).addClass('was-validated');
        return;
      }

      const email = $('#email').val().trim();
      const password = $('#password').val();
      const loginCorrecto = email.toLowerCase() === USUARIO_VALIDO.email && password === USUARIO_VALIDO.password;

      $('#loginMensaje').removeClass('d-none alert-success alert-danger');

      if (loginCorrecto) {
        localStorage.setItem('walletUserEmail', email);

        $('#loginMensaje')
          .addClass('alert-success')
          .html('<i class="bi bi-check-circle me-1"></i>Inicio de sesión exitoso redirigiendo al menú principal');

        $('#btnLogin').prop('disabled', true);

        setTimeout(function () {
          window.location.href = 'menu.html';
        }, 1200);
      } else {
        $('#loginMensaje')
          .addClass('alert-danger')
          .html('<i class="bi bi-exclamation-triangle me-1"></i>Correo o contraseña incorrectos');
      }
    });
  }

  /* =======================================================
     MENÚ PRINCIPAL
     ======================================================= */
  if ($('#userBadge').length) {
    $('#saldoActual').text(formatearMonto(obtenerSaldo()));

    const emailGuardado = localStorage.getItem('walletUserEmail');
    if (emailGuardado) {
      $('#userEmail').text(emailGuardado);
    }

    function redirigir(nombrePantalla, archivo) {
      $('#redireccionMensaje')
        .text('Redirigiendo a ' + nombrePantalla)
        .removeClass('d-none');

      setTimeout(function () {
        window.location.href = archivo;
      }, 900);
    }

    $('#btnDepositar').click(function () {
      redirigir('depósito', 'deposit.html');
    });

    $('#btnRetirar').click(function () {
      redirigir('retiro de dinero', 'withdraw.html');
    });

    $('#btnMenuEnviar').click(function () {
      redirigir('enviar dinero', 'sendmoney.html');
    });
    $('#btnRecibir').click(function () {
      redirigir('recibir dinero', 'receive.html');
    });
    $('#btnMovimientos').click(function () {
      redirigir('últimos movimientos', 'transactions.html');
    });

    $('#logoutLink').click(function () {
      localStorage.removeItem('walletUserEmail');
    });
  }

  /* =======================================================
     DEPÓSITO
     ======================================================= */
  if ($('#depositForm').length) {
    $('#saldoActual').text(formatearMonto(obtenerSaldo()));

    $('#depositForm').submit(function (event) {
      event.preventDefault();

      const formulario = this;
      const monto = Number($('#monto').val());

      if (!formulario.checkValidity() || monto <= 0) {
        $(formulario).addClass('was-validated');
        return;
      }

      const nuevoSaldo = obtenerSaldo() + monto;
      guardarSaldo(nuevoSaldo);
      agregarMovimiento('deposito', 'Depósito a tu cuenta', monto);

      $('#saldoActual').text(formatearMonto(nuevoSaldo));

      $('#depositLegend')
        .removeClass('d-none')
        .html('<i class="bi bi-info-circle me-1"></i>Monto depositado <strong>' + formatearMonto(monto) + '</strong>');

      $('#alert-container').html(
        crearAlerta('success', '<i class="bi bi-check-circle me-1"></i>Depósito realizado correctamente nuevo saldo ' + formatearMonto(nuevoSaldo))
      );

      formulario.reset();
      $(formulario).removeClass('was-validated');

      setTimeout(function () {
        window.location.href = 'menu.html';
      }, 2000);
    });
  }
    /* =======================================================
   RETIRO DE DINERO
   ======================================================= */

if ($('#retiroForm').length) {

  $('#saldoRetiro').text(formatearMonto(obtenerSaldo()));

  $('#retiroForm').submit(function (event) {

    event.preventDefault();

    const monto = Number($('#montoRetiro').val());
    const saldoActual = obtenerSaldo();

    if (!monto || monto <= 0) {

      $('#retiroAlertContainer').html(
        crearAlerta('danger', 'Ingresá un monto válido')
      );

      return;
    }

    if (monto > saldoActual) {

      $('#retiroAlertContainer').html(
        crearAlerta('danger', 'Saldo insuficiente para realizar el retiro')
      );

      return;
    }

    const nuevoSaldo = saldoActual - monto;

    guardarSaldo(nuevoSaldo);

    agregarMovimiento(
      'retiro',
      'Retiro de dinero',
      -monto
    );

    $('#saldoRetiro').text(formatearMonto(nuevoSaldo));

    $('#retiroAlertContainer').html(
      crearAlerta(
        'success',
        'Retiro realizado correctamente nuevo saldo ' +
        formatearMonto(nuevoSaldo)
      )
    );

    $('#montoRetiro').val('');

    setTimeout(function () {
      window.location.href = 'menu.html';
    }, 2000);

  });

  }
  /* =======================================================
     ENVIAR DINERO
     ======================================================= */
  if ($('#listaContactos').length) {
    let contactoSeleccionado = null;

    $('#saldoEnvio').text(formatearMonto(obtenerSaldo()));

    function obtenerContactos() {
      return JSON.parse(localStorage.getItem('walletContactos') || '[]');
    }

    function guardarContactos(contactos) {
      localStorage.setItem('walletContactos', JSON.stringify(contactos));
    }

    function iniciales(nombre) {
      return nombre
        .split(' ')
        .map(function (palabra) { return palabra.charAt(0); })
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }

    function mostrarContactos(filtro) {
      const termino = (filtro || '').trim().toLowerCase();
      const contactos = obtenerContactos().filter(function (contacto) {
        return !termino ||
          contacto.nombre.toLowerCase().includes(termino) ||
          contacto.alias.toLowerCase().includes(termino);
      });

      $('#listaContactos').empty();

      if (contactos.length === 0) {
        $('#sinResultados').removeClass('d-none');
        return;
      }

      $('#sinResultados').addClass('d-none');

      $.each(contactos, function (indice, contacto) {
        const item = $(
          '<button type="button" class="list-group-item list-group-item-action contact-item d-flex align-items-center justify-content-between py-3"></button>'
        );

        item.html(`
          <div class="d-flex align-items-center text-start">
            <div class="wallet-icon-circle contact-avatar">${iniciales(contacto.nombre)}</div>
            <div>
              <div class="fw-semibold">${contacto.nombre}</div>
              <div class="text-muted small">${contacto.alias} · ${contacto.banco}</div>
            </div>
          </div>
          <i class="bi bi-check-circle-fill text-primary select-check d-none"></i>
        `);

        item.click(function () {
          contactoSeleccionado = contacto;

          $('.contact-item').removeClass('active');
          $('.contact-item .select-check').addClass('d-none');
          $(this).addClass('active');
          $(this).find('.select-check').removeClass('d-none');

          $('#contactoSeleccionadoNombre').text(contacto.nombre);
          $('#contactoSeleccionadoAlias').text(contacto.alias + ' · ' + contacto.banco);
          $('#contactoSeleccionadoBox').removeClass('d-none').hide().fadeIn();
          $('#envioConfirmacion').addClass('d-none');
        });

        $('#listaContactos').append(item);
      });
    }

    mostrarContactos('');

    $('#btnMostrarContacto').click(function () {
      $('#nuevoContactoContainer').stop(true, true).slideDown();
      $('#contactoNombre').focus();
    });

    $('#btnCancelarContacto').click(function () {
      $('#nuevoContactoForm')[0].reset();
      $('#nuevoContactoForm').removeClass('was-validated');
      $('#contactoAlertContainer').empty();
      $('#nuevoContactoContainer').stop(true, true).slideUp();
    });

    $('#nuevoContactoForm').submit(function (event) {
      event.preventDefault();

      const formulario = this;
      const nombre = $('#contactoNombre').val().trim();
      const cbu = $('#contactoCbu').val().trim();
      const alias = $('#contactoAlias').val().trim();
      const banco = $('#contactoBanco').val().trim();
      const cbuValido = /^\d{22}$/.test(cbu);

      if (!formulario.checkValidity() || !nombre || !alias || !banco || !cbuValido) {
        $(formulario).addClass('was-validated');

        if (!cbuValido) {
          $('#contactoCbu').addClass('is-invalid');
        }
        return;
      }

      const contactos = obtenerContactos();
      contactos.push({ nombre: nombre, cbu: cbu, alias: alias, banco: banco });
      guardarContactos(contactos);

      $('#contactoAlertContainer').html(
        crearAlerta('success', '<i class="bi bi-check-circle me-1"></i>Contacto agregado correctamente')
      );

      formulario.reset();
      $(formulario).removeClass('was-validated');
      $('#contactoCbu').removeClass('is-invalid');
      mostrarContactos('');
      $('#buscarContacto').val('');

      setTimeout(function () {
        $('#nuevoContactoContainer').stop(true, true).slideUp();
        $('#contactoAlertContainer').empty();
      }, 1200);
    });

    $('#searchForm').submit(function (event) {
      event.preventDefault();
      mostrarContactos($('#buscarContacto').val());
    });

    $('#buscarContacto').on('input', function () {
      mostrarContactos($(this).val());
    });

    $('#enviarDineroForm').submit(function (event) {
      event.preventDefault();

      const monto = Number($('#montoEnvio').val());
      const saldoActual = obtenerSaldo();

      $('#envioConfirmacion').removeClass('d-none alert-success alert-danger');

      if (!contactoSeleccionado) {
        $('#envioConfirmacion')
          .addClass('alert-danger')
          .text('Seleccioná un contacto antes de enviar dinero');
        return;
      }

      if (!monto || monto <= 0) {
        $('#envioConfirmacion')
          .addClass('alert-danger')
          .text('Ingresá un monto válido');
        return;
      }

      if (monto > saldoActual) {
        $('#envioConfirmacion')
          .addClass('alert-danger')
          .text('Saldo insuficiente para realizar la transferencia');
        return;
      }

      const nuevoSaldo = saldoActual - monto;
      guardarSaldo(nuevoSaldo);
      agregarMovimiento('transferencia_enviada', 'Transferencia a ' + contactoSeleccionado.nombre, -monto);

      $('#saldoEnvio').text(formatearMonto(nuevoSaldo));
      $('#envioConfirmacion')
        .addClass('alert-success')
        .html('<i class="bi bi-check-circle me-1"></i>Envío realizado con éxito enviaste <strong>' + formatearMonto(monto) + '</strong> a ' + contactoSeleccionado.nombre);

      $('#montoEnvio').val('');
    });
       }
    /* =======================================================
    RECIBIR DINERO
   ======================================================= */

  if ($('#recepcionForm').length) {

    $('#saldoRecepcion').text(formatearMonto(obtenerSaldo()));

    $('#recepcionForm').submit(function (event) {

    event.preventDefault();

    const monto = Number($('#montoRecepcion').val());

  if (!monto || monto <= 0) {

      $('#recepcionAlertContainer').html(
        crearAlerta('danger', 'Ingresá un monto válido')
      );

      return;
    }

    const saldoActual = obtenerSaldo();

    const nuevoSaldo = saldoActual + monto;

    guardarSaldo(nuevoSaldo);

    agregarMovimiento(
      'transferencia_recibida',
      'Transferencia recibida',
      monto
    );

    $('#saldoRecepcion').text(formatearMonto(nuevoSaldo));

    $('#recepcionAlertContainer').html(
      crearAlerta(
        'success',
        'Dinero recibido correctamente nuevo saldo ' +
        formatearMonto(nuevoSaldo)
      )
    );

    $('#montoRecepcion').val('');

    setTimeout(function () {
      window.location.href = 'menu.html';
    }, 2000);

  });

  }
  /* =======================================================
     ÚLTIMOS MOVIMIENTOS
     ======================================================= */
  if ($('#listaMovimientos').length) {
    function formatearMontoMovimiento(valor) {
      const signo = valor >= 0 ? '+' : '−';
      return signo + ' ' + formatearMonto(Math.abs(valor));
    }

    function mostrarUltimosMovimientos(filtro) {
      const movimientos = JSON.parse(localStorage.getItem('walletMovimientos') || '[]');
      const filtrados = filtro === 'todos'
        ? movimientos
        : movimientos.filter(function (movimiento) {
            return movimiento.tipo === filtro;
          });

      $('#listaMovimientos').empty();

      if (filtrados.length === 0) {
        $('#sinMovimientos').removeClass('d-none');
        return;
      }

      $('#sinMovimientos').addClass('d-none');

      $.each(filtrados, function (indice, movimiento) {
        const esPositivo = Number(movimiento.monto) >= 0;
        const claseMonto = esPositivo ? 'movement-amount-positive' : 'movement-amount-negative';
        const claseIcono = esPositivo ? 'bi-arrow-down-left' : 'bi-arrow-up-right';
        const claseFondo = esPositivo ? 'positive-icon' : 'negative-icon';

        const item = $(
          '<div class="list-group-item list-group-item-transaction d-flex align-items-center justify-content-between py-3"></div>'
        );

        item.html(`
          <div class="d-flex align-items-center">
            <div class="wallet-icon-circle transaction-icon ${claseFondo}">
              <i class="bi ${claseIcono}"></i>
            </div>
            <div>
              <div class="fw-semibold">${getTipoTransaccion(movimiento.tipo)}</div>
              <div class="text-muted small">${movimiento.detalle}</div>
              <div class="text-muted small">${movimiento.fecha}</div>
            </div>
          </div>
          <div class="${claseMonto}">${formatearMontoMovimiento(movimiento.monto)}</div>
        `);

        $('#listaMovimientos').append(item);
      });
    }

    window.mostrarUltimosMovimientos = mostrarUltimosMovimientos;
    mostrarUltimosMovimientos('todos');

    $('#filtroTipo').change(function () {
      mostrarUltimosMovimientos($(this).val());
    });
  }
});

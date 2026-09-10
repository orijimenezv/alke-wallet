/* Eventos de las pantallas. Las reglas y el almacenamiento están en wallet.js. */
function crearAlerta(tipo, mensaje) {
  const alerta = $('<div class="alert alert-dismissible fade show" role="alert"></div>')
    .addClass('alert-' + tipo);
  $('<i class="bi me-1" aria-hidden="true"></i>')
    .addClass(tipo === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle').appendTo(alerta);
  $('<span></span>').text(mensaje).appendTo(alerta);
  $('<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar aviso"></button>').appendTo(alerta);
  return alerta;
}

function mostrarError(error) {
  const mensaje = error.name === 'QuotaExceededError' || error.name === 'SecurityError'
    ? 'No se pudo acceder al almacenamiento. Habilitá el almacenamiento o liberá espacio y recargá; no se confirmó la operación.'
    : error.message;
  $('#estadoDatos').empty().append(crearAlerta('danger', mensaje)).removeClass('d-none');
}

function mostrarAvisosDatos() {
  if (avisosDatos.size) {
    $('#estadoDatos').empty().append(crearAlerta('warning', [...avisosDatos].join(' '))).removeClass('d-none');
    avisosDatos.clear();
  }
}

// Un solo lugar para capturar errores de formularios sin dejar la página inutilizable.
function alEnviar(selector, accion) {
  $(selector).on('submit', function (event) {
    event.preventDefault();
    if (selector !== '#loginForm' && !sesionActiva()) {
      window.location.replace('login.html');
      return;
    }
    try { accion.call(this); }
    catch (error) { mostrarError(error); }
    mostrarAvisosDatos();
  });
}

$(document).ready(function () {
  $.fx.off = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esLogin = $('#loginForm').length > 0;
  if (!esLogin && !sesionActiva()) {
    window.location.replace('login.html');
    return;
  }
  $('<div id="estadoDatos" class="d-none" aria-live="polite"></div>').prependTo('.wallet-card');
  try { inicializarDatos(); }
  catch (error) { mostrarError(error); }
  mostrarAvisosDatos();

  function actualizarSaldo() {
    try { $('#saldoActual, #saldoRetiro, #saldoEnvio, #saldoRecepcion').text(formatearMonto(obtenerSaldo())); }
    catch (error) {
      $('#saldoActual, #saldoRetiro, #saldoEnvio, #saldoRecepcion').text('No disponible');
      mostrarError(error);
    }
  }
  if (!esLogin) actualizarSaldo();

  // Volver con el navegador o cerrar sesión desde otra pestaña también revalida el acceso.
  $(window).on('pageshow storage', function () {
    if (!esLogin && !sesionActiva()) window.location.replace('login.html');
    else if (!esLogin) actualizarSaldo();
  });

  alEnviar('#loginForm', function () {
    if (!this.checkValidity()) { $(this).addClass('was-validated'); this.reportValidity(); return; }
    const email = $('#email').val().trim().toLowerCase();
    const correcto = email === USUARIO_VALIDO.email && $('#password').val() === USUARIO_VALIDO.password;
    if (correcto) localStorage.setItem('walletUserEmail', email);
    $('#loginMensaje').removeClass('d-none alert-success alert-danger').addClass(correcto ? 'alert-success' : 'alert-danger')
      .text(correcto ? 'Inicio de sesión exitoso. Redirigiendo al menú…' : 'Correo o contraseña incorrectos.');
    if (correcto) {
      $('#btnLogin').prop('disabled', true).text('Ingresando…');
      setTimeout(() => { window.location.href = 'menu.html'; }, 1200);
    }
  });

  $('#userEmail').text(USUARIO_VALIDO.email);
  const rutas = {
    btnDepositar: 'deposit.html', btnRetirar: 'withdraw.html', btnMenuEnviar: 'sendmoney.html',
    btnRecibir: 'receive.html', btnMovimientos: 'transactions.html'
  };
  Object.keys(rutas).forEach(function (id) {
    $('#' + id).on('click', function () {
      $('#redireccionMensaje').text('Redirigiendo…').removeClass('d-none');
      $('.menu-btn').prop('disabled', true);
      setTimeout(() => { window.location.href = rutas[id]; }, 900);
    });
  });
  $('#logoutLink').on('click', function (event) {
    event.preventDefault();
    try { localStorage.removeItem('walletUserEmail'); window.location.replace('login.html'); }
    catch (error) { mostrarError(error); }
  });

  // Depósito, retiro y recepción comparten el mismo flujo; se conserva cada pantalla.
  function configurarOperacion(formulario, campo, contenedor, tipo, detalle, mensaje) {
    alEnviar(formulario, function () {
      try {
        const nuevoSaldo = registrarOperacion(tipo, detalle, $(campo).val());
        actualizarSaldo();
        $(contenedor).empty().append(crearAlerta('success', mensaje + ' Nuevo saldo: ' + formatearMonto(nuevoSaldo)));
        if (tipo === 'deposito') {
          $('#depositLegend').removeClass('d-none').empty().append(
            $('<span></span>').text('Monto depositado '), $('<strong></strong>').text(formatearMonto(Number($(campo).val())))
          );
        }
        this.reset();
        $(this).removeClass('was-validated').find(':submit').prop('disabled', true).text('Operación realizada');
        setTimeout(() => { window.location.href = 'menu.html'; }, 2000);
      } catch (error) {
        $(contenedor).empty().append(crearAlerta('danger', error.message));
        $(campo).trigger('focus');
      }
    });
  }
  configurarOperacion('#depositForm', '#monto', '#alert-container', 'deposito', 'Depósito a tu cuenta', 'Depósito realizado correctamente.');
  configurarOperacion('#retiroForm', '#montoRetiro', '#retiroAlertContainer', 'retiro', 'Retiro de dinero', 'Retiro realizado correctamente.');
  configurarOperacion('#recepcionForm', '#montoRecepcion', '#recepcionAlertContainer', 'transferencia_recibida', 'Transferencia recibida', 'Dinero recibido correctamente.');

  if ($('#listaContactos').length) {
    let contactoSeleccionado = null;
    function mostrarContactos(filtro) {
      const termino = (filtro || '').trim().toLowerCase();
      const contactos = obtenerContactos().filter(contacto =>
        contacto.nombre.toLowerCase().includes(termino) || contacto.alias.toLowerCase().includes(termino));
      $('#listaContactos').empty();
      $('#sinResultados').toggleClass('d-none', contactos.length > 0);
      contactos.forEach(function (contacto) {
        const seleccionado = contactoSeleccionado && contactoSeleccionado.cbu === contacto.cbu;
        const item = $('<button type="button" class="list-group-item list-group-item-action contact-item d-flex align-items-center justify-content-between py-3"></button>')
          .toggleClass('active', Boolean(seleccionado)).attr('aria-pressed', String(Boolean(seleccionado)));
        const contenido = $('<div class="d-flex align-items-center text-start"></div>').appendTo(item);
        const iniciales = contacto.nombre.trim().split(/\s+/).slice(0, 2).map(p => p.charAt(0)).join('').toUpperCase();
        $('<div class="wallet-icon-circle contact-avatar" aria-hidden="true"></div>').text(iniciales).appendTo(contenido);
        const datos = $('<div class="contact-details"></div>').appendTo(contenido);
        $('<div class="fw-semibold"></div>').text(contacto.nombre).appendTo(datos);
        $('<div class="text-muted small"></div>').text(contacto.alias + ' · ' + contacto.banco).appendTo(datos);
        $('<i class="bi bi-check-circle-fill text-primary select-check" aria-hidden="true"></i>').toggleClass('d-none', !seleccionado).appendTo(item);
        item.on('click', function () {
          contactoSeleccionado = contacto;
          $('.contact-item').removeClass('active').attr('aria-pressed', 'false');
          $('.select-check').addClass('d-none');
          item.addClass('active').attr('aria-pressed', 'true').find('.select-check').removeClass('d-none');
          $('#contactoSeleccionadoNombre').text(contacto.nombre);
          $('#contactoSeleccionadoAlias').text(contacto.alias + ' · ' + contacto.banco);
          $('#contactoSeleccionadoBox').removeClass('d-none').hide().fadeIn();
          $('#envioConfirmacion').addClass('d-none');
        });
        $('#listaContactos').append(item);
      });
    }
    try { mostrarContactos(''); } catch (error) { mostrarError(error); }
    $('#btnMostrarContacto').on('click', function () {
      $(this).attr('aria-expanded', 'true');
      $('#nuevoContactoContainer').stop(true, true).slideDown(() => { $('#contactoNombre').trigger('focus'); });
    });
    function cerrarContacto() {
      $('#nuevoContactoContainer').stop(true, true).slideUp();
      $('#btnMostrarContacto').attr('aria-expanded', 'false').trigger('focus');
    }
    $('#btnCancelarContacto').on('click', function () {
      $('#nuevoContactoForm')[0].reset();
      $('#nuevoContactoForm').removeClass('was-validated');
      $('#contactoAlertContainer').empty();
      cerrarContacto();
    });
    alEnviar('#nuevoContactoForm', function () {
      const contacto = {
        nombre: $('#contactoNombre').val().trim(), cbu: $('#contactoCbu').val().trim(),
        alias: $('#contactoAlias').val().trim(), banco: $('#contactoBanco').val().trim()
      };
      try {
        guardarContacto(contacto);
        this.reset();
        $(this).removeClass('was-validated');
        $('#contactoAlertContainer').empty();
        $('#buscarContacto').val('');
        mostrarContactos('');
        cerrarContacto();
        $('#envioConfirmacion').removeClass('d-none alert-danger').addClass('alert-success').text('Contacto agregado correctamente.');
      } catch (error) {
        $('#contactoAlertContainer').empty().append(crearAlerta('danger', error.message));
      }
    });
    alEnviar('#searchForm', function () { mostrarContactos($('#buscarContacto').val()); });
    $('#buscarContacto').on('input', function () {
      try { mostrarContactos(this.value); mostrarAvisosDatos(); } catch (error) { mostrarError(error); }
    });
    alEnviar('#enviarDineroForm', function () {
      $('#envioConfirmacion').removeClass('d-none alert-success alert-danger').empty();
      try {
        if (!contactoSeleccionado) throw new Error('Seleccioná un contacto antes de enviar dinero.');
        const monto = $('#montoEnvio').val();
        registrarOperacion('transferencia_enviada', 'Transferencia a ' + contactoSeleccionado.nombre, monto);
        actualizarSaldo();
        $('#envioConfirmacion').addClass('alert-success').append(
          $('<i class="bi bi-check-circle me-1" aria-hidden="true"></i>'),
          $('<span></span>').text('Envío realizado con éxito. Enviaste '),
          $('<strong></strong>').text(formatearMonto(Number(monto))),
          $('<span></span>').text(' a ' + contactoSeleccionado.nombre + '.')
        );
        this.reset();
      } catch (error) { $('#envioConfirmacion').addClass('alert-danger').text(error.message); }
    });
  }

  if ($('#listaMovimientos').length) {
    function mostrarUltimosMovimientos(filtro) {
      const movimientos = obtenerMovimientos().filter(m => filtro === 'todos' || m.tipo === filtro);
      $('#listaMovimientos').empty();
      $('#sinMovimientos').toggleClass('d-none', movimientos.length > 0);
      movimientos.forEach(function (movimiento) {
        const positivo = movimiento.monto >= 0;
        const item = $('<div class="list-group-item list-group-item-transaction d-flex align-items-center justify-content-between py-3"></div>');
        const contenido = $('<div class="d-flex align-items-center movement-details"></div>').appendTo(item);
        const icono = $('<div class="wallet-icon-circle transaction-icon" aria-hidden="true"></div>')
          .addClass(positivo ? 'positive-icon' : 'negative-icon').appendTo(contenido);
        $('<i class="bi"></i>').addClass(positivo ? 'bi-arrow-down-left' : 'bi-arrow-up-right').appendTo(icono);
        const datos = $('<div></div>').appendTo(contenido);
        $('<div class="fw-semibold"></div>').text(TIPOS_MOVIMIENTO[movimiento.tipo]).appendTo(datos);
        $('<div class="text-muted small"></div>').text(movimiento.detalle).appendTo(datos);
        $('<time class="text-muted small"></time>').attr('datetime', fechaMovimiento(movimiento.fecha).toISOString())
          .text(fechaMovimiento(movimiento.fecha).toLocaleDateString('es-AR')).appendTo(datos);
        $('<div></div>').addClass(positivo ? 'movement-amount-positive' : 'movement-amount-negative')
          .text((positivo ? '+ ' : '− ') + formatearMonto(Math.abs(movimiento.monto))).appendTo(item);
        $('#listaMovimientos').append(item);
      });
    }
    window.mostrarUltimosMovimientos = mostrarUltimosMovimientos;
    try { mostrarUltimosMovimientos('todos'); } catch (error) { mostrarError(error); }
    $('#filtroTipo').on('change', function () {
      try { mostrarUltimosMovimientos(this.value); mostrarAvisosDatos(); } catch (error) { mostrarError(error); }
    });
  }
});

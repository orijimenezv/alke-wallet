/* Datos y reglas de la demo. No hay autenticación ni base de datos de servidor. */
const USUARIO_VALIDO = { email: 'usuario@wallet.com', password: '1234' };
const CONTACTOS_DEFECTO = [
  { nombre: 'María González', cbu: '0000003100000000123456', alias: 'maria.gonzalez.mp', banco: 'Banco Nación' },
  { nombre: 'Carlos Rodríguez', cbu: '0000003100000000654321', alias: 'carlos.rodri', banco: 'Banco Galicia' },
  { nombre: 'Lucía Fernández', cbu: '0000003100000000987654', alias: 'lu.fernandez', banco: 'Banco Santander' },
  { nombre: 'Karol Tello', cbu: '0000003100000000111111', alias: 'karol.tello', banco: 'Banco Digital' },
  { nombre: 'Merceedes Segovia', cbu: '0000003100000000222222', alias: 'merceedes.segovia', banco: 'Banco Digital' },
  { nombre: 'Darwin Jimenez', cbu: '0000003100000000333333', alias: 'darwin.jimenez', banco: 'Banco Digital' }
];
// Apertura: 11.100 + estos movimientos = 15.000 ARS.
const MOVIMIENTOS_DEFECTO = [
  { tipo: 'compra', detalle: 'Compra en supermercado', monto: -2500, fecha: '2026-09-02T12:00:00-03:00' },
  { tipo: 'deposito', detalle: 'Depósito a tu cuenta', monto: 5000, fecha: '2026-09-03T12:00:00-03:00' },
  { tipo: 'transferencia_recibida', detalle: 'Transferencia recibida de Ana', monto: 3200, fecha: '2026-09-04T12:00:00-03:00' },
  { tipo: 'transferencia_enviada', detalle: 'Transferencia enviada a Carlos', monto: -1800, fecha: '2026-09-05T12:00:00-03:00' }
];
const TIPOS_MOVIMIENTO = {
  compra: 'Compra', deposito: 'Depósito', retiro: 'Retiro',
  transferencia_recibida: 'Transferencia recibida', transferencia_enviada: 'Transferencia enviada'
};
const avisosDatos = new Set();
// Un límite explícito mantiene todos los cálculos en enteros seguros.
const MAX_CENTAVOS = 99999999999;

function aCentavos(entrada) {
  const texto = String(entrada).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(texto)) return null;
  const partes = texto.split('.');
  const centavos = Number(partes[0]) * 100 + Number((partes[1] || '').padEnd(2, '0'));
  return Number.isSafeInteger(centavos) && centavos <= MAX_CENTAVOS ? centavos : null;
}

function validarMonto(entrada) {
  const centavos = aCentavos(entrada);
  if (centavos === null || centavos <= 0) {
    throw new Error('Ingresá un monto mayor a cero, con hasta dos decimales y máximo 999.999.999,99.');
  }
  return centavos;
}

function formatearMonto(valor) {
  return Number(valor).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

function fechaMovimiento(valor) {
  if (typeof valor !== 'string') return null;
  // Compatibilidad con fechas dd/mm/aaaa guardadas por la versión anterior.
  const anterior = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (anterior) {
    const [, dia, mes, anio] = anterior.map(Number);
    const fecha = new Date(anio, mes - 1, dia, 12);
    return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia ? fecha : null;
  }
  if (!/^\d{4}-\d{2}-\d{2}T/.test(valor)) return null;
  const fecha = new Date(valor);
  return Number.isFinite(fecha.getTime()) ? fecha : null;
}

function contactoValido(contacto) {
  return contacto && ['nombre', 'alias', 'banco'].every(campo =>
    typeof contacto[campo] === 'string' && contacto[campo].trim().length > 0
  ) && typeof contacto.cbu === 'string' && /^\d{22}$/.test(contacto.cbu);
}

function movimientoValido(movimiento) {
  return movimiento && Object.hasOwn(TIPOS_MOVIMIENTO, movimiento.tipo) &&
    typeof movimiento.detalle === 'string' && typeof movimiento.monto === 'number' &&
    Number.isFinite(movimiento.monto) && aCentavos(Math.abs(movimiento.monto)) !== null &&
    fechaMovimiento(movimiento.fecha) !== null;
}

function leerLista(clave, defecto, validar) {
  const original = localStorage.getItem(clave);
  if (original === null) {
    localStorage.setItem(clave, JSON.stringify(defecto));
    return defecto.slice();
  }
  let lista;
  try { lista = JSON.parse(original); } catch { lista = null; }
  if (Array.isArray(lista) && lista.every(validar)) return lista;
  // Preservar el original antes de reparar. Si no hay espacio, no sobrescribirlo.
  localStorage.setItem(clave + 'Respaldo-' + Date.now(), original);
  const recuperados = Array.isArray(lista) ? lista.filter(validar) : defecto.slice();
  localStorage.setItem(clave, JSON.stringify(recuperados));
  avisosDatos.add('Se recuperó ' + clave + '. El original se conservó en una clave Respaldo. Revisá tus datos; el historial recuperado puede estar incompleto.');
  return recuperados;
}

function obtenerContactos() {
  return leerLista('walletContactos', CONTACTOS_DEFECTO, contactoValido);
}

function obtenerMovimientos() {
  // Si ya existe un saldo, no inventar movimientos históricos cuando falta la lista.
  return leerLista('walletMovimientos', [], movimientoValido)
    .sort((a, b) => fechaMovimiento(b.fecha) - fechaMovimiento(a.fecha));
}

function obtenerSaldoCentavos() {
  const saldo = aCentavos(localStorage.getItem('walletSaldo') ?? '');
  if (saldo === null) throw new Error('El saldo guardado no es válido. No se modificó. Revisá walletSaldo en localStorage o seguí el README para reiniciar la demo.');
  return saldo;
}

function obtenerSaldo() { return obtenerSaldoCentavos() / 100; }

function inicializarDatos() {
  const nuevaDemo = localStorage.getItem('walletSaldo') === null && localStorage.getItem('walletMovimientos') === null;
  if (nuevaDemo) {
    localStorage.setItem('walletSaldo', '15000');
    localStorage.setItem('walletMovimientos', JSON.stringify(MOVIMIENTOS_DEFECTO));
  }
  obtenerContactos();
  obtenerMovimientos();
}

function sesionActiva() {
  try { return (localStorage.getItem('walletUserEmail') || '').toLowerCase() === USUARIO_VALIDO.email; }
  catch { return false; }
}

function guardarContacto(contacto) {
  if (!contactoValido(contacto)) throw new Error('Completá todos los campos y un CBU de 22 dígitos.');
  const contactos = obtenerContactos();
  if (contactos.some(actual => actual.cbu === contacto.cbu || actual.alias.trim().toLowerCase() === contacto.alias.toLowerCase())) {
    throw new Error('Ya existe un contacto con ese alias o CBU.');
  }
  contactos.push(contacto);
  localStorage.setItem('walletContactos', JSON.stringify(contactos));
}

function registrarOperacion(tipo, detalle, entrada) {
  if (!sesionActiva()) throw new Error('Iniciá sesión nuevamente para operar.');
  const centavos = validarMonto(entrada);
  const esSalida = tipo === 'retiro' || tipo === 'transferencia_enviada';
  const saldo = obtenerSaldoCentavos();
  if (esSalida && centavos > saldo) throw new Error('Saldo insuficiente para realizar la operación.');
  const nuevoSaldo = saldo + (esSalida ? -centavos : centavos);
  if (nuevoSaldo > MAX_CENTAVOS) throw new Error('La operación supera el saldo máximo de la demo.');
  const movimientos = obtenerMovimientos();
  movimientos.unshift({ tipo, detalle, monto: (esSalida ? -centavos : centavos) / 100, fecha: new Date().toISOString() });
  const anteriores = localStorage.getItem('walletMovimientos');
  // No mostrar éxito si una escritura falla. Restaurar el historial si falla el saldo.
  localStorage.setItem('walletMovimientos', JSON.stringify(movimientos));
  try { localStorage.setItem('walletSaldo', String(nuevoSaldo / 100)); }
  catch (error) {
    localStorage.setItem('walletMovimientos', anteriores);
    throw error;
  }
  return nuevoSaldo / 100;
}

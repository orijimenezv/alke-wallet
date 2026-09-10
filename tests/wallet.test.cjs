const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function demo(initial = {}) {
  const data = new Map(Object.entries(initial));
  const localStorage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  };
  const app = vm.createContext({ localStorage });
  vm.runInContext(fs.readFileSync(path.join(root, 'js/wallet.js'), 'utf8'), app);
  app.inicializarDatos();
  return { app, data, localStorage };
}
function login(data) { data.set('walletUserEmail', 'usuario@wallet.com'); }

test('datos iniciales coherentes y movimientos del más reciente al más antiguo', () => {
  const { app } = demo();
  assert.equal(app.obtenerSaldo(), 15000);
  const movimientos = app.obtenerMovimientos();
  assert.equal(movimientos.length, 4);
  assert.equal(11100 + movimientos.reduce((s, m) => s + m.monto, 0), 15000);
  assert.equal(movimientos[0].tipo, 'transferencia_enviada');
  assert.equal(app.obtenerContactos().length, 6);
});

test('montos inválidos, infinito, límites y más de dos decimales', () => {
  const { app } = demo();
  for (const valor of ['', ' ', '0', '-1', 'NaN', 'Infinity', '1e3', '0.001', '1.999', '1000000000', 'abc']) {
    assert.throws(() => app.validarMonto(valor), undefined, valor);
  }
  assert.equal(app.validarMonto('0.01'), 1);
  assert.equal(app.validarMonto('123.45'), 12345);
});

test('depósito, retiro, envío y recepción con persistencia y cálculo exacto', () => {
  const { app, data } = demo(); login(data);
  app.registrarOperacion('deposito', 'Depósito', '0.10');
  app.registrarOperacion('transferencia_recibida', 'Recepción', '0.20');
  assert.equal(data.get('walletSaldo'), '15000.3');
  app.registrarOperacion('retiro', 'Retiro', '20');
  app.registrarOperacion('transferencia_enviada', 'Envío', '10.25');
  assert.equal(app.obtenerSaldo(), 14970.05);
  assert.equal(app.obtenerMovimientos().length, 8);
  const recarga = demo(Object.fromEntries(data));
  assert.equal(recarga.app.obtenerSaldo(), 14970.05);
  assert.equal(recarga.app.obtenerMovimientos().length, 8);
});

test('saldo insuficiente y sesión ausente no generan operaciones', () => {
  const { app, data } = demo();
  assert.throws(() => app.registrarOperacion('deposito', 'Sin sesión', '1'), /sesión/);
  login(data);
  for (const tipo of ['retiro', 'transferencia_enviada']) {
    assert.throws(() => app.registrarOperacion(tipo, 'Sin saldo', '15000.01'), /insuficiente/);
  }
  assert.equal(app.obtenerSaldo(), 15000);
  assert.equal(app.obtenerMovimientos().length, 4);
  data.delete('walletUserEmail'); assert.equal(app.sesionActiva(), false);
});

test('contactos únicos por CBU y alias sin distinguir mayúsculas', () => {
  const { app, data } = demo();
  const contacto = { nombre: '<b>Prueba</b>', alias: 'prueba.unica', banco: 'Demo', cbu: '1234567890123456789012' };
  app.guardarContacto(contacto);
  assert.equal(app.obtenerContactos().length, 7);
  assert.throws(() => app.guardarContacto({ ...contacto, alias: 'otro' }), /existe/);
  assert.throws(() => app.guardarContacto({ ...contacto, cbu: '1234567890123456789013', alias: 'PRUEBA.UNICA' }), /existe/);
  assert.throws(() => app.guardarContacto({ ...contacto, cbu: '123' }), /22/);
  assert.equal(demo(Object.fromEntries(data)).app.obtenerContactos().length, 7);
});

test('JSON corrupto, null y estructuras inválidas se respaldan sin romper la demo', () => {
  for (const original of ['broken', 'null', '{}', '[null,{}]']) {
    const { app, data } = demo({ walletContactos: original, walletMovimientos: original, walletSaldo: '42' });
    assert.ok(Array.isArray(app.obtenerContactos()));
    assert.ok(Array.isArray(app.obtenerMovimientos()));
    assert.equal(app.obtenerSaldo(), 42);
    assert.ok([...data].some(([key, value]) => key.startsWith('walletContactosRespaldo-') && value === original));
  }
});

test('saldo corrupto se conserva y bloquea operaciones', () => {
  const { app, data } = demo({ walletSaldo: 'NaN' }); login(data);
  assert.throws(() => app.registrarOperacion('deposito', 'Prueba', '1'), /saldo guardado/);
  assert.equal(data.get('walletSaldo'), 'NaN');
});

test('fecha anterior dd/mm/aaaa e ISO se ordenan juntas', () => {
  const movimientos = [
    { tipo: 'deposito', detalle: 'Viejo', monto: 1, fecha: '2/9/2026' },
    { tipo: 'retiro', detalle: 'Nuevo', monto: -1, fecha: '2026-09-10T12:00:00Z' }
  ];
  const { app } = demo({ walletSaldo: '10', walletMovimientos: JSON.stringify(movimientos) });
  assert.equal(app.obtenerMovimientos()[0].detalle, 'Nuevo');
  assert.equal(app.fechaMovimiento('31/2/2026'), null);
});

test('fallo al guardar saldo restaura historial y no confirma la operación', () => {
  const { app, data, localStorage } = demo(); login(data);
  const antes = data.get('walletMovimientos');
  const setItem = localStorage.setItem;
  localStorage.setItem = (key, value) => { if (key === 'walletSaldo') throw new Error('Sin espacio'); setItem(key, value); };
  assert.throws(() => app.registrarOperacion('deposito', 'Prueba', '1'), /Sin espacio/);
  assert.equal(data.get('walletMovimientos'), antes);
  assert.equal(app.obtenerSaldo(), 15000);
});

test('HTML: rutas existentes, identificadores únicos y un h1 por pantalla', () => {
  for (const file of fs.readdirSync(root).filter(f => f.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.equal((html.match(/<h1\b/g) || []).length, 1, file);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, file);
    for (const [, link] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|#)/.test(link)) continue;
      assert.ok(fs.existsSync(path.resolve(root, link)), file + ': ' + link);
    }
    if (file !== 'index.html') assert.ok(html.indexOf('js/wallet.js') < html.indexOf('js/script.js'), file);
  }
});

test('saldos de la versión anterior con ruido decimal conservan su valor', () => {
  const { app, data } = demo({ walletSaldo: '15000.300000000001' }); login(data);
  assert.equal(app.obtenerSaldo(), 15000.3);
  app.registrarOperacion('deposito', 'Prueba', '0.01');
  assert.equal(data.get('walletSaldo'), '15000.31');
  assert.equal(app.centavosGuardados('1.234'), null);
});

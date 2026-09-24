// PromptPay QR payload builder — EMVCo TLV (ไม่ต้องพึ่งไลบรารีภายนอก)
// ใช้ได้ทั้งในเบราว์เซอร์ (window.buildPromptPayPayload) และใน Node (module.exports)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PromptPayQR = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  function f(id, value) { return id + ('00' + String(value).length).slice(-2) + value; }
  function serialize(xs) { return xs.filter(function (x) { return x; }).join(''); }
  function sanitize(id) { return String(id == null ? '' : id).replace(/[^0-9]/g, ''); }

  function formatTarget(id) {
    var n = sanitize(id);
    if (n.length >= 13) return n;
    return ('0000000000000' + n.replace(/^0/, '66')).slice(-13);
  }
  function crc16xmodem(str) {
    var crc = 0xFFFF;
    for (var i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (var j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? (((crc << 1) ^ 0x1021) & 0xFFFF) : ((crc << 1) & 0xFFFF);
      }
    }
    return ('0000' + crc.toString(16).toUpperCase()).slice(-4);
  }

  function build(target, amount) {
    var t = sanitize(target);
    if (!t) throw new Error('ต้องใส่เลขพร้อมเพย์/เบอร์โทร');
    var targetType = t.length >= 15 ? '03' : (t.length >= 13 ? '02' : '01');
    var amt = (amount === null || amount === undefined || amount === '' || Number(amount) <= 0)
      ? null : Number(amount).toFixed(2);

    var data = [
      f('00', '01'),
      f('01', amt ? '12' : '11'),
      f('29', serialize([f('00', 'A000000677010111'), f(targetType, formatTarget(t))])),
      f('58', 'TH'),
      f('53', '764'),
      amt && f('54', amt)
    ];
    var body = serialize(data) + '6304';
    return serialize(data) + f('63', crc16xmodem(body));
  }

  return { build: build, crc16xmodem: crc16xmodem };
}));

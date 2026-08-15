// ── ZIP writer (store only) ──────────────────────────────────
// The bundle is four to ten small files. Handing them over as one
// download beats ten Save dialogs, and a stored (uncompressed) archive
// needs no library: headers, CRC32, central directory, done.
//
// Deliberately minimal — no compression, no zip64, no encryption. Files
// over 4GB are out of scope for a design spec.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** MS-DOS packed date and time, which is what the format stores. */
function dosStamp(date = new Date()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time: time & 0xffff, date: day & 0xffff };
}

function writer(size) {
  const buf = new Uint8Array(size);
  const view = new DataView(buf.buffer);
  let at = 0;
  return {
    buf,
    u16(v) { view.setUint16(at, v, true); at += 2; },
    u32(v) { view.setUint32(at, v >>> 0, true); at += 4; },
    bytes(b) { buf.set(b, at); at += b.length; },
    get offset() { return at; },
  };
}

/**
 * @param {{name: string, data: Uint8Array}[]} files
 * @returns {Blob} an application/zip blob
 */
export function makeZip(files) {
  const enc = new TextEncoder();
  const stamp = dosStamp();

  const entries = files.map((f) => {
    const name = enc.encode(f.name);
    return { name, data: f.data, crc: crc32(f.data), offset: 0 };
  });

  const localSize = entries.reduce((n, e) => n + 30 + e.name.length + e.data.length, 0);
  const centralSize = entries.reduce((n, e) => n + 46 + e.name.length, 0);
  const w = writer(localSize + centralSize + 22);

  entries.forEach((e) => {
    e.offset = w.offset;
    w.u32(0x04034b50);
    w.u16(20);          // version needed
    w.u16(0x0800);      // flag: names are UTF-8
    w.u16(0);           // method: stored
    w.u16(stamp.time);
    w.u16(stamp.date);
    w.u32(e.crc);
    w.u32(e.data.length);
    w.u32(e.data.length);
    w.u16(e.name.length);
    w.u16(0);           // extra field length
    w.bytes(e.name);
    w.bytes(e.data);
  });

  const centralStart = w.offset;
  entries.forEach((e) => {
    w.u32(0x02014b50);
    w.u16(20);          // version made by
    w.u16(20);          // version needed
    w.u16(0x0800);
    w.u16(0);
    w.u16(stamp.time);
    w.u16(stamp.date);
    w.u32(e.crc);
    w.u32(e.data.length);
    w.u32(e.data.length);
    w.u16(e.name.length);
    w.u16(0);           // extra
    w.u16(0);           // comment
    w.u16(0);           // disk number
    w.u16(0);           // internal attrs
    w.u32(0);           // external attrs
    w.u32(e.offset);
    w.bytes(e.name);
  });

  // Measure the directory before writing the record that describes it —
  // reading w.offset mid-record would count this record's own bytes.
  const centralBytes = w.offset - centralStart;
  w.u32(0x06054b50);
  w.u16(0);           // this disk
  w.u16(0);           // disk holding the directory
  w.u16(entries.length);
  w.u16(entries.length);
  w.u32(centralBytes);
  w.u32(centralStart);
  w.u16(0);           // comment

  return new Blob([w.buf], { type: 'application/zip' });
}

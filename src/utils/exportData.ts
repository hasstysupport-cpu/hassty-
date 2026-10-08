/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/* ============================================================
   exportData — تصدير البيانات Excel (.xlsx) و PDF بدون مكتبات خارجية
   ------------------------------------------------------------
   - Excel: كاتب XLSX حقيقي (ZIP Stored + Inline Strings + RTL sheet)
   - PDF:   صفحة A4 تضمين JPEG عبر DCTDecode (يُرسم عبر html-to-image)
             ⇒ العربية تظهر سليمة 100% لأن المحتوى يُرسم كم صورة
   ============================================================ */

export interface ExportColumn<T = any> {
  key: string;
  label: string;
  width?: number;
  format?: (row: T) => string | number;
}

/* ---------- CRC32 (لأرشيف ZIP بصيغة Stored) ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/* ---------- كتابة أرقام little-endian ---------- */
const u16 = (v: number) => new Uint8Array([v & 0xff, (v >> 8) & 0xff]);
const u32 = (v: number) => new Uint8Array([v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >>> 24) & 0xff]);

/* ---------- ZIP بسيط بضغط Stored ---------- */
function makeZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const crc = crc32(f.data);
    const size = f.data.length;

    const local = [
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(size), u32(size), u16(nameBytes.length), u16(0),
      nameBytes, f.data,
    ];
    locals.push(concat(local));

    const central = [
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(size), u32(size), u16(nameBytes.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(offset), nameBytes,
    ];
    centrals.push(concat(central));

    offset += concat(local).length;
  }

  const centralBuf = concat(centrals);
  const eocd = concat([
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(centralBuf.length), u32(offset), u16(0),
  ]);
  return concat([...locals, centralBuf, eocd]);
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) { out.set(p, pos); pos += p.length; }
  return out;
}

/* ---------- XML helpers ---------- */
const xmlEscape = (s: string) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
  // إزالة محارف تحكم غير صالحة في XML
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');

const colLetter = (i: number): string => {
  let s = '';
  let n = i + 1;
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
};

function cellValue(row: any, col: ExportColumn): string | number {
  const raw = col.format ? col.format(row) : row?.[col.key];
  if (typeof raw === 'number' && isFinite(raw)) return raw;
  return String(raw ?? '');
}

/* ---------- كاتب XLSX (ورقة واحدة RTL) ---------- */
function buildXlsx(sheetName: string, columns: ExportColumn[], rows: any[]): Uint8Array {
  const enc = new TextEncoder();
  const NC = columns.length;
  const sheetRows: string[] = [];

  // صف العناوين (تظليل خفيف عبر النمجبد البسيط)
  const headCells = columns.map((c, i) =>
    `<c r="${colLetter(i)}1" t="inlineStr" s="1"><is><t xml:space="preserve">${xmlEscape(c.label)}</t></is></c>`).join('');
  sheetRows.push(`<row r="1">${headCells}</row>`);

  rows.forEach((row, ri) => {
    const r = ri + 2;
    const cells = columns.map((c, ci) => {
      const v = cellValue(row, c);
      const ref = `${colLetter(ci)}${r}`;
      return typeof v === 'number'
        ? `<c r="${ref}"><v>${v}</v></c>`
        : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(v)}</t></is></c>`;
    }).join('');
    sheetRows.push(`<row r="${r}">${cells}</row>`);
  });

  const cols = columns.map((c, i) =>
    `<col min="${i + 1}" max="${i + 1}" width="${c.width || Math.max(12, c.label.length + 4)}" customWidth="1"/>`).join('');

  const safeSheet = xmlEscape(sheetName).slice(0, 28) || 'بيانات';

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetPr><rightToLeft/></sheetPr>
<dimension ref="A1:${colLetter(NC - 1)}${Math.max(rows.length + 1, 2)}"/>
<cols>${cols}</cols>
<sheetData>${sheetRows.join('')}</sheetData>
</worksheet>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${safeSheet}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  return makeZip([
    { name: '[Content_Types].xml', data: enc.encode(contentTypes) },
    { name: '_rels/.rels', data: enc.encode(rootRels) },
    { name: 'xl/workbook.xml', data: enc.encode(workbookXml) },
    { name: 'xl/_rels/workbook.xml.rels', data: enc.encode(wbRels) },
    { name: 'xl/styles.xml', data: enc.encode(stylesXml) },
    { name: 'xl/worksheets/sheet1.xml', data: enc.encode(sheetXml) },
  ]);
}

/* ---------- تنزيل ملف من المتصفح ---------- */
function downloadBlob(data: BlobPart, filename: string, type: string) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ============================================================
   1) تصدير Excel — ملف .xlsx حقيقي يفتح مباشرة في Excel
   ============================================================ */
export async function exportToExcel<T = any>(options: {
  filename: string;
  sheetName?: string;
  columns: ExportColumn<T>[];
  rows: T[];
}): Promise<void> {
  const { filename, sheetName = 'بيانات', columns, rows } = options;
  const xlsxBytes = buildXlsx(sheetName, columns as ExportColumn[], rows as any[]);
  downloadBlob(xlsxBytes, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

/* ============================================================
   2) تصدير PDF — A4 مع ترويسة وجدول عربي مرسوم كصورة عالية الدقة
   ============================================================ */
export async function exportToPdf<T = any>(options: {
  filename: string;
  title: string;
  subtitle?: string;
  columns: ExportColumn<T>[];
  rows: T[];
  footer?: string;
}): Promise<void> {
  const { filename, title, subtitle, columns, rows, footer } = options;
  const { toJpeg } = await import('html-to-image');

  /* 1) بناء جدول HTML خارج الشاشة بتنسيق نظيف */
  const host = document.createElement('div');
  host.setAttribute('dir', 'rtl');
  host.style.cssText = 'position:fixed;left:-99999px;top:0;width:1240px;background:#ffffff;font-family:"Segoe UI",Tahoma,Arial,sans-serif;';
  const esc = (s: any) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const headHtml = columns.map((c) => `<th>${esc(c.label)}</th>`).join('');
  const bodyHtml = (rows as any[]).map((row) => {
    const cells = columns.map((c) => {
      const v = cellValue(row, c);
      const isNum = typeof v === 'number';
      return `<td class="${isNum ? 'num' : ''}">${esc(isNum ? v.toLocaleString('ar-EG') : v)}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  host.innerHTML = `
    <div style="padding:34px 38px 26px;">
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:4px solid #2563EB;padding-bottom:14px;margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#2563EB,#7C3AED);"></div>
          <div>
            <div style="font-size:22px;font-weight:900;color:#1E3A8A;">حِصّتي — منصة الدروس الخصوصية</div>
            <div style="font-size:12px;color:#64748B;font-weight:700;">hassty.site</div>
          </div>
        </div>
        <div style="font-size:11px;color:#94A3B8;font-weight:700;">تصدير بتاريخ ${new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>
      <div style="font-size:19px;font-weight:900;color:#0f172a;margin:16px 0 2px;">${esc(title)}</div>
      ${subtitle ? `<div style="font-size:12px;color:#475569;font-weight:700;margin-bottom:10px;">${esc(subtitle)}</div>` : ''}
      <table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-top:10px;">
        <thead><tr style="background:#EFF6FF;">${headHtml}</tr></thead>
        <tbody>${bodyHtml}</tbody>
      </table>
      <div style="margin-top:18px;font-size:10.5px;color:#94A3B8;border-top:1px solid #E2E8F0;padding-top:10px;">
        ${esc(footer || `إجمالي السجلات: ${rows.length}`)} — تُصدر من نظام حِصّتي تلقائيًا
      </div>
    </div>
    <style>
      th { border:1px solid #CBD5E1; padding:8px 10px; font-weight:900; color:#1E3A8A; text-align:right; background:#EFF6FF; font-size:12px; }
      td { border:1px solid #E2E8F0; padding:7px 10px; text-align:right; color:#1f2937; }
      td.num { font-weight:800; direction:ltr; text-align:left; font-variant-numeric:tabular-nums; }
      tbody tr:nth-child(even) { background:#F8FAFC; }
    </style>`;
  document.body.appendChild(host);

  try {
    /* 2) رسم JPEG عالي الدقة */
    const dataUrl = await toJpeg(host, { quality: 0.94, pixelRatio: 2, backgroundColor: '#ffffff' });
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('تعذر تجهيز الصورة للتصدير'));
      img.src = dataUrl;
    });

    /* 3) بناء PDF يدويًا: صفحة A4 تحتوي صورة JPEG (DCTDecode) */
    const jpegBytes = base64ToBytes(dataUrl.split(',')[1] || '');
    const pdfBytes = buildImagePdf(img.width, img.height, jpegBytes);
    downloadBlob(pdfBytes, `${filename}.pdf`, 'application/pdf');
  } finally {
    host.remove();
  }
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* بناء PDF: صورة A4 عمودية، والمحتوى الأطول يُقسم على عدة صفحات تلقائيًا */
function buildImagePdf(imgW: number, imgH: number, jpeg: Uint8Array): Uint8Array {
  const A4W = 595.28, A4H = 841.89, MARGIN = 20;
  const availW = A4W - MARGIN * 2, availH = A4H - MARGIN * 2;

  /* مقياس موحد بعرض الصفحة — الارتفاع الكلي بالنتائج قد يتجاوز صفحة */
  const s = availW / imgW;
  const totalH = imgH * s;
  const pageCount = totalH <= availH ? 1 : Math.ceil(totalH / availH);

  const imgObj = 3;              // 1: Catalog | 2: Pages | 3: Image | 4..: Page/Content أزواج
  const firstPageObj = 4;
  const pageObjNums: number[] = [];
  const objects: (string | undefined)[] = [];

  for (let p = 0; p < pageCount; p++) {
    const pageObj = firstPageObj + p * 2;
    const contentObj = pageObj + 1;
    pageObjNums.push(pageObj);

    /* كل صفحة ترسم نفس الصورة بنفس المقياس مع إزاحة رأسية سالبة تعادل شرائحها */
    const ty = MARGIN - p * availH;
    const content = `q ${s} 0 0 ${s} ${MARGIN} ${ty.toFixed(2)} cm /Im0 Do Q`;
    objects[pageObj - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4W} ${A4H}] /Resources << /XObject << /Im0 ${imgObj} 0 R >> >> /Contents ${contentObj} 0 R >>`;
    objects[contentObj - 1] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  }

  const kids = pageObjNums.map((n) => `${n} 0 R`).join(' ');
  objects[0] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[1] = `<< /Type /Pages /Count ${pageCount} /Kids [${kids}] >>`;
  objects[2] = `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n__JPEGBYTES__\nendstream`;

  /* تسلسل البايتات مع مواضع الكائنات */
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let pos = 0;
  const push = (b: Uint8Array) => { parts.push(b); pos += b.length; };

  push(enc.encode('%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n'));
  for (let i = 0; i < objects.length; i++) {
    const objNum = i + 1;
    const body = objects[i];
    if (body === undefined) continue; // حلقة الأمان
    if (objNum === imgObj) {
      offsets[objNum] = pos;
      const before = enc.encode(`${objNum} 0 obj\n${body.split('__JPEGBYTES__')[0]}`);
      const after = enc.encode(`\nendstream\nendobj\n`);
      push(before); push(jpeg); push(after);
    } else {
      offsets[objNum] = pos;
      push(enc.encode(`${objNum} 0 obj\n${body}\nendobj\n`));
    }
  }

  const xrefStart = pos;
  const totalObjs = objects.length;
  let xref = `xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= totalObjs; i++) {
    xref += `${String(offsets[i] || 0).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  push(enc.encode(xref + trailer));

  return concat(parts);
}

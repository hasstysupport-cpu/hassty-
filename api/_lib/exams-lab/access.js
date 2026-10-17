import { createHmac, timingSafeEqual } from 'node:crypto';
const attempts = new Map();
function sign(exp, secret) { return createHmac("sha256", secret).update(String(exp)).digest("base64url"); }
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const secure = process.env.VERCEL_ENV === "production" || req.headers["x-forwarded-proto"] === "https";
  const clear = "exam_lab_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0" + (secure ? "; Secure" : "");
  if (req.method === "GET" && req.query && req.query.logout === "1") {
    res.setHeader("Set-Cookie", clear);
    return res.status(200).json({ ok: true });
  }
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });
  const ip = String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const now = Date.now();
  const rec = attempts.get(ip) || { count: 0, reset: now + 10 * 60 * 1000 };
  if (now > rec.reset) { rec.count = 0; rec.reset = now + 10 * 60 * 1000; }
  if (rec.count >= 12) return res.status(429).json({ ok: false, message: "محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا." });
  const expected = process.env.EXAMS_ACCESS_CODE || "";
  const supplied = String((req.body && req.body.code) || "");
  const matches = expected.length > 0 && supplied.length === expected.length &&
    timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
  if (!matches) {
    rec.count += 1; attempts.set(ip, rec);
    return res.status(401).json({ ok: false, message: "كود الدخول غير صحيح." });
  }
  if (!process.env.EXAMS_SESSION_SECRET) return res.status(503).json({ ok: false, message: "إعدادات الحماية غير مكتملة." });
  attempts.delete(ip);
  const exp = now + 12 * 60 * 60 * 1000;
  const value = String(exp) + "." + sign(exp, process.env.EXAMS_SESSION_SECRET);
  res.setHeader("Set-Cookie", "exam_lab_session=" + value + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200" + (secure ? "; Secure" : ""));
  return res.status(200).json({ ok: true, expiresAt: exp });
};
// Email adapters. Add a provider: write an adapter here, register it in emailProvider(), and add a row to
// public.integration_providers (config_fields / secret_fields) in a migration. Staff then switch in the admin.
//
// resend      HTTPS API.
// smtp        Any SMTP server. A small built-in client (EHLO, optional STARTTLS, AUTH PLAIN or LOGIN, one
//             recipient). Supabase Edge Functions block outgoing ports 25 and 587, so use 465 (TLS) or
//             another port the server offers.
// mock_email  Development only: accepts everything and sends nothing.
import type { EmailMessage, EmailProvider, FetchFn, Result, Runtime } from './types.ts';
import { TIMEOUT_MS } from './types.ts';

const ADDRESS = /^[^@\s<>"',;:\\()[\]]+@[^@\s<>"',;:\\()[\]]+\.[a-z]{2,}$/i;

export function isEmailAddress(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.length <= 254 && ADDRESS.test(value);
}

/** Removes characters that could start a new header line. */
const oneLine = (s: string) => s.replace(/[\r\n\u0000-\u001f\u007f]+/g, ' ').trim();

type Sender = { from: string; name: string; replyTo: string | null };

function sender(rt: Runtime): Sender | null {
  const from = (rt.config.from_email ?? '').trim();
  const replyTo = (rt.config.reply_to ?? '').trim();
  if (!isEmailAddress(from)) return null;
  return { from, name: oneLine(rt.config.from_name ?? '').replace(/["<>]/g, '').slice(0, 60), replyTo: isEmailAddress(replyTo) ? replyTo : null };
}

export const mockEmail: EmailProvider = {
  send: async () => ({ ok: true, value: { messageId: `mock-${crypto.randomUUID()}` } }),
};

/** Resend: POST https://api.resend.com/emails with a Bearer key. */
export function resend(rt: Runtime, fetchFn: FetchFn = fetch): EmailProvider {
  return {
    async send(m) {
      const key = rt.secrets.api_key;
      const s = sender(rt);
      if (!key || !s) return { ok: false, error: 'not_configured' };
      if (!isEmailAddress(m.to)) return { ok: false, error: 'rejected', detail: 'bad_recipient' };

      let res: Response;
      try {
        res = await fetchFn('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            from: s.name ? `${s.name} <${s.from}>` : s.from,
            to: [m.to],
            subject: oneLine(m.subject),
            text: m.text,
            html: m.html,
            ...(s.replyTo ? { reply_to: s.replyTo } : {}),
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      } catch {
        return { ok: false, error: 'unavailable' };
      }
      let body: Record<string, unknown> = {};
      try {
        body = (await res.json()) as Record<string, unknown>;
      } catch {
        /* keep empty */
      }
      if (res.ok && typeof body.id === 'string') return { ok: true, value: { messageId: body.id }, httpStatus: res.status };
      if (res.ok) return { ok: false, error: 'bad_response', httpStatus: res.status };
      const error = res.status >= 500 || res.status === 429 ? 'unavailable' : 'rejected';
      // Resend's error name (validation_error, invalid_api_key...) never contains the recipient.
      const name = typeof body.name === 'string' ? body.name.replace(/[^a-z_]/gi, '').slice(0, 40) : '';
      return { ok: false, error, detail: name || undefined, httpStatus: res.status };
    },
  };
}

// ---------------------------------------------------------------------------------------------
// SMTP
// ---------------------------------------------------------------------------------------------

export type SmtpConn = {
  read(buf: Uint8Array): Promise<number | null>;
  write(data: Uint8Array): Promise<number>;
  close(): void;
};

export type SmtpConnector = {
  connect(host: string, port: number, tls: boolean): Promise<SmtpConn>;
  startTls(conn: SmtpConn, host: string): Promise<SmtpConn>;
};

type DenoNet = {
  connect(o: { hostname: string; port: number }): Promise<SmtpConn>;
  connectTls(o: { hostname: string; port: number }): Promise<SmtpConn>;
  startTls(c: SmtpConn, o: { hostname: string }): Promise<SmtpConn>;
};

/** Deno's sockets (the Edge runtime). Not available under Node, where tests pass their own connector. */
export const denoConnector: SmtpConnector = {
  connect(host, port, tls) {
    const d = (globalThis as unknown as { Deno?: DenoNet }).Deno;
    if (!d) return Promise.reject(new Error('no sockets'));
    return tls ? d.connectTls({ hostname: host, port }) : d.connect({ hostname: host, port });
  },
  startTls(conn, host) {
    const d = (globalThis as unknown as { Deno?: DenoNet }).Deno;
    if (!d) return Promise.reject(new Error('no sockets'));
    return d.startTls(conn, { hostname: host });
  },
};

const enc = new TextEncoder();
const dec = new TextDecoder();

export function base64Utf8(s: string): string {
  const bytes = enc.encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

const wrap76 = (s: string) => s.replace(/.{1,76}/g, '$&\r\n');
const encodedWord = (s: string) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${base64Utf8(s)}?=`);

/** A multipart/alternative message (plain text and HTML, both UTF-8, base64). */
export function buildMime(m: EmailMessage, s: Sender, now = new Date(), id = crypto.randomUUID()): string {
  const boundary = `b-${id}`;
  const domain = s.from.split('@')[1] ?? 'localhost';
  const from = s.name ? `"${encodedWord(s.name)}" <${s.from}>` : s.from;
  const headers = [
    `From: ${from}`,
    `To: <${m.to}>`,
    ...(s.replyTo ? [`Reply-To: <${s.replyTo}>`] : []),
    `Subject: ${encodedWord(oneLine(m.subject))}`,
    `Date: ${now.toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${id}@${domain}>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  const part = (type: string, body: string) =>
    [`--${boundary}`, `Content-Type: ${type}; charset=UTF-8`, 'Content-Transfer-Encoding: base64', '', wrap76(base64Utf8(body))].join('\r\n');
  return `${headers.join('\r\n')}\r\n\r\n${part('text/plain', m.text)}${part('text/html', m.html)}--${boundary}--\r\n`;
}

class SmtpFailure extends Error {
  constructor(readonly code: number) {
    super(`smtp ${code}`);
  }
}

/** Reads one (possibly multi-line) reply. Returns the code and the text lines. */
class Replies {
  private buffered = '';
  constructor(private conn: SmtpConn) {}
  setConn(conn: SmtpConn) {
    this.conn = conn;
    this.buffered = '';
  }
  async next(): Promise<{ code: number; lines: string[] }> {
    const lines: string[] = [];
    const buf = new Uint8Array(4096);
    for (;;) {
      const idx = this.buffered.indexOf('\r\n');
      if (idx >= 0) {
        const line = this.buffered.slice(0, idx);
        this.buffered = this.buffered.slice(idx + 2);
        lines.push(line.slice(4));
        if (line.length < 4 || line[3] === ' ') return { code: Number(line.slice(0, 3)), lines };
        continue;
      }
      if (this.buffered.length > 65536) throw new SmtpFailure(0);
      const n = await this.conn.read(buf);
      if (n === null) throw new SmtpFailure(0);
      this.buffered += dec.decode(buf.subarray(0, n), { stream: true });
    }
  }
}

async function writeAll(conn: SmtpConn, s: string) {
  const data = enc.encode(s);
  let off = 0;
  while (off < data.length) off += await conn.write(data.subarray(off));
}

export function smtp(rt: Runtime, connector: SmtpConnector = denoConnector, timeoutMs = TIMEOUT_MS): EmailProvider {
  return {
    async send(m) {
      const host = (rt.config.host ?? '').trim();
      const port = Number(rt.config.port || 465);
      const security = rt.config.security === 'starttls' ? 'starttls' : 'tls';
      const user = (rt.config.username ?? '').trim();
      const pass = rt.secrets.password;
      const s = sender(rt);
      if (!/^[a-z0-9.-]+$/i.test(host) || !Number.isInteger(port) || port < 1 || port > 65535 || !user || !pass || !s) {
        return { ok: false, error: 'not_configured' };
      }
      if (port === 25 || port === 587) return { ok: false, error: 'not_available', detail: 'port_blocked' };
      if (!isEmailAddress(m.to)) return { ok: false, error: 'rejected', detail: 'bad_recipient' };

      let conn: SmtpConn | null = null;
      const run = async (): Promise<Result<{ messageId?: string }>> => {
        try {
          conn = await connector.connect(host, port, security === 'tls');
        } catch {
          return { ok: false, error: 'unavailable', detail: 'connect' };
        }
        const replies = new Replies(conn);
        const expect = async (ok: number[]) => {
          const r = await replies.next();
          if (!ok.includes(r.code)) throw new SmtpFailure(r.code);
          return r;
        };
        const cmd = async (line: string, ok: number[]) => {
          await writeAll(conn!, `${line}\r\n`);
          return expect(ok);
        };

        await expect([220]);
        let ehlo = await cmd('EHLO cultivanode', [250]);
        if (security === 'starttls') {
          await cmd('STARTTLS', [220]);
          conn = await connector.startTls(conn, host);
          replies.setConn(conn);
          ehlo = await cmd('EHLO cultivanode', [250]);
        }
        const auth = ehlo.lines.find((l) => /^AUTH\b/i.test(l)) ?? '';
        if (/\bPLAIN\b/i.test(auth) || !/\bLOGIN\b/i.test(auth)) {
          await cmd(`AUTH PLAIN ${base64Utf8(`\u0000${user}\u0000${pass}`)}`, [235]);
        } else {
          await cmd('AUTH LOGIN', [334]);
          await cmd(base64Utf8(user), [334]);
          await cmd(base64Utf8(pass), [235]);
        }
        await cmd(`MAIL FROM:<${s.from}>`, [250]);
        await cmd(`RCPT TO:<${m.to}>`, [250, 251]);
        await cmd('DATA', [354]);
        // Dot-stuffing: a line that starts with "." gets a second one.
        const body = buildMime(m, s).replace(/\r\n\./g, '\r\n..');
        const done = await cmd(`${body}.`, [250]);
        await writeAll(conn, 'QUIT\r\n').catch(() => undefined);
        const queued = done.lines.join(' ').match(/[A-Za-z0-9._-]{6,}/g)?.pop();
        return { ok: true, value: { messageId: queued ? queued.slice(0, 100) : undefined } };
      };

      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          run(),
          new Promise<Result<{ messageId?: string }>>((resolve) => {
            timer = setTimeout(() => resolve({ ok: false, error: 'unavailable', detail: 'timeout' }), timeoutMs);
          }),
        ]);
      } catch (e) {
        const code = e instanceof SmtpFailure ? e.code : 0;
        // 4xx is temporary; 5xx (bad login, refused sender or recipient) will fail the same way again.
        const error = code >= 500 ? 'rejected' : 'unavailable';
        return { ok: false, error, detail: code ? `smtp ${code}` : 'connection' };
      } finally {
        clearTimeout(timer);
        try {
          (conn as SmtpConn | null)?.close();
        } catch {
          /* already closed */
        }
      }
    },
  };
}

export function emailProvider(rt: Runtime, fetchFn: FetchFn = fetch, connector: SmtpConnector = denoConnector): Result<EmailProvider> {
  switch (rt.provider) {
    case 'mock_email':
      return { ok: true, value: mockEmail };
    case 'resend':
      return { ok: true, value: resend(rt, fetchFn) };
    case 'smtp':
      return { ok: true, value: smtp(rt, connector) };
    default:
      return { ok: false, error: 'not_available', detail: `no email adapter for ${rt.provider}` };
  }
}

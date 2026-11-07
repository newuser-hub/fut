import { timingSafeEqual } from 'node:crypto';
import { next } from '@vercel/functions';

// Segredo apenas em ambiente Vercel; não é incluído no repositório.
const LOGIN = 'fut';
function equalConstantTime(a, b) {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) {
    timingSafeEqual(left, Buffer.alloc(left.length));
    return false;
  }
  return timingSafeEqual(left, right);
}
export default function proxy(request) {
  const password = process.env.FUT_ALBUM_PASSWORD;
  if (!password) return new Response('Acesso temporariamente indisponível.', {
    status:503, headers:{'Cache-Control':'no-store','Content-Type':'text/plain; charset=utf-8'}
  });
  const expected='Basic '+Buffer.from(LOGIN+':'+password).toString('base64');
  if (!equalConstantTime(request.headers.get('authorization') || '', expected)) {
    return new Response('Acesso privado ao arquivo FUT.', {
      status:401, headers:{
        'WWW-Authenticate':'Basic realm="FUT - Cadernetas", charset="UTF-8"',
        'Cache-Control':'no-store',
        'Content-Type':'text/plain; charset=utf-8',
        'X-Content-Type-Options':'nosniff'
      }
    });
  }
  return next();
}
export const config = {runtime:'nodejs'};

import { next } from '@vercel/functions';
import { accessStatus, BASIC_CHALLENGE } from './lib/access-control.js';

// O proxy atua antes do cache; a API verifica novamente a autenticação.
export default function proxy(request) {
  const state = accessStatus(request.headers.get('authorization'),
    process.env.FUT_ALBUM_PASSWORD);

  if (state === 'authorized') return next();

  const headers = {
    'Cache-Control': 'private, no-store',
    'Pragma': 'no-cache',
    'Vary': 'Authorization',
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff'
  };
  if (state === 'unconfigured') {
    return new Response('Acesso temporariamente indisponível.', {
      status: 503, headers
    });
  }

  headers['WWW-Authenticate'] = BASIC_CHALLENGE;
  return new Response('Acesso privado ao arquivo FUT.', {
    status: 401, headers
  });
}

export const config = { runtime: 'nodejs' };

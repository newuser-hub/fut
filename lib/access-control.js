import { createHash, timingSafeEqual } from 'node:crypto';

// Apenas o nome de utilizador é público. A palavra-passe nunca é armazenada no código.
const LOGIN = 'fut';
export const BASIC_CHALLENGE = 'Basic realm="FUT - Cadernetas", charset="UTF-8"';

// Partilhado pela barreira do proxy e pela função de armazenamento:
// a proteção não depende exclusivamente de uma regra de encaminhamento.
export function accessStatus(authorization, password) {
  if (typeof password !== 'string' || !password) return 'unconfigured';

  // Nunca descodificar nem registar credenciais enviadas pelo navegador.
  if (typeof authorization !== 'string' || authorization.length > 4096 ||
      !authorization.startsWith('Basic ')) return 'denied';

  const expected = 'Basic ' + Buffer.from(LOGIN + ':' + password).toString('base64');
  const suppliedHash = createHash('sha256').update(authorization, 'utf8').digest();
  const expectedHash = createHash('sha256').update(expected, 'utf8').digest();
  return timingSafeEqual(suppliedHash, expectedHash) ? 'authorized' : 'denied';
}

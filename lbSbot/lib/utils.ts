import { ALLOW_GROUPS, ALLOW_USERS } from '../config/access.ts';

export const hasAccess = (jid: string, jidAlt?: string) => {
  if (jid?.endsWith('@g.us')) {
    return ALLOW_GROUPS.includes(jid);
  }
  // elimina valores falsy
  const candidates = [jid, jidAlt].filter(Boolean);

  return candidates.some((j) => ALLOW_USERS.includes(j as string));
};

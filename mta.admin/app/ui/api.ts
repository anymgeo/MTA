export type News = {
  id: string; slug: string; date: string; image: string; category: 'news' | 'article' | 'blog'; gallery: string[];
  titleKa: string; excerptKa: string; contentKa: string[];
  titleEn: string; excerptEn: string; contentEn: string[];
  published: boolean; updatedAt: string; version: string;
};
export type PortalRole = 'WebPortalAdmin' | 'WebPortalModerator';
export type PortalUser = { id: string; email: string; displayName: string; role: PortalRole; version: string };
export type Session = { authenticated: boolean; email: string | null; id: string | null; role: PortalRole | null; csrfToken: string };
export class ApiError extends Error {
  constructor(message: string, public status: number, public fields: Record<string,string[]> = {}) { super(message); }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (init.method && !['GET', 'HEAD'].includes(init.method)) {
    const session = await api<Session>('/admin/session');
    headers.set('X-CSRF-TOKEN', session.csrfToken);
  }
  let response: Response;
  try { response = await fetch('/backend' + path, { ...init, headers, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(20000) }); }
  catch { throw new ApiError('API-სთან დაკავშირება ვერ მოხერხდა. შეამოწმეთ სერვერი და სცადეთ ხელახლა.', 0); }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = data.message || (data.errors ? Object.values(data.errors).flat().join(' ') : null);
    throw new ApiError(message || (response.status === 401 ? 'სესია დასრულებულია ან ელფოსტა/პაროლი არასწორია.' : response.status === 403 ? 'ამ მოქმედებისთვის საჭირო უფლება არ გაქვთ.' : response.status === 429 ? 'ძალიან ბევრი მცდელობაა. სცადეთ მოგვიანებით.' : 'მოთხოვნა ვერ შესრულდა. სცადეთ ხელახლა.'), response.status, data.errors || {});
  }
  return response.status === 204 ? undefined as T : response.json();
}
export function blankNews(): News {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return { id: '', slug: '', date, image: '', category: 'news', gallery: [], titleKa: '', excerptKa: '', contentKa: [], titleEn: '', excerptEn: '', contentEn: [], published: false, updatedAt: '', version: '' };
}

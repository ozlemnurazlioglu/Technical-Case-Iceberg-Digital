export const useApi = () => {
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBase as string;

  const get = <T>(path: string): Promise<T> =>
    $fetch<T>(`${baseURL}${path}`);

  const post = <T>(path: string, body: unknown): Promise<T> =>
    $fetch<T>(`${baseURL}${path}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  const patch = <T>(path: string): Promise<T> =>
    $fetch<T>(`${baseURL}${path}`, { method: 'PATCH' });

  return { get, post, patch };
};

export function useApi() {
  const config = useRuntimeConfig()
  const baseURL: string = (config.public.apiBase as string || '').replace(/\/+$/, '')

  // สร้าง instance เดียว พร้อมส่วนหัวกัน cache
  const $api = $fetch.create({
    baseURL,
    retry: 0,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache'
    }
  })

  // helper เรียกแบบแนบ params และบังคับไม่ cache
  const get  = <T = any>(path: string, params?: Record<string, any>) =>
    $api<T>(path, { params, cache: 'no-store' })

  const post = <T = any>(path: string, body?: any) =>
    $api<T>(path, { method: 'POST', body, cache: 'no-store' })

  const put  = <T = any>(path: string, body?: any) =>
    $api<T>(path, { method: 'PUT', body, cache: 'no-store' })

  const del  = <T = any>(path: string) =>
    $api<T>(path, { method: 'DELETE', cache: 'no-store' })

  return { get, post, put, del }
}

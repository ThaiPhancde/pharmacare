export type IResponse<T> = {
  data: T;
  status: boolean;
  message: string;
};

export const api = {
  get: async <T>(url: string): Promise<IResponse<T>> => {
    return await $fetch<IResponse<T>>(url);
  },
  post: async <T>(url: string, body: object): Promise<IResponse<T>> => {
    return await $fetch<IResponse<T>>(url, { method: 'POST', body });
  },
  put: async <T>(url: string, body: object): Promise<IResponse<T>> => {
    return await $fetch<IResponse<T>>(url, { method: 'PUT', body });
  },
  delete: async <T>(url: string): Promise<IResponse<T>> => {
    return await $fetch<IResponse<T>>(url, { method: 'DELETE' });
  }
};

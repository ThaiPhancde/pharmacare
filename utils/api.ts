export type IResponse<T> = {
  data: T;
  total?: number;
  status: boolean;
  message: string;
};

type FetchOptions = {
  body?: object;
  params?: Record<string, any>;
};

export const api = {
  get: async <T>(url: string, options?: FetchOptions): Promise<IResponse<T>> => {
    return await $fetch<IResponse<T>>(url, {
      method: "GET",
      query: options?.params,
    });
  },
  post: async <T>(url: string, body: object): Promise<IResponse<T>> => {
    return await $fetch<IResponse<T>>(url, {
      method: "POST",
      body,
    });
  },
  put: async <T>(url: string, body: object): Promise<IResponse<T>> => {
    return await $fetch<IResponse<T>>(url, {
      method: "PUT",
      body,
    });
  },
  delete: async <T>(url: string): Promise<IResponse<T>> => {
    return await $fetch<IResponse<T>>(url, {
      method: "DELETE",
    });
  },
};

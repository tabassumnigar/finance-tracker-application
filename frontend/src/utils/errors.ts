import axios from 'axios';
import type { AxiosError } from 'axios';

type ApiErrorData = {
  message?: string;
};

export const getErrorMessage = (error: unknown, fallback = 'Something went wrong') => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as ApiErrorData | string | undefined;
    if (typeof responseData === 'string') {
      return responseData;
    }
    if (responseData && typeof responseData === 'object' && 'message' in responseData && responseData.message) {
      return responseData.message;
    }
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

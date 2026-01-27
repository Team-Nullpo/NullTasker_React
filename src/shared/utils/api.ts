import { ApiErrorResponse } from "@nulltasker/shared-types";
export const isError = (res: unknown): res is ApiErrorResponse => {
  return (res as ApiErrorResponse).success === false;
};

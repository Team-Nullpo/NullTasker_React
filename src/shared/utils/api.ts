import { ApiErrorResponse } from "@nulltasker/shared-types";
export const isErrorResponse = (res: unknown): res is ApiErrorResponse => {
  return (res as ApiErrorResponse).success === false;
};

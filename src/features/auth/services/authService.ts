import apiClient from "@/lib/apiClient";

import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from "@nulltasker/shared-types";

import { ApiResBody } from "@/shared/types";

export const login = async (
  data: LoginRequest,
): Promise<ApiResBody<LoginResponse>> => {
  const response = await apiClient.post<ApiResBody<LoginResponse>>(
    "/login",
    data,
  );
  return response.data;
};

export const register = async (
  data: RegisterRequest,
): Promise<ApiResBody<User>> => {
  const response = await apiClient.post<ApiResBody<User>>("/register", data);
  return response.data;
};

export const logout = async (): Promise<ApiResBody<User>> => {
  const response = await apiClient.post<ApiResBody<User>>("/logout");
  return response.data;
};

export const validateToken = async (
  token: string,
): Promise<ApiResBody<boolean>> => {
  try {
    const response = await apiClient.post<ApiResBody<boolean>>(
      "/verify-token",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    return false;
  }
};

export const refreshToken = async (
  refreshToken: string,
): Promise<{ token: string }> => {
  const response = await apiClient.post("/refresh", { refreshToken });
  return response.data;
};

import api from "./client";
import {
  Account,
  CreateAccountRequest,
  TransferRequest,
  UpdateAccountRequest,
} from "../types/account";

export const getAccounts = async (): Promise<Account[]> => {
  const { data } = await api.get("/accounts");
  return data;
};

export const getAccount = async (id: string): Promise<Account> => {
  const { data } = await api.get(`/accounts/${id}`);
  return data;
};

export const createAccount = async (
  payload: CreateAccountRequest
): Promise<Account> => {
  const { data } = await api.post("/accounts", payload);
  return data;
};

export const updateAccount = async (
  id: string,
  payload: UpdateAccountRequest
): Promise<Account> => {
  const { data } = await api.put(`/accounts/${id}`, payload);
  return data;
};

export const transferFunds = async (payload: TransferRequest) => {
  const { data } = await api.post("/accounts/transfer", payload);
  return data;
};
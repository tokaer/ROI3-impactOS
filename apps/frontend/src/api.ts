import type {
  Action,
  CreateActionPayload,
  UpdateActionPayload,
  User,
  RoiSettings,
  Variable,
  CreateVariablePayload,
  UpdateVariablePayload,
} from "./types";

const BASE = "/api";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Users
export const fetchUsers = () =>
  fetch(`${BASE}/users`).then((r) => json<User[]>(r));

// ROI Settings
export const fetchRoiSettings = () =>
  fetch(`${BASE}/roi-settings`).then((r) => json<RoiSettings>(r));

export const updateRoiSettings = (
  id: string,
  data: Partial<Omit<RoiSettings, "id">>
) =>
  fetch(`${BASE}/roi-settings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => json<RoiSettings>(r));

// Variables
export const fetchVariables = () =>
  fetch(`${BASE}/variables`).then((r) => json<Variable[]>(r));

export const fetchVariable = (id: string) =>
  fetch(`${BASE}/variables/${id}`).then((r) => json<Variable>(r));

export const createVariable = (data: CreateVariablePayload) =>
  fetch(`${BASE}/variables`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => json<Variable>(r));

export const updateVariable = (id: string, data: UpdateVariablePayload) =>
  fetch(`${BASE}/variables/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => json<Variable>(r));

export const deleteVariable = (id: string) =>
  fetch(`${BASE}/variables/${id}`, { method: "DELETE" }).then((r) =>
    json<void>(r)
  );

// Actions
export interface FetchActionsParams {
  q?: string;
  status?: string[];
  sortBy?: string;
  sortDir?: string;
}

export function fetchActions(params?: FetchActionsParams): Promise<Action[]> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.status?.length) sp.set("status", params.status.join(","));
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortDir) sp.set("sortDir", params.sortDir);
  const qs = sp.toString();
  return fetch(`${BASE}/actions${qs ? `?${qs}` : ""}`).then((r) =>
    json<Action[]>(r)
  );
}

export const fetchAction = (id: string) =>
  fetch(`${BASE}/actions/${id}`).then((r) => json<Action>(r));

export const createAction = (data: CreateActionPayload) =>
  fetch(`${BASE}/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => json<Action>(r));

export const updateAction = (id: string, data: UpdateActionPayload) =>
  fetch(`${BASE}/actions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => json<Action>(r));

export const deleteAction = (id: string) =>
  fetch(`${BASE}/actions/${id}`, { method: "DELETE" }).then((r) =>
    json<void>(r)
  );

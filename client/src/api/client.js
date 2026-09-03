const BASE = "/api";

function getToken() {
  return localStorage.getItem("erp_token");
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (email, password) => request("/auth/register", { method: "POST", body: { email, password } }),
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),

  listBusinesses: () => request("/businesses"),
  createBusiness: (name, type) => request("/businesses", { method: "POST", body: { name, type } }),
  getBusiness: (id) => request(`/businesses/${id}`),

  listModules: (businessId) => request(`/modules/business/${businessId}`),
  createModule: (businessId, name, icon) =>
    request(`/modules/business/${businessId}`, { method: "POST", body: { name, icon } }),
  deleteModule: (moduleId) => request(`/modules/${moduleId}`, { method: "DELETE" }),
  addField: (moduleId, field) => request(`/modules/${moduleId}/fields`, { method: "POST", body: field }),
  deleteField: (fieldId) => request(`/modules/fields/${fieldId}`, { method: "DELETE" }),
  applyConfig: (businessId, modules) =>
    request(`/modules/business/${businessId}/apply-config`, { method: "POST", body: { modules } }),

  listRecords: (moduleId) => request(`/records/module/${moduleId}`),
  createRecord: (moduleId, data) => request(`/records/module/${moduleId}`, { method: "POST", body: data }),
  updateRecord: (recordId, data) => request(`/records/${recordId}`, { method: "PUT", body: data }),
  deleteRecord: (recordId) => request(`/records/${recordId}`, { method: "DELETE" }),

  getAiRecommendation: (businessId, description) =>
    request(`/ai/recommend/${businessId}`, { method: "POST", body: { description } }),

  getTiers: () => request("/billing/tiers"),
  getUsage: (businessId) => request(`/billing/business/${businessId}/usage`),
  upgradeTier: (businessId, tier) =>
    request(`/billing/business/${businessId}/upgrade`, { method: "POST", body: { tier } }),

  listMembers: (businessId) => request(`/billing/business/${businessId}/members`),
  inviteMember: (businessId, email, role) =>
    request(`/billing/business/${businessId}/members`, { method: "POST", body: { email, role } }),
  updateMemberRole: (memberId, role) =>
    request(`/billing/members/${memberId}`, { method: "PUT", body: { role } }),
  removeMember: (memberId) => request(`/billing/members/${memberId}`, { method: "DELETE" }),
};

export { getToken };

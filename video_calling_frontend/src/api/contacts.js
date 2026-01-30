import { apiRequest } from "./client";

/**
 * Expected backend endpoints (work-item):
 * - GET /contacts
 * - POST /contacts
 * - DELETE /contacts/{id}
 */

// PUBLIC_INTERFACE
export async function listContacts(token) {
  /** List contacts for the authenticated user. */
  return apiRequest("/contacts", { method: "GET", token });
}

// PUBLIC_INTERFACE
export async function createContact(token, { name, handle }) {
  /** Create a new contact. `handle` can be email/username/user_id depending on backend. */
  return apiRequest("/contacts", { method: "POST", token, body: { name, handle } });
}

// PUBLIC_INTERFACE
export async function deleteContact(token, contactId) {
  /** Delete a contact by id. */
  return apiRequest(`/contacts/${encodeURIComponent(contactId)}`, { method: "DELETE", token });
}

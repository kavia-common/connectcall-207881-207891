import React, { useEffect, useMemo, useState } from "react";
import { createContact, deleteContact, listContacts } from "../api/contacts";
import { ErrorBanner, LoadingRow } from "../components/Status";
import { useAuth } from "../state/AuthContext";
import { useNavigate } from "react-router-dom";

function initials(name) {
  const v = String(name || "").trim();
  if (!v) return "??";
  const parts = v.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.slice(0, 1).toUpperCase()).join("");
}

// PUBLIC_INTERFACE
export default function ContactsScreen() {
  /** Contacts management screen. */
  const { token } = useAuth();
  const nav = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [saving, setSaving] = useState(false);

  const canAdd = useMemo(() => {
    if (!name.trim()) return false;
    if (!handle.trim()) return false;
    return true;
  }, [name, handle]);

  async function refresh() {
    setError("");
    setLoadingList(true);
    try {
      const res = await listContacts(token);
      const list = res?.contacts || res || [];
      setContacts(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.message || "Failed to load contacts.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onAdd(e) {
    e.preventDefault();
    setError("");

    if (!canAdd) {
      setError("Name and handle are required.");
      return;
    }

    setSaving(true);
    try {
      const created = await createContact(token, { name: name.trim(), handle: handle.trim() });
      const c = created?.contact || created;
      setContacts((prev) => [c, ...prev]);
      setName("");
      setHandle("");
    } catch (err) {
      setError(err?.message || "Failed to create contact.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    setError("");
    const ok = window.confirm("Delete this contact?");
    if (!ok) return;

    try {
      await deleteContact(token, id);
      setContacts((prev) => prev.filter((c) => String(c.id) !== String(id)));
    } catch (err) {
      setError(err?.message || "Failed to delete contact.");
    }
  }

  function startCall(contact) {
    const target = contact?.handle || contact?.email || contact?.name;
    nav(`/call?to=${encodeURIComponent(target || "")}`);
  }

  return (
    <div className="grid-2">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">CONTACTS</div>
          <div className="spacer" />
          <button className="btn" onClick={refresh} disabled={loadingList}>
            Refresh
          </button>
        </div>
        <div className="panel-body">
          <ErrorBanner message={error} />

          <form onSubmit={onAdd} noValidate>
            <div className="field">
              <div className="label">Name</div>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Neon"
              />
            </div>

            <div className="field">
              <div className="label">Handle</div>
              <input
                className="input"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="email/username (backend-defined)"
              />
              <div className="help">This is what the backend uses to route calls to that user.</div>
            </div>

            <div className="btn-row">
              <button className="btn btn-primary" type="submit" disabled={!canAdd || saving}>
                {saving ? "Adding…" : "Add contact"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">YOUR LIST</div>
          <div className="spacer" />
          <div className="chip">{contacts.length} entries</div>
        </div>

        <div className="panel-body">
          {loadingList ? (
            <LoadingRow label="Loading contacts…" />
          ) : contacts.length === 0 ? (
            <div className="help">No contacts yet. Add one on the left.</div>
          ) : (
            <div className="list">
              {contacts.map((c) => (
                <div className="contact" key={c.id || `${c.name}-${c.handle}`}>
                  <div className="avatar" aria-hidden="true">
                    {initials(c.name || c.handle)}
                  </div>
                  <div className="contact-main">
                    <div className="contact-name">{c.name || "Unnamed"}</div>
                    <div className="contact-sub">{c.handle || c.email || c.username || "—"}</div>
                  </div>
                  <div className="btn-row">
                    <button className="btn btn-success" onClick={() => startCall(c)}>
                      Call
                    </button>
                    <button className="btn btn-danger" onClick={() => onDelete(c.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="footer-hint">
            Tip: Starting a call opens the call console with WebRTC + WS signaling.
          </div>
        </div>
      </div>
    </div>
  );
}

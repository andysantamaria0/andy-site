'use client';

import { useState, useCallback } from 'react';

export default function AccessRequestList({ requests: initialRequests }) {
  const [requests, setRequests] = useState(initialRequests);

  const handleAction = useCallback(async (id, status) => {
    // Optimistic update — remove from list
    setRequests((prev) => prev.filter((r) => r.id !== id));

    try {
      const res = await fetch('/admin/api/access-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) throw new Error('Failed to update');
    } catch {
      // Revert on failure
      setRequests(initialRequests);
    }
  }, [initialRequests]);

  if (requests.length === 0) {
    return <p className="v-admin-requests-empty">No pending requests.</p>;
  }

  return (
    <div className="v-admin-requests">
      {requests.map((r) => (
        <div key={r.id} className="v-admin-request-row">
          <div className="v-admin-request-info">
            <div className="v-admin-request-name">{r.name}</div>
            <div className="v-admin-request-email">{r.email}</div>
            <div className="v-admin-request-date">
              {new Date(r.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
          <div className="v-admin-request-actions">
            <button
              className="v-admin-request-btn v-admin-request-approve"
              onClick={() => handleAction(r.id, 'approved')}
            >
              Approve
            </button>
            <button
              className="v-admin-request-btn v-admin-request-reject"
              onClick={() => handleAction(r.id, 'rejected')}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

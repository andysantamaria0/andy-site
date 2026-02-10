'use client';

import { useState, useCallback } from 'react';

export default function FeatureList({ categories: initialCategories }) {
  const [categories, setCategories] = useState(initialCategories);

  const updateFeature = useCallback(async (featureId, field, value, role) => {
    // Optimistic update
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        features: cat.features.map((f) => {
          if (f.id !== featureId) return f;
          if (field === 'enabled') {
            return { ...f, enabled: value };
          }
          if (field === 'role_permission') {
            return {
              ...f,
              permissions: { ...f.permissions, [role]: value },
            };
          }
          return f;
        }),
      }))
    );

    try {
      const res = await fetch('/admin/api/features', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureId, field, value, role }),
      });

      if (!res.ok) throw new Error('Failed to update');
    } catch {
      // Revert on failure
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          features: cat.features.map((f) => {
            if (f.id !== featureId) return f;
            if (field === 'enabled') {
              return { ...f, enabled: !value };
            }
            if (field === 'role_permission') {
              return {
                ...f,
                permissions: { ...f.permissions, [role]: !value },
              };
            }
            return f;
          }),
        }))
      );
    }
  }, []);

  return (
    <div className="v-admin-features">
      {categories.map((cat) => (
        <div key={cat.key} className="v-admin-category">
          <h2 className="v-admin-category-title">{cat.label}</h2>
          <div className="v-admin-category-list">
            {cat.features.map((feature) => (
              <div
                key={feature.id}
                className={`v-admin-feature-row${!feature.enabled ? ' v-admin-feature-disabled' : ''}`}
              >
                <div className="v-admin-feature-info">
                  <div className="v-admin-feature-name">{feature.label}</div>
                  {feature.description && (
                    <div className="v-admin-feature-desc">{feature.description}</div>
                  )}
                </div>
                <div className="v-admin-feature-controls">
                  <div className="v-admin-toggle-group">
                    <span className="v-admin-toggle-label">Global</span>
                    <button
                      className={`v-admin-toggle${feature.enabled ? ' v-admin-toggle-on' : ''}`}
                      onClick={() => updateFeature(feature.id, 'enabled', !feature.enabled)}
                      aria-label={`Toggle ${feature.label} globally`}
                    >
                      <span className="v-admin-toggle-thumb" />
                    </button>
                  </div>
                  {feature.enabled && (
                    <>
                      <div className="v-admin-toggle-group">
                        <span className="v-admin-toggle-label">Users</span>
                        <button
                          className={`v-admin-toggle${feature.permissions.user !== false ? ' v-admin-toggle-on' : ''}`}
                          onClick={() =>
                            updateFeature(
                              feature.id,
                              'role_permission',
                              feature.permissions.user === false,
                              'user'
                            )
                          }
                          aria-label={`Toggle ${feature.label} for users`}
                        >
                          <span className="v-admin-toggle-thumb" />
                        </button>
                      </div>
                      <div className="v-admin-toggle-group">
                        <span className="v-admin-toggle-label">Admins</span>
                        <button
                          className={`v-admin-toggle${feature.permissions.super_admin !== false ? ' v-admin-toggle-on' : ''}`}
                          onClick={() =>
                            updateFeature(
                              feature.id,
                              'role_permission',
                              feature.permissions.super_admin === false,
                              'super_admin'
                            )
                          }
                          aria-label={`Toggle ${feature.label} for admins`}
                        >
                          <span className="v-admin-toggle-thumb" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

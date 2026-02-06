"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../../../utils/api.js";
import { LoadingSpinner } from "../shared";
import { Settings } from "lucide-react";
import { toast } from "react-hot-toast";

export default function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [featureFlags, setFeatureFlags] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api('/api/admin/feature-flags');
      setFeatureFlags(Array.isArray(res) ? res : []);
    } catch (error) { toast.error("Failed to load settings"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleFeature = async (flagId, currentEnabled) => {
    setSaving(true);
    try {
      await api(`/api/admin/feature-flags/${flagId}`, { method: 'PUT', body: { enabled: !currentEnabled } });
      setFeatureFlags(flags => flags.map(f => f.id === flagId ? { ...f, enabled: !currentEnabled } : f));
      toast.success(`Feature ${!currentEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) { toast.error("Failed to update feature"); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner message="Loading settings..." />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Platform Settings</h2>
        <p className="text-gray-600">Manage feature flags and configuration</p>
      </div>

      <div className="bg-white rounded-xl shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-500" /> Feature Flags
          </h3>
        </div>
        <div className="divide-y">
          {featureFlags.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No feature flags configured</div>
          ) : featureFlags.map((flag) => (
            <div key={flag.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
              <div>
                <p className="font-medium">{flag.label || flag.name}</p>
                <p className="text-sm text-gray-500">{flag.description || "No description"}</p>
              </div>
              <button onClick={() => handleToggleFeature(flag.id, flag.enabled)} disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${flag.enabled ? 'bg-green-500' : 'bg-gray-300'} ${saving ? 'opacity-50' : ''}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flag.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Platform Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Version</p>
            <p className="text-lg font-medium">1.0.0</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Environment</p>
            <p className="text-lg font-medium">Development</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Database</p>
            <p className="text-lg font-medium">PostgreSQL</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">API Status</p>
            <p className="text-lg font-medium text-green-600">Operational</p>
          </div>
        </div>
      </div>
    </div>
  );
}
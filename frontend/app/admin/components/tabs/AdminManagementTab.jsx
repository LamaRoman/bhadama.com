// ============================================
// FILE: app/admin/components/tabs/AdminManagementTab.jsx
// ACTION: ADD NEW FILE
// ============================================

'use client';

import React, { useEffect, useState } from 'react';
import { 
  Shield, UserPlus, Trash2, UserMinus, Search, RefreshCw, 
  Mail, Phone, Calendar, AlertCircle, CheckCircle, X, Eye, EyeOff,
  Copy, Check, Users
} from 'lucide-react';
import { api } from '@/utils/api';

const AdminManagementTab = ({ dateRange, onTabChange }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({ email: '', name: '', phone: '', password: '', generatePassword: true });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [createdAdmin, setCreatedAdmin] = useState(null);
  
  // Search for upgrade
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);

  // Fetch admins
  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api('/api/admin/users/admins', { method: 'GET' });
      setAdmins(response.admins || []);
    } catch (err) {
      setError(err.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  // Create new admin
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    
    try {
      const response = await api('/api/admin/users/admins', {
        method: 'POST',
        body: {
          email: formData.email,
          name: formData.name,
          phone: formData.phone || null,
          password: formData.generatePassword ? null : formData.password,
          sendInvite: true
        }
      });
      
      setCreatedAdmin({
        ...response.admin,
        temporaryPassword: response.temporaryPassword
      });
      fetchAdmins();
    } catch (err) {
      setFormError(err.message || 'Failed to create admin');
    } finally {
      setFormLoading(false);
    }
  };

  // Search user for upgrade
  const handleSearchUser = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearchResult(null);
    
    try {
      // This assumes you have a user search endpoint
      const response = await api(`/api/admin/users/recent?limit=100`, { method: 'GET' });
const users = Array.isArray(response) ? response.filter(u => u.email.toLowerCase() === searchEmail.toLowerCase()) : [];
      if (users.length > 0) {
        setSearchResult(users[0]);
      } else {
        setSearchResult({ notFound: true });
      }
    } catch (err) {
      setSearchResult({ error: err.message });
    } finally {
      setSearching(false);
    }
  };

  // Upgrade user to admin
  const handleUpgradeUser = async (userId) => {
    setFormLoading(true);
    try {
      await api(`/api/admin/users/${userId}/make-admin`, { method: 'POST' });
      setShowUpgradeModal(false);
      setSearchEmail('');
      setSearchResult(null);
      fetchAdmins();
    } catch (err) {
      setFormError(err.message || 'Failed to upgrade user');
    } finally {
      setFormLoading(false);
    }
  };

  // Remove admin role
  const handleRemoveAdmin = async (userId) => {
    try {
      await api(`/api/admin/users/${userId}/remove-admin`, { method: 'POST' });
      fetchAdmins();
    } catch (err) {
      setError(err.message || 'Failed to remove admin role');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    try {
      await api(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setShowDeleteConfirm(null);
      fetchAdmins();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  // Reset create modal
  const resetCreateModal = () => {
    setShowCreateModal(false);
    setFormData({ email: '', name: '', phone: '', password: '', generatePassword: true });
    setFormError(null);
    setCreatedAdmin(null);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Admin Management</h2>
          <p className="text-gray-500 mt-1">Manage administrator accounts</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Users className="w-4 h-4" />
            Upgrade User
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            Create Admin
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{admins.length}</p>
          <p className="text-sm text-gray-500">Total Admins</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{admins.filter(a => a.emailVerified).length}</p>
          <p className="text-sm text-gray-500">Verified</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {admins.filter(a => {
              const week = new Date();
              week.setDate(week.getDate() - 7);
              return new Date(a.lastLogin) > week;
            }).length}
          </p>
          <p className="text-sm text-gray-500">Active This Week</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-600">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Administrator Accounts</h3>
          <button onClick={fetchAdmins} className="p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading && admins.length === 0 ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No admin users found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {admins.map((admin) => (
              <div key={admin.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  {admin.profilePhoto ? (
                    <img src={admin.profilePhoto} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{admin.name}</p>
                      {admin.emailVerified && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">Verified</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{admin.email}</span>
                      {admin.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{admin.phone}</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Joined {formatDate(admin.createdAt)}
                      {admin.lastLogin && ` · Last active ${formatDate(admin.lastLogin)}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRemoveAdmin(admin.id)}
                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                    title="Remove admin role"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(admin)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <Modal onClose={resetCreateModal} title={createdAdmin ? "Admin Created!" : "Create New Admin"}>
          {createdAdmin ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">{createdAdmin.name}</p>
                <p className="text-gray-500">{createdAdmin.email}</p>
              </div>
              {createdAdmin.temporaryPassword && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-amber-800 mb-2">Temporary Password</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                      {createdAdmin.temporaryPassword}
                    </code>
                    <CopyButton text={createdAdmin.temporaryPassword} />
                  </div>
                  <p className="text-xs text-amber-600 mt-2">
                    Share this password securely. User should change it on first login.
                  </p>
                </div>
              )}
              <button onClick={resetCreateModal} className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-medium">
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-600">
                  {formError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.generatePassword}
                    onChange={(e) => setFormData(p => ({ ...p, generatePassword: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Generate temporary password</span>
                </label>
              </div>

              {!formData.generatePassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    minLength={8}
                    required={!formData.generatePassword}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetCreateModal} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
                  {formLoading ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Upgrade User Modal */}
      {showUpgradeModal && (
        <Modal onClose={() => { setShowUpgradeModal(false); setSearchEmail(''); setSearchResult(null); }} title="Upgrade User to Admin">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Search for an existing user by email to grant admin privileges.</p>
            
            <div className="flex gap-2">
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Enter user email"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
              />
              <button
                onClick={handleSearchUser}
                disabled={searching || !searchEmail.trim()}
                className="px-4 py-2.5 bg-gray-900 text-white rounded-xl font-medium disabled:opacity-50"
              >
                {searching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </div>

            {searchResult && (
              <div className="border border-gray-200 rounded-xl p-4">
                {searchResult.notFound ? (
                  <p className="text-gray-500 text-center">No user found with this email</p>
                ) : searchResult.error ? (
                  <p className="text-red-500 text-center">{searchResult.error}</p>
                ) : searchResult.role === 'ADMIN' ? (
                  <div className="text-center">
                    <Shield className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <p className="font-medium text-gray-900">{searchResult.name}</p>
                    <p className="text-sm text-gray-500">Already an admin</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {searchResult.profilePhoto ? (
                        <img src={searchResult.profilePhoto} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{searchResult.name}</p>
                        <p className="text-sm text-gray-500">{searchResult.email} · {searchResult.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpgradeUser(searchResult.id)}
                      disabled={formLoading}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                    >
                      {formLoading ? 'Upgrading...' : 'Make Admin'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal onClose={() => setShowDeleteConfirm(null)} title="Delete Admin User">
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
              <Trash2 className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Delete {showDeleteConfirm.name}?</p>
              <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDeleteUser(showDeleteConfirm.id)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Helper Components
const Modal = ({ onClose, title, children }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="fixed inset-0 bg-black/50" onClick={onClose} />
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  </div>
);

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-2 hover:bg-gray-100 rounded-lg">
      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
    </button>
  );
};

export default AdminManagementTab;
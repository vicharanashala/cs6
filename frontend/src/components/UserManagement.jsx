import { useState, useEffect } from "react";
import { Search, Shield } from "lucide-react";
import api from "../api/axios";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    await Promise.resolve();
    try {
      setLoading(true);
      const res = await api.get("/users");
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const promoteToAdmin = async (userId, currentRole) => {
    if (currentRole === "admin" || currentRole === "superadmin") return;
    
    if (!window.confirm("Are you sure you want to promote this user to Admin? They will have full administrative privileges.")) {
      return;
    }

    try {
      const res = await api.patch(`/users/${userId}/role`, { role: "admin" });
      if (res.data.success) {
        // Update local state
        setUsers(users.map(u => u._id === userId ? { ...u, role: "admin" } : u));
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to promote user");
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading users...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-400" />
            User Management
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Superadmin Dashboard — Promote users to Admin role
          </p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-surface border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-gray-400">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Current Role</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map(user => (
                <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full bg-surface-light object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center text-gray-400 border border-white/10 text-xs font-bold uppercase">
                          {(user.name || user.username).substring(0, 2)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-white">{user.name || user.username}</div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      user.role === 'superadmin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      user.role === 'moderator' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role !== 'admin' && user.role !== 'superadmin' ? (
                      <button
                        onClick={() => promoteToAdmin(user._id, user.role)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 hover:border-indigo-500 transition-all text-xs font-semibold"
                      >
                        Promote to Admin
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        {user.role === 'superadmin' ? 'Superadmin' : 'Already Admin'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Loader2, FolderPlus, FileText, Trash2, Edit3, X, Save, Check } from 'lucide-react';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editCategoryData, setEditCategoryData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/categories/admin/all');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await api.post('/categories', {
        name: newCategory.name.trim(),
        description: newCategory.description.trim() || undefined
      });
      
      if (res.data.success) {
        setSuccess(`Category "${res.data.data.name}" created successfully!`);
        setNewCategory({ name: '', description: '' });
        setIsAdding(false);
        fetchCategories();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (cat) => {
    setEditingCategoryId(cat._id);
    setEditCategoryData({ name: cat.name, description: cat.description || '' });
    setError(null);
    setSuccess(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editCategoryData.name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.patch(`/categories/${editingCategoryId}`, {
        name: editCategoryData.name.trim(),
        description: editCategoryData.description.trim() || undefined
      });

      if (res.data.success) {
        setSuccess(`Category updated successfully!`);
        setEditingCategoryId(null);
        fetchCategories();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (catId, catName) => {
    if (!window.confirm(`Are you sure you want to delete the category "${catName}"? This action cannot be undone.`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.delete(`/categories/${catId}`);
      if (res.data.success) {
        setSuccess(`Category "${catName}" deleted successfully!`);
        fetchCategories();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveClick = async (catId) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.patch(`/categories/${catId}`, { isApproved: true });
      if (res.data.success) {
        setSuccess(`Category approved!`);
        fetchCategories();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to approve category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Category Management</h2>
          <p className="text-xs text-gray-500">Create and manage content categories across the portal.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            isAdding 
              ? 'bg-surface-light text-gray-400 hover:text-white border border-white/10' 
              : 'bg-primary-500 text-white hover:bg-primary-600'
          }`}
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? 'Cancel' : 'New Category'}
        </button>
      </div>

      {(error || success) && (
        <div className={`p-4 rounded-xl text-sm font-medium flex justify-between items-center ${
          error ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }`}>
          <span>{error || success}</span>
          <button onClick={() => { setError(null); setSuccess(null); }} className="hover:opacity-70">
            <X size={16} />
          </button>
        </div>
      )}

      {isAdding && (
        <div className="bg-surface-light border border-white/10 rounded-2xl p-6 shadow-xl animate-in slide-in-from-top-2">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <FolderPlus size={16} className="text-primary-400" />
            Create New Category
          </h3>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                Category Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g., Housing & Accommodation"
                className="w-full rounded-xl border border-white/10 bg-surface py-2.5 px-4 text-sm text-white focus:border-primary-500 focus:outline-none"
                maxLength={60}
                required
              />
              <p className="text-[10px] text-gray-500 mt-1.5 text-right">{newCategory.name.length}/60 characters</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Briefly describe what this category covers..."
                className="w-full rounded-xl border border-white/10 bg-surface py-2.5 px-4 text-sm text-white focus:border-primary-500 focus:outline-none h-24 resize-none"
                maxLength={200}
              />
              <p className="text-[10px] text-gray-500 mt-1.5 text-right">{newCategory.description.length}/200 characters</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !newCategory.name.trim()}
                className="flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Create Category
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-surface-light border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-4" />
            <p className="text-xs">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            <FolderPlus size={32} className="mx-auto text-gray-600 mb-4" />
            <p className="text-sm font-medium">No categories found</p>
            <p className="text-xs mt-1">Create one to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {categories.map((cat) => (
              <div key={cat._id} className="p-5 flex items-start justify-between hover:bg-surface/50 transition-colors group">
                {editingCategoryId === cat._id ? (
                  <form onSubmit={handleEditSubmit} className="w-full space-y-4">
                    <div>
                      <input
                        type="text"
                        value={editCategoryData.name}
                        onChange={(e) => setEditCategoryData({ ...editCategoryData, name: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-surface py-2 px-3 text-sm text-white focus:border-primary-500 focus:outline-none"
                        maxLength={60}
                        required
                      />
                    </div>
                    <div>
                      <textarea
                        value={editCategoryData.description}
                        onChange={(e) => setEditCategoryData({ ...editCategoryData, description: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-surface py-2 px-3 text-sm text-white focus:border-primary-500 focus:outline-none h-20 resize-none"
                        maxLength={200}
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingCategoryId(null)}
                        className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !editCategoryData.name.trim()}
                        className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
                      >
                        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 p-2 rounded-lg bg-primary-500/10 text-primary-400">
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-white group-hover:text-primary-300 transition-colors">{cat.name}</h4>
                          {cat.isApproved === false ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                              Pending
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                              Approved
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 max-w-xl leading-relaxed">{cat.description || "No description provided."}</p>
                        <div className="mt-3 flex items-center gap-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                          <span>ID: {cat._id.slice(-6)}</span>
                          <span>•</span>
                          <span>Created: {new Date(cat.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {cat.isApproved === false && (
                        <button 
                          onClick={() => handleApproveClick(cat._id)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
                          title="Approve Category"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditClick(cat)}
                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors"
                        title="Edit Category"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(cat._id, cat.name)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManagement;

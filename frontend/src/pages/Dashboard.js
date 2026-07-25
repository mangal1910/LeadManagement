import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CreateLeadModal from '../components/CreateLeadModal';
import {
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Building,
  Mail,
  UserCheck,
  ArrowUpRight
} from 'lucide-react';

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'];

const STATUS_COLORS = {
  NEW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  CONTACTED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  QUALIFIED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PROPOSAL: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  WON: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  LOST: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
};

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedUserFilter, setAssignedUserFilter] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: viewMode === 'kanban' ? 50 : 10
      };

      if (selectedStatus) params.status = selectedStatus;
      if (searchQuery) params.search = searchQuery;
      if (isAdmin && assignedUserFilter) params.assignedTo = assignedUserFilter;

      const res = await api.get('/leads', { params });
      if (res.data.success) {
        setLeads(res.data.leads);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, selectedStatus, searchQuery, assignedUserFilter, viewMode, isAdmin]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      if (res.data.success) {
        setUsersList(res.data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users list:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleLeadCreated = (newLead) => {
    fetchLeads();
  };

  // Group leads for Kanban board
  const getLeadsByStatus = (status) => {
    return leads.filter((l) => l.status === status);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center space-x-2">
            <span>Leads Dashboard</span>
            {isAdmin ? (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Admin Control View
              </span>
            ) : (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                My Assigned Leads
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Manage pipeline stages, assignments, notes, and activity audit trails.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Switch */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* New Lead Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filtering Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Assignee Filter (Admin only) */}
          {isAdmin && (
            <div className="flex items-center space-x-2 min-w-[200px]">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={assignedUserFilter}
                onChange={(e) => {
                  setAssignedUserFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">All Assignees</option>
                <option value="unassigned">Unassigned Only</option>
                {usersList.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => {
              setSelectedStatus('');
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              selectedStatus === ''
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Statuses
          </button>
          {STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => {
                setSelectedStatus(st);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shrink-0 ${
                selectedStatus === st
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/50 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">Fetching leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto my-8">
          <div className="w-14 h-14 bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">No Leads Found</h3>
          <p className="text-slate-400 text-xs mt-1 mb-4">
            No leads match your current search filters or assigned views.
          </p>
          <button
            onClick={() => {
              setSelectedStatus('');
              setSearchQuery('');
              setAssignedUserFilter('');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STATUSES.map((st) => {
            const statusLeads = getLeadsByStatus(st);
            return (
              <div
                key={st}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col min-w-[240px] min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${STATUS_COLORS[st]}`}>
                    {st}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                    {statusLeads.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {statusLeads.map((lead) => (
                    <Link
                      key={lead._id}
                      to={`/leads/${lead._id}`}
                      className="block bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 rounded-xl p-3.5 shadow-sm transition-all group relative"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                          {lead.name}
                        </h4>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                      </div>

                      {lead.company && (
                        <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-1">
                          <Building className="w-3 h-3 text-slate-500" />
                          <span className="truncate">{lead.company}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span className="truncate">{lead.email}</span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </span>

                        <span className="flex items-center space-x-1 text-slate-300 font-medium bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-700/40">
                          <UserCheck className="w-2.5 h-2.5 text-blue-400" />
                          <span>{lead.assignedTo ? lead.assignedTo.name : 'Unassigned'}</span>
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DATA TABLE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Lead Name</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Assigned Rep</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-100">
                      <div>{lead.name}</div>
                      <div className="text-xs text-slate-500 font-normal">{lead.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{lead.company || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${STATUS_COLORS[lead.status]}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-300">
                      {lead.assignedTo ? (
                        <span className="flex items-center space-x-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                          <span>{lead.assignedTo.name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/leads/${lead._id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <span>View Details</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {viewMode === 'table' && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-6 py-4">
          <div className="text-xs text-slate-400">
            Showing <span className="font-semibold text-slate-200">{leads.length}</span> of{' '}
            <span className="font-semibold text-slate-200">{pagination.total}</span> leads
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-300 px-3">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      <CreateLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLeadCreated={handleLeadCreated}
      />
    </div>
  );
};

export default Dashboard;

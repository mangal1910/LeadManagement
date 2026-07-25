import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  UserCheck,
  Clock,
  MessageSquare,
  Activity,
  Trash2,
  Send,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'];

const ACTION_ICONS = {
  LEAD_CREATED: Sparkles,
  STATUS_CHANGE: CheckCircle2,
  ASSIGNMENT: UserCheck,
  NOTE_ADDED: MessageSquare,
  LEAD_UPDATED: Activity
};

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [lead, setLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Note form state
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchLeadDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/leads/${id}`);
      if (res.data.success) {
        setLead(res.data.lead);
        setNotes(res.data.notes);
        setActivityLogs(res.data.activityLogs);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load lead details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      if (res.data.success) {
        setUsersList(res.data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
    if (isAdmin) {
      fetchUsers();
    }
  }, [fetchLeadDetails, isAdmin]);

  // Handle status update
  const handleStatusChange = async (newStatus) => {
    if (newStatus === lead.status || statusUpdating) return;
    setStatusUpdating(true);
    try {
      const res = await api.put(`/leads/${id}`, { status: newStatus });
      if (res.data.success) {
        fetchLeadDetails(); // Reload to refresh activity log
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Handle assignment change (Admin only)
  const handleAssignmentChange = async (newAssigneeId) => {
    try {
      const res = await api.put(`/leads/${id}`, { assignedTo: newAssigneeId || null });
      if (res.data.success) {
        fetchLeadDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update assignment');
    }
  };

  // Handle adding a note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || addingNote) return;
    setAddingNote(true);
    try {
      const res = await api.post(`/leads/${id}/notes`, { content: newNote.trim() });
      if (res.data.success) {
        setNewNote('');
        fetchLeadDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  // Handle lead deletion (Admin only)
  const handleDeleteLead = async () => {
    if (!window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await api.delete(`/leads/${id}`);
      if (res.data.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete lead');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm font-medium">Loading Lead Details...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-md mx-auto my-16 bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
        <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Lead</h3>
        <p className="text-slate-400 text-xs mb-6">{error || 'Lead not found.'}</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  const currentStatusIndex = STATUSES.indexOf(lead.status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back Button & Admin Header Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {isAdmin && (
          <button
            onClick={handleDeleteLead}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Lead</span>
          </button>
        )}
      </div>

      {/* Main Lead Info Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-md space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100">{lead.name}</h1>
            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-400 flex-wrap gap-y-1">
              <span className="flex items-center space-x-1.5">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>{lead.email}</span>
              </span>
              {lead.phone && (
                <span className="flex items-center space-x-1.5">
                  <Phone className="w-4 h-4 text-indigo-400" />
                  <span>{lead.phone}</span>
                </span>
              )}
              {lead.company && (
                <span className="flex items-center space-x-1.5">
                  <Building className="w-4 h-4 text-amber-400" />
                  <span>{lead.company}</span>
                </span>
              )}
            </div>
          </div>

          {/* Assignment Dropdown / Display */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 min-w-[240px]">
            <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 flex items-center space-x-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Assigned Specialist</span>
            </label>
            {isAdmin ? (
              <select
                value={lead.assignedTo ? lead.assignedTo._id : ''}
                onChange={(e) => handleAssignmentChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="">Unassigned</option>
                {usersList.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm font-semibold text-slate-200">
                {lead.assignedTo ? lead.assignedTo.name : 'Unassigned'}
              </div>
            )}
          </div>
        </div>

        {/* Interactive Status Pipeline */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Lead Status Stage Pipeline
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {STATUSES.map((st, idx) => {
              const isCurrent = lead.status === st;
              const isPassed = idx <= currentStatusIndex && lead.status !== 'LOST';

              return (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  disabled={statusUpdating}
                  className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 scale-105'
                      : isPassed
                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-[10px] opacity-75">Stage {idx + 1}</span>
                  <span>{st}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Notes & Activity Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Notes Section */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <span>Lead Notes</span>
            </h3>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                rows={3}
                required
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a detailed note or client interaction record..."
                className="w-full p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addingNote || !newNote.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/20 flex items-center space-x-1.5 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{addingNote ? 'Posting...' : 'Post Note'}</span>
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-3 pt-2">
              {notes.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-4">
                  No notes recorded yet. Add the first note above!
                </p>
              ) : (
                notes.map((note) => (
                  <div
                    key={note._id}
                    className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-200">
                          {note.authorId ? note.authorId.name : 'Unknown User'}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                          {note.authorId ? note.authorId.role : ''}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {note.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Chronological Activity Trail */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span>Automated Activity Audit Trail</span>
            </h3>

            {/* Activity Log Timeline */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {activityLogs.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">No activity logged yet.</p>
              ) : (
                activityLogs.map((log) => {
                  const IconComponent = ACTION_ICONS[log.actionType] || Activity;
                  return (
                    <div key={log._id} className="relative flex items-start space-x-3">
                      {/* Timeline Marker Icon */}
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-900 border border-blue-500/50 flex items-center justify-center text-blue-400">
                        <IconComponent className="w-3 h-3" />
                      </div>

                      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-3.5 w-full space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">
                            {log.description}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                          {log.userId && (
                            <span>• by {log.userId.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LeadDetail;

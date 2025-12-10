import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesService, contactsService } from '../services';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { 
  Plus, CheckCircle, Circle, Phone, Mail, Check, Calendar, 
  ListTodo, Headphones, Clock, AlertTriangle, Users, 
  Video, MapPin, FileText, Star, ChevronDown, ChevronRight,
  Play, Pause, RotateCcw, Bell, ArrowUpRight, Timer, Target,
  Trash2, Edit
} from 'lucide-react';

// Activity type configurations
const ACTIVITY_TYPES = {
  task: { label: 'Task', icon: ListTodo, color: 'blue' },
  meeting: { label: 'Meeting', icon: Calendar, color: 'purple' },
  call: { label: 'Call', icon: Phone, color: 'green' },
  email: { label: 'Email', icon: Mail, color: 'orange' },
  demo: { label: 'Demo', icon: Play, color: 'pink' },
  proposal: { label: 'Proposal', icon: FileText, color: 'indigo' },
  support_ticket: { label: 'Support Ticket', icon: Headphones, color: 'red' },
  note: { label: 'Note', icon: FileText, color: 'gray' }
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600'
};

const SEVERITY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-600',
  high: 'bg-orange-100 text-orange-600',
  critical: 'bg-red-100 text-red-600'
};

const TICKET_STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-600',
  in_progress: 'bg-yellow-100 text-yellow-600',
  pending_customer: 'bg-purple-100 text-purple-600',
  escalated: 'bg-red-100 text-red-600',
  resolved: 'bg-green-100 text-green-600',
  closed: 'bg-gray-100 text-gray-600'
};

const TYPE_COLORS = {
  task: 'bg-blue-100 text-blue-600',
  meeting: 'bg-purple-100 text-purple-600',
  call: 'bg-green-100 text-green-600',
  email: 'bg-orange-100 text-orange-600',
  demo: 'bg-pink-100 text-pink-600',
  proposal: 'bg-indigo-100 text-indigo-600',
  support_ticket: 'bg-red-100 text-red-600',
  note: 'bg-gray-100 text-gray-600'
};

export const Activities = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [expandedActivities, setExpandedActivities] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [formData, setFormData] = useState({
    type: 'task',
    subject: '',
    description: '',
    scheduled_at: '',
    due_date: '',
    priority: 'medium',
    assigned_to: '',
    contact_id: '',
    // Task specific
    estimated_hours: '',
    is_recurring: false,
    recurrence_pattern: '',
    recurrence_interval: 1,
    checklist: [],
    // Meeting specific
    meeting_type: 'virtual',
    location: '',
    meeting_link: '',
    conference_provider: 'zoom',
    meeting_agenda: '',
    attendees: [],
    reminder_minutes_before: 30,
    // Call specific
    phone_number: '',
    // Support ticket specific
    issue_category: 'general',
    severity: 'medium',
    // Email specific
    email_address: '',
    // Demo/Proposal specific
    products_shown: [],
    proposal_value: ''
  });

  // New checklist item input
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');

  // Queries
  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ['activities', activeTab, filterStatus],
    queryFn: () => {
      const params = { limit: 100 };
      if (activeTab !== 'all') params.type = activeTab;
      if (filterStatus === 'completed') params.is_completed = 'true';
      if (filterStatus === 'pending') params.is_completed = 'false';
      if (filterStatus === 'overdue') params.is_overdue = 'true';
      return activitiesService.getAll(params);
    }
  });

  const { data: statsData } = useQuery({
    queryKey: ['activity-stats'],
    queryFn: activitiesService.getStats
  });

  const { data: teamData } = useQuery({
    queryKey: ['team-members'],
    queryFn: activitiesService.getTeamMembers
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts-list'],
    queryFn: () => contactsService.getAll({ limit: 100 })
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: activitiesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
      queryClient.invalidateQueries(['activity-stats']);
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => activitiesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
      queryClient.invalidateQueries(['activity-stats']);
      closeModal();
    }
  });

  const completeMutation = useMutation({
    mutationFn: activitiesService.complete,
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
      queryClient.invalidateQueries(['activity-stats']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: activitiesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
      queryClient.invalidateQueries(['activity-stats']);
    }
  });

  const checklistMutation = useMutation({
    mutationFn: ({ id, data }) => activitiesService.updateChecklist(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
    }
  });

  const escalateMutation = useMutation({
    mutationFn: ({ id, data }) => activitiesService.escalateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
    }
  });

  // Helpers
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedActivity(null);
    setFormData({
      type: 'task',
      subject: '',
      description: '',
      scheduled_at: '',
      due_date: '',
      priority: 'medium',
      assigned_to: '',
      contact_id: '',
      estimated_hours: '',
      is_recurring: false,
      recurrence_pattern: '',
      recurrence_interval: 1,
      checklist: [],
      meeting_type: 'virtual',
      location: '',
      meeting_link: '',
      conference_provider: 'zoom',
      meeting_agenda: '',
      attendees: [],
      reminder_minutes_before: 30,
      phone_number: '',
      issue_category: 'general',
      severity: 'medium',
      email_address: '',
      products_shown: [],
      proposal_value: ''
    });
    setNewChecklistItem('');
    setNewAttendeeEmail('');
  };

  const openEditModal = (activity) => {
    setSelectedActivity(activity);
    setFormData({
      type: activity.type,
      subject: activity.subject || '',
      description: activity.description || '',
      scheduled_at: activity.scheduled_at ? new Date(activity.scheduled_at).toISOString().slice(0, 16) : '',
      due_date: activity.due_date ? new Date(activity.due_date).toISOString().slice(0, 16) : '',
      priority: activity.priority || 'medium',
      assigned_to: activity.assigned_to || '',
      contact_id: activity.contact_id || '',
      estimated_hours: activity.estimated_hours || '',
      is_recurring: activity.is_recurring || false,
      recurrence_pattern: activity.recurrence_pattern || '',
      recurrence_interval: activity.recurrence_interval || 1,
      checklist: activity.checklist || [],
      meeting_type: activity.meeting_type || 'virtual',
      location: activity.location || '',
      meeting_link: activity.meeting_link || '',
      conference_provider: activity.conference_provider || 'zoom',
      meeting_agenda: activity.meeting_agenda || '',
      attendees: activity.attendees || [],
      reminder_minutes_before: activity.reminder_minutes_before || 30,
      phone_number: activity.custom_fields?.phone_number || '',
      issue_category: activity.issue_category || 'general',
      severity: activity.severity || 'medium',
      email_address: activity.custom_fields?.email_address || '',
      products_shown: activity.products_shown || [],
      proposal_value: activity.proposal_value || ''
    });
    setIsModalOpen(true);
  };

  const isOverdue = (activity) => {
    if (activity.is_completed) return false;
    const checkDate = activity.due_date || activity.scheduled_at || activity.sla_due_at;
    if (!checkDate) return false;
    return new Date(checkDate) < new Date();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setFormData({
      ...formData,
      checklist: [
        ...formData.checklist,
        { id: Date.now().toString(), text: newChecklistItem.trim(), completed: false }
      ]
    });
    setNewChecklistItem('');
  };

  const removeChecklistItem = (itemId) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter(item => item.id !== itemId)
    });
  };

  const addAttendee = () => {
    if (!newAttendeeEmail.trim()) return;
    setFormData({
      ...formData,
      attendees: [
        ...formData.attendees,
        { id: Date.now().toString(), email: newAttendeeEmail.trim(), status: 'pending' }
      ]
    });
    setNewAttendeeEmail('');
  };

  const removeAttendee = (attendeeId) => {
    setFormData({
      ...formData,
      attendees: formData.attendees.filter(a => a.id !== attendeeId)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    
    // Store phone_number and email_address in custom_fields
    const customFields = {};
    if (submitData.phone_number) customFields.phone_number = submitData.phone_number;
    if (submitData.email_address) customFields.email_address = submitData.email_address;
    if (Object.keys(customFields).length > 0) submitData.custom_fields = customFields;
    
    // Clean up based on type
    delete submitData.phone_number;
    delete submitData.email_address;
    
    // Remove empty fields
    Object.keys(submitData).forEach(key => {
      if (submitData[key] === '' || submitData[key] === null) {
        delete submitData[key];
      }
    });

    if (selectedActivity) {
      updateMutation.mutate({ id: selectedActivity.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const toggleChecklistItem = (activityId, itemId, completed) => {
    checklistMutation.mutate({
      id: activityId,
      data: { itemId, completed: !completed }
    });
  };

  const toggleExpand = (activityId) => {
    setExpandedActivities(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };

  const handleDelete = (activityId) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      deleteMutation.mutate(activityId);
    }
  };

  // Stats display
  const stats = statsData?.stats || {};

  const tabs = [
    { id: 'all', label: 'All Activities' },
    { id: 'task', label: 'Tasks', icon: ListTodo },
    { id: 'meeting', label: 'Meetings', icon: Calendar },
    { id: 'call', label: 'Calls', icon: Phone },
    { id: 'support_ticket', label: 'Tickets', icon: Headphones }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
          <p className="text-gray-600 mt-1">Manage tasks, meetings, calls, and support tickets</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          New Activity
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Tasks</p>
              <p className="text-2xl font-bold text-blue-700">{stats.tasks?.completed || 0}/{stats.tasks?.total || 0}</p>
              <p className="text-xs text-blue-500">{stats.tasks?.completion_rate || 0}% completed</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ListTodo className="text-blue-600" size={24} />
            </div>
          </div>
          {stats.tasks?.overdue > 0 && (
            <p className="text-xs text-red-500 mt-2 flex items-center">
              <AlertTriangle size={12} className="mr-1" />
              {stats.tasks.overdue} overdue
            </p>
          )}
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Meetings Today</p>
              <p className="text-2xl font-bold text-purple-700">{stats.meetings?.today || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Calls Today</p>
              <p className="text-2xl font-bold text-green-700">{stats.calls?.today || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Phone className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Open Tickets</p>
              <p className="text-2xl font-bold text-red-700">{stats.tickets?.open || 0}</p>
              {stats.tickets?.sla_breach > 0 && (
                <p className="text-xs text-red-500">{stats.tickets.sla_breach} SLA breached</p>
              )}
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Headphones className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon && <tab.icon size={16} />}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <select
          className="input w-40"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Activities List */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {activitiesData?.activities?.map((activity) => {
              const TypeConfig = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.note;
              const isExpanded = expandedActivities[activity.id];
              const checklistProgress = activity.checklist?.length > 0 
                ? Math.round((activity.checklist.filter(i => i.completed).length / activity.checklist.length) * 100)
                : null;

              return (
                <div 
                  key={activity.id} 
                  className={`border rounded-lg p-4 ${
                    isOverdue(activity) ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  } ${activity.is_completed ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex gap-4">
                    {/* Status Indicator */}
                    <div className="flex-shrink-0 mt-1">
                      <button
                        onClick={() => !activity.is_completed && completeMutation.mutate(activity.id)}
                        disabled={activity.is_completed || completeMutation.isPending}
                        className="focus:outline-none"
                      >
                        {activity.is_completed ? (
                          <CheckCircle className="text-green-500" size={24} />
                        ) : (
                          <Circle className="text-gray-300 hover:text-green-400" size={24} />
                        )}
                      </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Title Row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[activity.type] || 'bg-gray-100 text-gray-600'}`}>
                              <TypeConfig.icon size={12} className="inline mr-1" />
                              {TypeConfig.label}
                            </span>
                            
                            {activity.priority && activity.type !== 'support_ticket' && (
                              <span className={`px-2 py-0.5 rounded text-xs ${PRIORITY_COLORS[activity.priority]}`}>
                                {activity.priority}
                              </span>
                            )}

                            {activity.severity && activity.type === 'support_ticket' && (
                              <span className={`px-2 py-0.5 rounded text-xs ${SEVERITY_COLORS[activity.severity]}`}>
                                {activity.severity}
                              </span>
                            )}

                            {activity.ticket_status && (
                              <span className={`px-2 py-0.5 rounded text-xs ${TICKET_STATUS_COLORS[activity.ticket_status]}`}>
                                {activity.ticket_status.replace('_', ' ')}
                              </span>
                            )}

                            {activity.is_recurring && (
                              <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-600">
                                <RotateCcw size={10} className="inline mr-1" />
                                {activity.recurrence_pattern}
                              </span>
                            )}

                            {activity.sla_breached && (
                              <span className="px-2 py-0.5 rounded text-xs bg-red-500 text-white">
                                SLA Breached
                              </span>
                            )}
                          </div>

                          {/* Subject */}
                          <h3 className={`font-medium mt-1 ${activity.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {activity.ticket_number && <span className="text-gray-500 mr-2">{activity.ticket_number}</span>}
                            {activity.subject}
                          </h3>

                          {/* Description */}
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{activity.description}</p>
                          )}

                          {/* Meta Info */}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                            {(activity.due_date || activity.scheduled_at) && (
                              <span className={`flex items-center ${isOverdue(activity) ? 'text-red-600 font-medium' : ''}`}>
                                <Clock size={12} className="mr-1" />
                                {new Date(activity.due_date || activity.scheduled_at).toLocaleDateString()} 
                                {activity.scheduled_at && ` ${new Date(activity.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                              </span>
                            )}

                            {activity.AssignedUser && (
                              <span className="flex items-center">
                                <Users size={12} className="mr-1" />
                                {activity.AssignedUser.first_name} {activity.AssignedUser.last_name}
                              </span>
                            )}

                            {activity.Contact && (
                              <span className="flex items-center">
                                <Target size={12} className="mr-1" />
                                {activity.Contact.first_name} {activity.Contact.last_name}
                              </span>
                            )}

                            {activity.estimated_hours && (
                              <span className="flex items-center">
                                <Timer size={12} className="mr-1" />
                                Est: {activity.estimated_hours}h
                                {activity.actual_hours && ` / Act: ${activity.actual_hours}h`}
                              </span>
                            )}

                            {activity.call_duration && (
                              <span className="flex items-center">
                                <Clock size={12} className="mr-1" />
                                Duration: {formatDuration(activity.call_duration)}
                              </span>
                            )}

                            {activity.call_outcome && (
                              <span className="capitalize">{activity.call_outcome.replace('_', ' ')}</span>
                            )}

                            {activity.meeting_type && (
                              <span className="flex items-center">
                                {activity.meeting_type === 'virtual' ? <Video size={12} className="mr-1" /> : <MapPin size={12} className="mr-1" />}
                                {activity.meeting_type.replace('_', ' ')}
                              </span>
                            )}

                            {activity.customer_satisfaction && (
                              <span className="flex items-center">
                                {[1,2,3,4,5].map(star => (
                                  <Star 
                                    key={star} 
                                    size={12} 
                                    className={star <= activity.customer_satisfaction ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                                  />
                                ))}
                              </span>
                            )}
                          </div>

                          {/* Progress Bar for checklists */}
                          {checklistProgress !== null && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${activity.progress || checklistProgress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">{activity.progress || checklistProgress}%</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {/* Expand button for items with details */}
                          {(activity.checklist?.length > 0 || activity.attendees?.length > 0 || activity.meeting_agenda) && (
                            <button
                              onClick={() => toggleExpand(activity.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          )}

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditModal(activity)}
                          >
                            <Edit size={14} />
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDelete(activity.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </Button>

                          {activity.type === 'call' && !activity.is_completed && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                const phone = activity.custom_fields?.phone_number || activity.Contact?.phone;
                                if (phone) window.location.href = `tel:${phone}`;
                              }}
                            >
                              <Phone size={14} className="mr-1" />
                              Call
                            </Button>
                          )}

                          {activity.type === 'meeting' && activity.meeting_link && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => window.open(activity.meeting_link, '_blank')}
                            >
                              <Video size={14} className="mr-1" />
                              Join
                            </Button>
                          )}

                          {activity.type === 'support_ticket' && activity.ticket_status !== 'escalated' && !activity.is_completed && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => escalateMutation.mutate({ 
                                id: activity.id, 
                                data: { reason: 'Needs attention' } 
                              })}
                            >
                              <ArrowUpRight size={14} className="mr-1" />
                              Escalate
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          {/* Checklist */}
                          {activity.checklist?.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Checklist</h4>
                              <div className="space-y-2">
                                {activity.checklist.map(item => (
                                  <div key={item.id} className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleChecklistItem(activity.id, item.id, item.completed)}
                                      className="focus:outline-none"
                                    >
                                      {item.completed ? (
                                        <CheckCircle className="text-green-500" size={16} />
                                      ) : (
                                        <Circle className="text-gray-300" size={16} />
                                      )}
                                    </button>
                                    <span className={item.completed ? 'line-through text-gray-400' : 'text-gray-700'}>
                                      {item.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Attendees */}
                          {activity.attendees?.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Attendees</h4>
                              <div className="flex flex-wrap gap-2">
                                {activity.attendees.map(attendee => (
                                  <span 
                                    key={attendee.id || attendee.email}
                                    className={`px-2 py-1 rounded text-xs ${
                                      attendee.status === 'accepted' ? 'bg-green-100 text-green-600' :
                                      attendee.status === 'declined' ? 'bg-red-100 text-red-600' :
                                      attendee.status === 'tentative' ? 'bg-yellow-100 text-yellow-600' :
                                      'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {attendee.name || attendee.email} ({attendee.status})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Meeting Agenda */}
                          {activity.meeting_agenda && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Agenda</h4>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{activity.meeting_agenda}</p>
                            </div>
                          )}

                          {/* Meeting Notes */}
                          {activity.meeting_notes && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{activity.meeting_notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {activitiesData?.activities?.length === 0 && (
              <div className="text-center py-12">
                <ListTodo className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">No activities found</p>
                <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
                  <Plus size={16} className="mr-2" />
                  Create your first activity
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={selectedActivity ? 'Edit Activity' : 'New Activity'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              disabled={!!selectedActivity}
            >
              {Object.entries(ACTIVITY_TYPES).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                className="input"
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              >
                <option value="">Unassigned</option>
                {teamData?.users?.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
              <select
                className="input"
                value={formData.contact_id}
                onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
              >
                <option value="">No contact</option>
                {contactsData?.contacts?.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Task-specific fields */}
          {formData.type === 'task' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    className="input"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <Input
                  label="Due Date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <Input
                label="Estimated Hours"
                type="number"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
              />

              {/* Recurring */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Recurring task</span>
                </label>
              </div>

              {formData.is_recurring && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Repeat</label>
                    <select
                      className="input"
                      value={formData.recurrence_pattern}
                      onChange={(e) => setFormData({ ...formData, recurrence_pattern: e.target.value })}
                    >
                      <option value="">Select...</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <Input
                    label="Every X times"
                    type="number"
                    min="1"
                    value={formData.recurrence_interval}
                    onChange={(e) => setFormData({ ...formData, recurrence_interval: parseInt(e.target.value) })}
                  />
                </div>
              )}

              {/* Checklist */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Checklist</label>
                <div className="space-y-2 mb-2">
                  {formData.checklist.map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-gray-300" />
                      <span className="flex-1 text-sm">{item.text}</span>
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(item.id)}
                        className="text-red-500 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add checklist item..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                  />
                  <Button type="button" variant="secondary" onClick={addChecklistItem}>
                    Add
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Meeting-specific fields */}
          {formData.type === 'meeting' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Scheduled Date/Time"
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Type</label>
                  <select
                    className="input"
                    value={formData.meeting_type}
                    onChange={(e) => setFormData({ ...formData, meeting_type: e.target.value })}
                  >
                    <option value="virtual">Virtual</option>
                    <option value="in_person">In Person</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>
              </div>

              {formData.meeting_type === 'virtual' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                    <select
                      className="input"
                      value={formData.conference_provider}
                      onChange={(e) => setFormData({ ...formData, conference_provider: e.target.value })}
                    >
                      <option value="zoom">Zoom</option>
                      <option value="teams">Microsoft Teams</option>
                      <option value="google_meet">Google Meet</option>
                      <option value="webex">WebEx</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <Input
                    label="Meeting Link"
                    type="url"
                    value={formData.meeting_link}
                    onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}

              {formData.meeting_type === 'in_person' && (
                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter meeting location"
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Agenda</label>
                <textarea
                  className="input"
                  rows="3"
                  value={formData.meeting_agenda}
                  onChange={(e) => setFormData({ ...formData, meeting_agenda: e.target.value })}
                  placeholder="Enter meeting agenda..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reminder</label>
                <select
                  className="input"
                  value={formData.reminder_minutes_before}
                  onChange={(e) => setFormData({ ...formData, reminder_minutes_before: parseInt(e.target.value) })}
                >
                  <option value="5">5 minutes before</option>
                  <option value="15">15 minutes before</option>
                  <option value="30">30 minutes before</option>
                  <option value="60">1 hour before</option>
                  <option value="1440">1 day before</option>
                </select>
              </div>

              {/* Attendees */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attendees</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.attendees.map(attendee => (
                    <span key={attendee.id} className="px-2 py-1 bg-gray-100 rounded text-sm flex items-center gap-1">
                      {attendee.email}
                      <button
                        type="button"
                        onClick={() => removeAttendee(attendee.id)}
                        className="text-red-500 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Add attendee email..."
                    value={newAttendeeEmail}
                    onChange={(e) => setNewAttendeeEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                  />
                  <Button type="button" variant="secondary" onClick={addAttendee}>
                    Add
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Call-specific fields */}
          {formData.type === 'call' && (
            <>
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+1234567890"
              />

              <Input
                label="Scheduled Date/Time"
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              />
            </>
          )}

          {/* Email-specific fields */}
          {formData.type === 'email' && (
            <Input
              label="Email Address"
              type="email"
              value={formData.email_address}
              onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
              placeholder="recipient@example.com"
            />
          )}

          {/* Support Ticket-specific fields */}
          {formData.type === 'support_ticket' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="input"
                    value={formData.issue_category}
                    onChange={(e) => setFormData({ ...formData, issue_category: e.target.value })}
                  >
                    <option value="general">General</option>
                    <option value="bug">Bug</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="billing">Billing</option>
                    <option value="technical">Technical</option>
                    <option value="complaint">Complaint</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select
                    className="input"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Demo-specific fields */}
          {formData.type === 'demo' && (
            <>
              <Input
                label="Scheduled Date/Time"
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Products to Demo</label>
                <textarea
                  className="input"
                  rows="2"
                  value={formData.products_shown?.join('\n') || ''}
                  onChange={(e) => setFormData({ ...formData, products_shown: e.target.value.split('\n').filter(p => p.trim()) })}
                  placeholder="Enter products (one per line)"
                />
              </div>
            </>
          )}

          {/* Proposal-specific fields */}
          {formData.type === 'proposal' && (
            <>
              <Input
                label="Proposal Value"
                type="number"
                step="0.01"
                value={formData.proposal_value}
                onChange={(e) => setFormData({ ...formData, proposal_value: e.target.value })}
                placeholder="0.00"
              />

              <Input
                label="Due Date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending 
                ? 'Saving...' 
                : selectedActivity ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Mail, Send, Reply, Users, Trash2, Eye, X, Plus, 
  ChevronDown, ChevronUp, Search, Filter, MoreVertical,
  ArrowLeft, Paperclip, CornerUpLeft, UserCircle2,
  Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Loading } from '../components/common/Loading';
import api from '../services/api';
import { contactsService } from '../services';

// Email Service
const emailService = {
  getAll: async (params) => {
    const response = await api.get('/email', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/email/${id}`);
    return response.data;
  },
  send: async (data) => {
    const response = await api.post('/email/send', data);
    return response.data;
  },
  reply: async (id, message) => {
    const response = await api.post(`/email/${id}/reply`, { message });
    return response.data;
  },
  replyAll: async (id, message) => {
    const response = await api.post(`/email/${id}/reply-all`, { message });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/email/${id}`);
    return response.data;
  },
};

// Compose Email Modal Component
const ComposeEmailModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });
  const [sendto, setSendto] = useState('');
  const [customername, setCustomername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsService.getAll({ limit: 100 }),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let recipientEmail = '';

      if (sendto === '1') {
        const allEmails = contactsData?.contacts?.map(contact => contact.email).filter(Boolean).join(', ');
        recipientEmail = allEmails;
      } else if (sendto === '2' && customername) {
        const selectedContact = contactsData?.contacts?.find(c => String(c.id) === String(customername));
        recipientEmail = selectedContact?.email || '';
      }

      if (!recipientEmail) {
        setError('No valid email addresses found.');
        setLoading(false);
        return;
      }

      await emailService.send({
        to: recipientEmail,
        subject: formData.subject,
        message: formData.message,
      });

      setFormData({ subject: '', message: '' });
      setSendto('');
      setCustomername('');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ subject: '', message: '' });
    setSendto('');
    setCustomername('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary-600" />
              Compose New Email
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Send To <span className="text-red-500">*</span>
              </label>
              <Select value={sendto} onChange={(e) => setSendto(e.target.value)}>
                <option value="">Choose option</option>
                <option value="1">All Customers</option>
                <option value="2">Individual Customer</option>
              </Select>
            </div>

            {sendto === '2' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer <span className="text-red-500">*</span>
                </label>
                <Select value={customername} onChange={(e) => setCustomername(e.target.value)} disabled={contactsLoading}>
                  <option value="">Choose customer</option>
                  {contactsData?.contacts?.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name} {contact.email ? `(${contact.email})` : ''}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Enter email subject"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Type your message here..."
                rows={8}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button type="button" variant="secondary" onClick={handleClear} disabled={loading}>
                Clear
              </Button>
              <Button
                type="submit"
                disabled={loading || !sendto || (sendto === '2' && !customername) || !formData.subject || !formData.message}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Send Email
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Email Detail Modal Component
const EmailDetailModal = ({ email, isOpen, onClose, onReply, onReplyAll, onDelete }) => {
  const [replyMessage, setReplyMessage] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState(true);

  if (!isOpen || !email) return null;

  const handleReply = async (replyAll = false) => {
    if (!replyMessage.trim()) return;
    
    setReplyLoading(true);
    try {
      if (replyAll) {
        await onReplyAll(email.id, replyMessage);
      } else {
        await onReply(email.id, replyMessage);
      }
      setReplyMessage('');
      setShowReplyForm(false);
    } finally {
      setReplyLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const recipientCount = email.to_email?.split(',').length || 0;
  const isBulk = recipientCount > 1;
  const isReceived = email.type === 'received' || (email.type === 'reply' && email.from_email);
  const canReply = true; // Allow replies to all emails

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start p-6 border-b">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{email.subject}</h2>
              {email.from_email ? (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <span className="font-medium text-green-600">From:</span>
                  <span>{email.from_email}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <span className="font-medium">To:</span>
                  {isBulk ? (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {recipientCount} recipients
                    </span>
                  ) : (
                    <span>{email.to_email}</span>
                  )}
                </div>
              )}
              <div className="text-sm text-gray-500 mt-1">
                {formatDate(email.created_at)}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Original Message */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="whitespace-pre-wrap text-gray-700">{email.message}</p>
            </div>

            {/* Recipients List for Bulk Emails */}
            {isBulk && (
              <div className="mb-4">
                <button
                  onClick={() => setExpandedReplies(!expandedReplies)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                >
                  {expandedReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  View Recipients ({recipientCount})
                </button>
                {expandedReplies && (
                  <div className="mt-2 bg-blue-50 rounded-lg p-3">
                    <div className="flex flex-wrap gap-2">
                      {email.to_email.split(',').map((recipient, idx) => (
                        <span key={idx} className="bg-white px-2 py-1 rounded text-sm text-gray-700 border">
                          {recipient.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Replies */}
            {email.replies && email.replies.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Replies ({email.replies.length})</h4>
                {email.replies.map((reply) => (
                  <div key={reply.id} className="bg-blue-50 rounded-lg p-4 border-l-4 border-primary-500">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-700">You replied</span>
                      <span className="text-xs text-gray-500">{formatDate(reply.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-gray-700 text-sm">{reply.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Form */}
            {showReplyForm && (
              <div className="mt-4 border-t pt-4">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => handleReply(false)}
                    disabled={replyLoading || !replyMessage.trim()}
                    size="sm"
                  >
                    {replyLoading ? 'Sending...' : 'Send Reply'}
                  </Button>
                  {isBulk && (
                    <Button
                      onClick={() => handleReply(true)}
                      disabled={replyLoading || !replyMessage.trim()}
                      variant="secondary"
                      size="sm"
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Reply All
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyMessage('');
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center p-4 border-t bg-gray-50">
            <Button
              onClick={() => onDelete(email.id)}
              variant="secondary"
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            
            <div className="flex gap-2">
              {!showReplyForm && canReply && (
                <>
                  <Button onClick={() => setShowReplyForm(true)}>
                    <Reply className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                  {(isBulk || isReceived) && (
                    <Button onClick={() => setShowReplyForm(true)} variant="secondary">
                      <Users className="w-4 h-4 mr-2" />
                      Reply All
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Email Page Component - HubSpot Style
export const Emails = () => {
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, sent, received, unread
  const [contactSearch, setContactSearch] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch emails
  const { data: emailData, isLoading: emailsLoading } = useQuery({
    queryKey: ['emails'],
    queryFn: () => emailService.getAll({ limit: 100 }),
  });

  // Fetch contacts
  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsService.getAll({ limit: 100 }),
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: ({ id, message }) => emailService.reply(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries(['emails']);
      setReplyMessage('');
      setShowReplyBox(false);
      // Refresh the thread
      if (selectedThread) {
        emailService.getById(selectedThread.id).then((res) => {
          setSelectedThread(res.email);
        });
      }
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => emailService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['emails']);
      setSelectedThread(null);
      setShowReplyBox(false);
    },
  });

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedThread) return;
    await replyMutation.mutateAsync({ id: selectedThread.id, message: replyMessage });
  };

  const handleDeleteThread = async () => {
    if (!selectedThread) return;
    if (window.confirm('Delete this email thread?')) {
      await deleteMutation.mutateAsync(selectedThread.id);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInDays === 0) {
      if (diffInHours === 0) {
        if (diffInMinutes === 0) return 'Just now';
        return `${diffInMinutes}m ago`;
      }
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (emailsLoading || contactsLoading) {
    return <Loading />;
  }

  const emails = emailData?.emails || [];
  const contacts = contactsData?.contacts || [];

  // Group emails by contact (based on email address)
  const emailsByContact = {};
  emails.forEach((email) => {
    const contactEmail = email.type === 'received' ? email.from_email : email.to_email;
    if (!contactEmail) return;
    
    // Handle bulk emails separately
    if (email.is_bulk) {
      if (!emailsByContact['bulk']) {
        emailsByContact['bulk'] = [];
      }
      emailsByContact['bulk'].push(email);
    } else {
      const emailKey = contactEmail.toLowerCase().trim();
      if (!emailsByContact[emailKey]) {
        emailsByContact[emailKey] = [];
      }
      emailsByContact[emailKey].push(email);
    }
  });

  // Create contact list with email counts
  const contactList = contacts
    .map((contact) => {
      const emailKey = contact.email?.toLowerCase().trim();
      const contactEmails = emailKey ? (emailsByContact[emailKey] || []) : [];
      const unreadCount = contactEmails.filter(e => !e.read_at).length;
      const lastEmail = contactEmails.length > 0 
        ? contactEmails.reduce((latest, email) => 
            new Date(email.created_at) > new Date(latest.created_at) ? email : latest
          )
        : null;
      
      return {
        ...contact,
        emailCount: contactEmails.length,
        unreadCount,
        lastEmail,
        emails: contactEmails.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        ),
      };
    })
    .filter((contact) => contact.emailCount > 0);

  // Add bulk emails as a special "contact"
  if (emailsByContact['bulk'] && emailsByContact['bulk'].length > 0) {
    const bulkEmails = emailsByContact['bulk'].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    contactList.unshift({
      id: 'bulk',
      first_name: 'Bulk',
      last_name: 'Emails',
      email: 'bulk@system',
      emailCount: bulkEmails.length,
      unreadCount: bulkEmails.filter(e => !e.read_at).length,
      lastEmail: bulkEmails[0],
      emails: bulkEmails,
      isBulk: true,
    });
  }

  // Sort contacts by last email date
  contactList.sort((a, b) => {
    if (!a.lastEmail) return 1;
    if (!b.lastEmail) return -1;
    return new Date(b.lastEmail.created_at) - new Date(a.lastEmail.created_at);
  });

  // Filter contacts based on search
  const filteredContacts = contactList.filter((contact) => {
    const searchLower = contactSearch.toLowerCase();
    const nameMatch = `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchLower);
    const emailMatch = contact.email?.toLowerCase().includes(searchLower);
    return nameMatch || emailMatch;
  });

  // Get current thread emails
  const currentThreadEmails = selectedThread 
    ? [selectedThread, ...(selectedThread.replies || [])].sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      )
    : [];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email</h1>
            <p className="text-sm text-gray-600 mt-1">
              {contactList.length} conversations • {emails.length} total emails
            </p>
          </div>
          <Button onClick={() => setComposeModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Compose
          </Button>
        </div>
      </div>

      {/* Main Content - Split Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Contacts/Conversations List */}
        <div className="w-96 bg-white border-r flex flex-col">
          {/* Search & Filter */}
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === 'unread' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setFilter('sent')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === 'sent' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sent
              </button>
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Mail className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No conversations found</p>
              </div>
            ) : (
              filteredContacts
                .filter(contact => {
                  if (filter === 'unread') return contact.unreadCount > 0;
                  if (filter === 'sent') return contact.emails.some(e => e.type === 'sent');
                  return true;
                })
                .map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => {
                      setSelectedContact(contact);
                      const latestEmail = contact.emails[0];
                      emailService.getById(latestEmail.id).then((res) => {
                        setSelectedThread(res.email);
                      });
                      setShowReplyBox(false);
                    }}
                    className={`p-4 border-b cursor-pointer transition-colors ${
                      selectedContact?.id === contact.id
                        ? 'bg-primary-50 border-l-4 border-l-primary-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0 ${
                        contact.isBulk 
                          ? 'bg-purple-500' 
                          : 'bg-gradient-to-br from-primary-500 to-primary-700'
                      }`}>
                        {contact.isBulk ? (
                          <Users className="w-5 h-5" />
                        ) : (
                          `${contact.first_name?.charAt(0) || ''}${contact.last_name?.charAt(0) || ''}`
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`text-sm truncate ${
                            contact.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                          }`}>
                            {contact.first_name} {contact.last_name}
                          </h3>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {contact.lastEmail ? formatDate(contact.lastEmail.created_at) : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-600 truncate">
                            {contact.isBulk ? 'Multiple recipients' : contact.email}
                          </span>
                        </div>

                        {contact.lastEmail && (
                          <p className={`text-sm truncate ${
                            contact.unreadCount > 0 ? 'font-semibold text-gray-700' : 'text-gray-500'
                          }`}>
                            {contact.lastEmail.subject}
                          </p>
                        )}

                        {/* Badges */}
                        <div className="flex items-center gap-2 mt-2">
                          {contact.unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              {contact.unreadCount} new
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {contact.emailCount} {contact.emailCount === 1 ? 'email' : 'emails'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Right Panel - Email Thread View */}
        <div className="flex-1 flex flex-col bg-white">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-500 mb-6">
                  Choose a contact from the list to view email thread
                </p>
                <Button onClick={() => setComposeModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Compose New Email
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="border-b p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-medium text-lg">
                      {selectedContact?.isBulk ? (
                        <Users className="w-6 h-6" />
                      ) : (
                        `${selectedContact?.first_name?.charAt(0) || ''}${selectedContact?.last_name?.charAt(0) || ''}`
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedContact?.first_name} {selectedContact?.last_name}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedContact?.isBulk ? 'Multiple recipients' : selectedContact?.email}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500">
                          {currentThreadEmails.length} {currentThreadEmails.length === 1 ? 'message' : 'messages'}
                        </span>
                        {selectedContact?.company && (
                          <span className="text-xs text-gray-500">• {selectedContact.company}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDeleteThread}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Delete thread"
                    >
                      <Trash2 className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="More options"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Email Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {currentThreadEmails.map((email, index) => {
                  const isReply = email.type === 'reply';
                  const isReceived = email.type === 'received';
                  const isFirst = index === 0;

                  return (
                    <div
                      key={email.id}
                      className="bg-white rounded-lg shadow-sm border p-5"
                    >
                      {/* Email Header */}
                      <div className="flex items-start justify-between mb-4 pb-4 border-b">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                            isReceived ? 'bg-green-500' : 'bg-primary-600'
                          }`}>
                            {isReceived ? (
                              selectedContact?.first_name?.charAt(0) || 'C'
                            ) : (
                              'Y'
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {isReceived 
                                  ? `${selectedContact?.first_name} ${selectedContact?.last_name}`
                                  : 'You'}
                              </span>
                              {isReply && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                                  Reply
                                </span>
                              )}
                              {email.is_bulk && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-medium">
                                  Bulk
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {isReceived ? 'From' : 'To'}: {isReceived ? email.from_email : email.to_email}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <Clock className="w-3 h-3" />
                              {formatFullDate(email.created_at)}
                            </div>
                          </div>
                        </div>

                        {email.status === 'sent' && (
                          <div className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircle className="w-3 h-3" />
                            <span>Sent</span>
                          </div>
                        )}
                      </div>

                      {/* Email Subject (for first email) */}
                      {isFirst && (
                        <div className="mb-4 pb-3 border-b">
                          <h3 className="text-lg font-semibold text-gray-900">{email.subject}</h3>
                        </div>
                      )}

                      {/* Email Body */}
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">{email.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <div className="border-t bg-white p-4">
                {!showReplyBox ? (
                  <Button 
                    onClick={() => setShowReplyBox(true)}
                    className="w-full"
                  >
                    <CornerUpLeft className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <UserCircle2 className="w-4 h-4" />
                      <span>Replying to {selectedContact?.email}</span>
                    </div>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
                    />
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setShowReplyBox(false);
                          setReplyMessage('');
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSendReply}
                          disabled={!replyMessage.trim() || replyMutation.isPending}
                        >
                          {replyMutation.isPending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send Reply
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      <ComposeEmailModal
        isOpen={composeModalOpen}
        onClose={() => setComposeModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries(['emails']);
          setComposeModalOpen(false);
        }}
      />
    </div>
  );
};

export default Emails;

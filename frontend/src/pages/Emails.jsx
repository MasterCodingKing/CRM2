import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Send, Reply, Users, Trash2, Eye, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
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
              {!showReplyForm && (
                <>
                  <Button onClick={() => setShowReplyForm(true)}>
                    <Reply className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                  {isBulk && (
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

// Main Email Page Component
export const Emails = () => {
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch emails
  const { data, isLoading, error } = useQuery({
    queryKey: ['emails'],
    queryFn: () => emailService.getAll({ limit: 50 }),
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: ({ id, message }) => emailService.reply(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries(['emails']);
      // Refresh selected email
      if (selectedEmail) {
        emailService.getById(selectedEmail.id).then((res) => {
          setSelectedEmail(res.email);
        });
      }
    },
  });

  // Reply All mutation
  const replyAllMutation = useMutation({
    mutationFn: ({ id, message }) => emailService.replyAll(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries(['emails']);
      if (selectedEmail) {
        emailService.getById(selectedEmail.id).then((res) => {
          setSelectedEmail(res.email);
        });
      }
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => emailService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['emails']);
      setDetailModalOpen(false);
      setSelectedEmail(null);
    },
  });

  const handleViewEmail = async (email) => {
    try {
      const response = await emailService.getById(email.id);
      setSelectedEmail(response.email);
      setDetailModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch email:', err);
    }
  };

  const handleReply = async (id, message) => {
    await replyMutation.mutateAsync({ id, message });
  };

  const handleReplyAll = async (id, message) => {
    await replyAllMutation.mutateAsync({ id, message });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this email?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return <Loading />;
  }

  const emails = data?.emails || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emails</h1>
          <p className="text-gray-600 mt-1">Manage your sent emails and replies</p>
        </div>
        <Button onClick={() => setComposeModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Compose Email
        </Button>
      </div>

      {/* Email List */}
      <div className="card">
        {emails.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No emails yet</h3>
            <p className="text-gray-500 mb-4">Start by composing your first email</p>
            <Button onClick={() => setComposeModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Compose Email
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {emails.map((email) => {
              const recipientCount = email.to_email?.split(',').length || 0;
              const isBulk = recipientCount > 1;
              const hasReplies = email.replies && email.replies.length > 0;
              const isReceived = email.type === 'received' || email.type === 'reply' && email.from_email;

              return (
                <div
                  key={email.id}
                  onClick={() => handleViewEmail(email)}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isReceived ? 'bg-green-100 text-green-600' :
                    isBulk ? 'bg-purple-100 text-purple-600' : 'bg-primary-100 text-primary-600'
                  }`}>
                    {isReceived ? <Mail className="w-5 h-5" /> : 
                     isBulk ? <Users className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {isReceived ? 
                          <span className="flex items-center gap-1">
                            <span className="text-green-600">From:</span> {email.from_email || email.to_email}
                          </span> :
                          isBulk ? `${recipientCount} recipients` : email.to_email
                        }
                      </span>
                      {isReceived && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          Received
                        </span>
                      )}
                      {isBulk && !isReceived && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Bulk
                        </span>
                      )}
                      {hasReplies && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {email.replies.length} replies
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-900 font-medium truncate mt-0.5">
                      {email.subject}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {email.message.substring(0, 100)}...
                    </div>
                  </div>

                  {/* Date & Actions */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(email.created_at)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(email.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      <ComposeEmailModal
        isOpen={composeModalOpen}
        onClose={() => setComposeModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries(['emails'])}
      />

      {/* Email Detail Modal */}
      <EmailDetailModal
        email={selectedEmail}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedEmail(null);
        }}
        onReply={handleReply}
        onReplyAll={handleReplyAll}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Emails;

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { 
  Facebook, Twitter, Instagram, Linkedin, Youtube, 
  MessageSquare, Heart, Share2, Eye, TrendingUp,
  Calendar, Send, Image, Video, BarChart3, Users,
  Plus, Settings, RefreshCw, ExternalLink, Clock,
  Inbox, UserPlus, DollarSign, Target, ChevronRight,
  Check, X, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Loading } from '../components/common/Loading';
import api from '../services/api';

// Social Media Service
const socialMediaService = {
  // OAuth
  getAuthUrl: async (platform) => {
    const response = await api.get(`/social-media/auth/${platform}`);
    return response.data;
  },
  
  // Accounts
  getAccounts: async () => {
    const response = await api.get('/social-media/accounts');
    return response.data;
  },
  getAccountPages: async (id) => {
    const response = await api.get(`/social-media/accounts/${id}/pages`);
    return response.data;
  },
  connectAccount: async (data) => {
    const response = await api.post('/social-media/accounts/connect', data);
    return response.data;
  },
  disconnectAccount: async (id) => {
    const response = await api.delete(`/social-media/accounts/${id}`);
    return response.data;
  },
  
  // Posts
  getPosts: async (params) => {
    const response = await api.get('/social-media/posts', { params });
    return response.data;
  },
  createPost: async (data) => {
    const response = await api.post('/social-media/posts', data);
    return response.data;
  },
  schedulePost: async (data) => {
    const response = await api.post('/social-media/posts/schedule', data);
    return response.data;
  },
  
  // Inbox
  getInbox: async (params) => {
    const response = await api.get('/social-media/inbox', { params });
    return response.data;
  },
  getMessages: async (conversationId, params) => {
    const response = await api.get(`/social-media/conversations/${conversationId}/messages`, { params });
    return response.data;
  },
  sendMessage: async (conversationId, data) => {
    const response = await api.post(`/social-media/conversations/${conversationId}/messages`, data);
    return response.data;
  },
  
  // Leads
  getLeadForms: async () => {
    const response = await api.get('/social-media/leads/forms');
    return response.data;
  },
  getFormLeads: async (formId, accountId) => {
    const response = await api.get(`/social-media/leads/forms/${formId}`, { params: { accountId } });
    return response.data;
  },
  importLead: async (leadId, accountId) => {
    const response = await api.post(`/social-media/leads/${leadId}/import`, { accountId });
    return response.data;
  },
  
  // Ads
  getAdAccounts: async () => {
    const response = await api.get('/social-media/ads/accounts');
    return response.data;
  },
  getCampaigns: async (adAccountId, socialAccountId) => {
    const response = await api.get(`/social-media/ads/accounts/${adAccountId}/campaigns`, { 
      params: { socialAccountId } 
    });
    return response.data;
  },
  getCampaignInsights: async (campaignId, socialAccountId) => {
    const response = await api.get(`/social-media/ads/campaigns/${campaignId}/insights`, { 
      params: { socialAccountId } 
    });
    return response.data;
  },
  
  // Engagement
  getComments: async (postId) => {
    const response = await api.get(`/social-media/posts/${postId}/comments`);
    return response.data;
  },
  replyToComment: async (commentId, message) => {
    const response = await api.post(`/social-media/comments/${commentId}/reply`, { message });
    return response.data;
  },
  
  // Analytics
  getAnalytics: async (params) => {
    const response = await api.get('/social-media/analytics', { params });
    return response.data;
  }
};

const PLATFORMS = {
  facebook: { name: 'Facebook', icon: Facebook, color: 'bg-blue-600', textColor: 'text-blue-600' },
  twitter: { name: 'Twitter/X', icon: Twitter, color: 'bg-black', textColor: 'text-black' },
  instagram: { name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400', textColor: 'text-pink-600' },
  linkedin: { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700', textColor: 'text-blue-700' },
  youtube: { name: 'YouTube', icon: Youtube, color: 'bg-red-600', textColor: 'text-red-600' }
};

export const Marketing = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  
  // Check for OAuth callback result
  const connectedPlatform = searchParams.get('connected');
  const oauthError = searchParams.get('error');
  
  const [activeTab, setActiveTab] = useState('posts');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedLeadForm, setSelectedLeadForm] = useState(null);
  const [selectedAdAccount, setSelectedAdAccount] = useState(null);
  const [notification, setNotification] = useState(null);
  
  const [postData, setPostData] = useState({
    content: '',
    platforms: [],
    media_url: '',
    media_type: 'none',
    scheduled_at: '',
  });

  // Show notification on OAuth result
  useEffect(() => {
    if (connectedPlatform) {
      setNotification({ type: 'success', message: `${PLATFORMS[connectedPlatform]?.name || connectedPlatform} connected successfully!` });
      queryClient.invalidateQueries(['social-accounts']);
    }
    if (oauthError) {
      setNotification({ type: 'error', message: `Connection failed: ${oauthError}` });
    }
  }, [connectedPlatform, oauthError, queryClient]);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Queries
  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: socialMediaService.getAccounts,
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['social-posts'],
    queryFn: () => socialMediaService.getPosts({ limit: 50 }),
    enabled: activeTab === 'posts' || activeTab === 'schedule',
  });

  const { data: inboxData, isLoading: inboxLoading } = useQuery({
    queryKey: ['social-inbox'],
    queryFn: () => socialMediaService.getInbox({ limit: 25 }),
    enabled: activeTab === 'inbox',
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['conversation-messages', selectedConversation?.id],
    queryFn: () => socialMediaService.getMessages(selectedConversation.id, {
      platform: selectedConversation.platform,
      accountId: selectedConversation.accountId
    }),
    enabled: !!selectedConversation,
  });

  const { data: leadFormsData } = useQuery({
    queryKey: ['lead-forms'],
    queryFn: socialMediaService.getLeadForms,
    enabled: activeTab === 'leads',
  });

  const { data: leadsData } = useQuery({
    queryKey: ['form-leads', selectedLeadForm?.id],
    queryFn: () => socialMediaService.getFormLeads(selectedLeadForm.id, selectedLeadForm.accountId),
    enabled: !!selectedLeadForm,
  });

  const { data: adAccountsData } = useQuery({
    queryKey: ['ad-accounts'],
    queryFn: socialMediaService.getAdAccounts,
    enabled: activeTab === 'ads',
  });

  const { data: campaignsData } = useQuery({
    queryKey: ['ad-campaigns', selectedAdAccount?.id],
    queryFn: () => socialMediaService.getCampaigns(selectedAdAccount.id, selectedAdAccount.socialAccountId),
    enabled: !!selectedAdAccount,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['social-analytics'],
    queryFn: () => socialMediaService.getAnalytics({ period: '30days' }),
    enabled: activeTab === 'analytics',
  });

  const { data: commentsData } = useQuery({
    queryKey: ['post-comments', selectedPost?.id],
    queryFn: () => socialMediaService.getComments(selectedPost.id),
    enabled: !!selectedPost && showComments,
  });

  // Mutations
  const connectMutation = useMutation({
    mutationFn: async (platform) => {
      const response = await socialMediaService.getAuthUrl(platform);
      window.location.href = response.authUrl;
    },
  });

  const postMutation = useMutation({
    mutationFn: postData.scheduled_at 
      ? socialMediaService.schedulePost 
      : socialMediaService.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries(['social-posts']);
      setIsComposeOpen(false);
      setPostData({ content: '', platforms: [], media_url: '', media_type: 'none', scheduled_at: '' });
      setNotification({ type: 'success', message: 'Post published successfully!' });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, data }) => socialMediaService.sendMessage(conversationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['conversation-messages', selectedConversation?.id]);
      setNewMessage('');
    },
  });

  const importLeadMutation = useMutation({
    mutationFn: ({ leadId, accountId }) => socialMediaService.importLead(leadId, accountId),
    onSuccess: (data) => {
      if (data.imported) {
        setNotification({ type: 'success', message: 'Lead imported as contact!' });
      } else {
        setNotification({ type: 'info', message: 'Contact already exists' });
      }
      queryClient.invalidateQueries(['form-leads']);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: socialMediaService.disconnectAccount,
    onSuccess: () => {
      queryClient.invalidateQueries(['social-accounts']);
      setNotification({ type: 'success', message: 'Account disconnected' });
    },
  });

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!postData.content || postData.platforms.length === 0) {
      setNotification({ type: 'error', message: 'Please add content and select at least one platform' });
      return;
    }
    postMutation.mutate(postData);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      data: {
        platform: selectedConversation.platform,
        accountId: selectedConversation.accountId,
        recipientId: selectedConversation.participants?.[0]?.id,
        message: newMessage,
      }
    });
  };

  const accounts = accountsData?.accounts || [];
  const posts = postsData?.posts || [];
  const conversations = inboxData?.conversations || [];
  const messages = messagesData?.messages || [];
  const leadForms = leadFormsData?.forms || [];
  const leads = leadsData?.leads || [];
  const adAccounts = adAccountsData?.adAccounts || [];
  const campaigns = campaignsData?.campaigns || [];
  const analytics = analyticsData?.analytics || {};

  const connectedPlatforms = accounts.reduce((acc, a) => {
    acc[a.platform] = true;
    return acc;
  }, {});

  if (accountsLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {notification.type === 'success' && <Check className="w-5 h-5" />}
          {notification.type === 'error' && <X className="w-5 h-5" />}
          {notification.type === 'info' && <AlertCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Media Marketing</h1>
          <p className="text-gray-600 mt-1">Manage your social media presence and lead generation</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsConnectOpen(true)} variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            Connect Account
          </Button>
          <Button onClick={() => setIsComposeOpen(true)}>
            <Send className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Connected Accounts</h2>
        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No social media accounts connected yet</p>
            <Button onClick={() => setIsConnectOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Connect Your First Account
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {accounts.map((account) => {
              const platform = PLATFORMS[account.platform];
              const Icon = platform?.icon || Users;
              return (
                <div key={account.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`${platform?.color || 'bg-gray-500'} p-2 rounded-lg text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{account.account_name || platform?.name}</h3>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${account.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs text-gray-500">
                          {account.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-3">
                    <span>{account.followers_count || 0} followers</span>
                    <span>{account.posts_count || 0} posts</span>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Disconnect this account?')) {
                        disconnectMutation.mutate(account.id);
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Disconnect
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b overflow-x-auto">
          <div className="flex gap-1 px-4 min-w-max">
            {[
              { id: 'posts', label: 'Posts', icon: MessageSquare },
              { id: 'inbox', label: 'Inbox', icon: Inbox },
              { id: 'leads', label: 'Leads', icon: UserPlus },
              { id: 'ads', label: 'Ads', icon: Target },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'schedule', label: 'Scheduled', icon: Calendar },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 border-b-2 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {postsLoading ? (
                <Loading />
              ) : posts.filter(p => p.status === 'published').length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No posts yet</p>
                  <Button onClick={() => setIsComposeOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Post
                  </Button>
                </div>
              ) : (
                posts.filter(p => p.status === 'published').map((post) => {
                  const platform = PLATFORMS[post.platform];
                  const Icon = platform?.icon || MessageSquare;
                  return (
                    <div key={post.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className={`${platform?.color || 'bg-gray-500'} p-2 rounded-lg text-white flex-shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-medium">{platform?.name || post.platform}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                {new Date(post.published_at || post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {post.external_url && (
                              <a
                                href={post.external_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap mb-3">{post.content}</p>
                          {post.media_url && (
                            <div className="mb-3 rounded-lg overflow-hidden max-w-sm">
                              <img src={post.media_url} alt="Post media" className="w-full object-cover" />
                            </div>
                          )}
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{post.views_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              <span>{post.likes_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>{post.comments_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Share2 className="w-4 h-4" />
                              <span>{post.shares_count || 0}</span>
                            </div>
                            {post.comments_count > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedPost(post);
                                  setShowComments(true);
                                }}
                                className="text-primary-600 hover:text-primary-700 ml-auto"
                              >
                                View Comments
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Inbox Tab */}
          {activeTab === 'inbox' && (
            <div className="flex gap-4 h-[600px]">
              {/* Conversations List */}
              <div className="w-1/3 border-r overflow-y-auto">
                <h3 className="font-semibold p-3 border-b sticky top-0 bg-white">Conversations</h3>
                {inboxLoading ? (
                  <Loading />
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Inbox className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const platform = PLATFORMS[conv.platform];
                    const Icon = platform?.icon || MessageSquare;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                          selectedConversation?.id === conv.id ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`${platform?.color || 'bg-gray-500'} p-1.5 rounded-full text-white`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <span className="font-medium truncate">
                                {conv.participants?.[0]?.name || 'Unknown'}
                              </span>
                              {conv.unread_count > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                  {conv.unread_count}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">{conv.snippet}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    <div className="p-3 border-b bg-gray-50">
                      <h3 className="font-semibold">
                        {selectedConversation.participants?.[0]?.name || 'Conversation'}
                      </h3>
                      <span className="text-sm text-gray-500">{selectedConversation.accountName}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messagesLoading ? (
                        <Loading />
                      ) : (
                        messages.map((msg, idx) => (
                          <div
                            key={msg.id || idx}
                            className={`flex ${msg.from?.id === selectedConversation.participants?.[0]?.id ? 'justify-start' : 'justify-end'}`}
                          >
                            <div className={`max-w-[70%] rounded-lg p-3 ${
                              msg.from?.id === selectedConversation.participants?.[0]?.id
                                ? 'bg-gray-100'
                                : 'bg-primary-600 text-white'
                            }`}>
                              <p>{msg.message || msg.text}</p>
                              <span className="text-xs opacity-75 mt-1 block">
                                {new Date(msg.created_time).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                      />
                      <Button type="submit" disabled={sendMessageMutation.isPending}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Select a conversation to view messages</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Leads Tab */}
          {activeTab === 'leads' && (
            <div className="flex gap-4 h-[600px]">
              {/* Lead Forms */}
              <div className="w-1/3 border-r overflow-y-auto">
                <h3 className="font-semibold p-3 border-b sticky top-0 bg-white">Lead Forms</h3>
                {leadForms.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <UserPlus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No lead forms found</p>
                    <p className="text-xs mt-1">Connect a Facebook page with Lead Ads</p>
                  </div>
                ) : (
                  leadForms.map((form) => (
                    <div
                      key={form.id}
                      onClick={() => setSelectedLeadForm(form)}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedLeadForm?.id === form.id ? 'bg-primary-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{form.name}</h4>
                          <p className="text-sm text-gray-500">{form.pageName}</p>
                        </div>
                        <span className="text-sm text-gray-600">{form.leads_count} leads</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Leads List */}
              <div className="flex-1 overflow-y-auto">
                {selectedLeadForm ? (
                  <>
                    <div className="p-3 border-b bg-gray-50 sticky top-0">
                      <h3 className="font-semibold">{selectedLeadForm.name}</h3>
                    </div>
                    {leads.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <p>No leads in this form yet</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {leads.map((lead) => (
                          <div key={lead.id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">
                                  {lead.first_name} {lead.last_name}
                                </h4>
                                <p className="text-sm text-gray-600">{lead.email}</p>
                                {lead.phone && (
                                  <p className="text-sm text-gray-500">{lead.phone}</p>
                                )}
                                {lead.company && (
                                  <p className="text-sm text-gray-500">{lead.company}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(lead.created_time).toLocaleString()}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => importLeadMutation.mutate({
                                  leadId: lead.id,
                                  accountId: selectedLeadForm.accountId
                                })}
                                disabled={importLeadMutation.isPending}
                              >
                                {importLeadMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <UserPlus className="w-4 h-4 mr-1" />
                                    Import
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500 h-full">
                    <div className="text-center">
                      <UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Select a form to view leads</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ads Tab */}
          {activeTab === 'ads' && (
            <div className="flex gap-4 h-[600px]">
              {/* Ad Accounts */}
              <div className="w-1/3 border-r overflow-y-auto">
                <h3 className="font-semibold p-3 border-b sticky top-0 bg-white">Ad Accounts</h3>
                {adAccounts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Target className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No ad accounts found</p>
                    <p className="text-xs mt-1">Connect a Facebook account with Ads access</p>
                  </div>
                ) : (
                  adAccounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => setSelectedAdAccount(account)}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedAdAccount?.id === account.id ? 'bg-primary-50' : ''
                      }`}
                    >
                      <h4 className="font-medium">{account.name}</h4>
                      <p className="text-sm text-gray-500">{account.socialAccountName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{account.currency} {account.amount_spent}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Campaigns */}
              <div className="flex-1 overflow-y-auto">
                {selectedAdAccount ? (
                  <>
                    <div className="p-3 border-b bg-gray-50 sticky top-0">
                      <h3 className="font-semibold">{selectedAdAccount.name} - Campaigns</h3>
                    </div>
                    {campaigns.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <p>No campaigns found</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {campaigns.map((campaign) => (
                          <div key={campaign.id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{campaign.name}</h4>
                              <span className={`px-2 py-1 text-xs rounded ${
                                campaign.status === 'ACTIVE' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {campaign.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                              Objective: {campaign.objective}
                            </p>
                            <div className="flex gap-4 text-sm text-gray-600">
                              <span>Budget: ${campaign.daily_budget || campaign.lifetime_budget || 0}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500 h-full">
                    <div className="text-center">
                      <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Select an ad account to view campaigns</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm opacity-90">Total Reach</h3>
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-bold">{analytics.total_reach?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm opacity-90">Total Engagement</h3>
                    <Heart className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-bold">{analytics.total_engagement?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm opacity-90">Total Posts</h3>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-bold">{analytics.total_posts || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm opacity-90">Avg. Engagement Rate</h3>
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-bold">{analytics.avg_engagement_rate || 0}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              {posts.filter(p => p.status === 'scheduled').length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No scheduled posts</p>
                  <Button onClick={() => setIsComposeOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule a Post
                  </Button>
                </div>
              ) : (
                posts.filter(p => p.status === 'scheduled').map((post) => {
                  const platform = PLATFORMS[post.platform];
                  const Icon = platform?.icon || Calendar;
                  return (
                    <div key={post.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className={`${platform?.color || 'bg-gray-500'} p-2 rounded-lg text-white`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-orange-600 font-medium">
                              Scheduled for {new Date(post.scheduled_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{post.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Connect Account Modal */}
      <Modal isOpen={isConnectOpen} onClose={() => setIsConnectOpen(false)} title="Connect Social Media Account">
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            Select a platform to connect. You'll be redirected to authorize access.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(PLATFORMS).map(([key, platform]) => {
              const Icon = platform.icon;
              const isConnected = connectedPlatforms[key];
              return (
                <button
                  key={key}
                  onClick={() => !isConnected && connectMutation.mutate(key)}
                  disabled={isConnected || connectMutation.isPending}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    isConnected 
                      ? 'border-green-300 bg-green-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`${platform.color} p-2 rounded-lg text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium">{platform.name}</span>
                    {isConnected && (
                      <span className="block text-xs text-green-600">Connected</span>
                    )}
                  </div>
                  {connectMutation.isPending && connectMutation.variables === key && (
                    <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Compose Post Modal */}
      <Modal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} title="Create Post">
        <form onSubmit={handlePostSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Platforms
            </label>
            <div className="flex flex-wrap gap-2">
              {accounts.map((account) => {
                const platform = PLATFORMS[account.platform];
                const Icon = platform?.icon || MessageSquare;
                const isSelected = postData.platforms.includes(account.platform);
                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => {
                      setPostData(prev => ({
                        ...prev,
                        platforms: isSelected
                          ? prev.platforms.filter(p => p !== account.platform)
                          : [...prev.platforms, account.platform]
                      }));
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`${platform?.color || 'bg-gray-500'} p-1 rounded text-white`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm">{account.account_name || platform?.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={postData.content}
              onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="What would you like to share?"
            />
            <p className="text-xs text-gray-500 mt-1">{postData.content.length} characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Media URL (optional)
            </label>
            <Input
              value={postData.media_url}
              onChange={(e) => setPostData(prev => ({ ...prev, media_url: e.target.value, media_type: e.target.value ? 'image' : 'none' }))}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schedule (optional)
            </label>
            <Input
              type="datetime-local"
              value={postData.scheduled_at}
              onChange={(e) => setPostData(prev => ({ ...prev, scheduled_at: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsComposeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={postMutation.isPending}>
              {postMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : postData.scheduled_at ? (
                <Calendar className="w-4 h-4 mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {postData.scheduled_at ? 'Schedule' : 'Publish'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Comments Modal */}
      <Modal isOpen={showComments} onClose={() => { setShowComments(false); setSelectedPost(null); }} title="Comments">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {commentsData?.comments?.length === 0 ? (
            <p className="text-center text-gray-500">No comments yet</p>
          ) : (
            commentsData?.comments?.map((comment) => (
              <div key={comment.id} className="border-b pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    {comment.author_name?.[0] || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{comment.author_name || 'Unknown'}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-1">{comment.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Marketing;


import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Facebook, Plus, RefreshCw, Trash2, Users, 
  ExternalLink, Check, AlertCircle, Loader2, Settings
} from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import facebookService from '../../services/facebook';
import api from '../../services/api';

const FacebookPages = ({ pages, facebookAccounts, onRefresh }) => {
  const queryClient = useQueryClient();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [availablePages, setAvailablePages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);

  // Connect page mutation
  const connectPageMutation = useMutation({
    mutationFn: facebookService.connectPage,
    onSuccess: () => {
      queryClient.invalidateQueries(['facebook-pages']);
      setShowConnectModal(false);
      setAvailablePages([]);
    }
  });

  // Sync page mutation
  const syncPageMutation = useMutation({
    mutationFn: facebookService.syncPage,
    onSuccess: () => {
      queryClient.invalidateQueries(['facebook-pages']);
    }
  });

  // Disconnect page mutation
  const disconnectPageMutation = useMutation({
    mutationFn: facebookService.disconnectPage,
    onSuccess: () => {
      queryClient.invalidateQueries(['facebook-pages']);
    }
  });

  // Load available pages when account is selected
  const handleAccountSelect = async (accountId) => {
    setSelectedAccount(accountId);
    setLoadingPages(true);
    
    try {
      const response = await api.get(`/social-media/accounts/${accountId}/pages`);
      setAvailablePages(response.data.pages || []);
    } catch (error) {
      console.error('Failed to load pages:', error);
      alert('Failed to load pages');
    } finally {
      setLoadingPages(false);
    }
  };

  // Connect a page
  const handleConnectPage = (pageId) => {
    if (!selectedAccount) return;
    
    connectPageMutation.mutate({
      socialAccountId: selectedAccount,
      pageId
    });
  };

  // Check if page is already connected
  const isPageConnected = (pageId) => {
    return pages.some(p => p.facebook_page_id === pageId);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Connected Pages</h2>
        <div className="flex gap-2">
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {facebookAccounts.length > 0 && (
            <Button
              onClick={() => setShowConnectModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Page
            </Button>
          )}
        </div>
      </div>

      {/* Pages Grid */}
      {pages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Facebook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pages connected</h3>
          <p className="text-gray-600 mb-4">
            Connect your Facebook Pages to manage them from your CRM
          </p>
          {facebookAccounts.length > 0 && (
            <Button
              onClick={() => setShowConnectModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect First Page
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => (
            <div
              key={page.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Page Header */}
              <div className="flex items-start gap-3 mb-3">
                {page.picture_url ? (
                  <img
                    src={page.picture_url}
                    alt={page.page_name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Facebook className="h-6 w-6 text-blue-600" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {page.page_name}
                  </h3>
                  <p className="text-sm text-gray-500">{page.category || 'Facebook Page'}</p>
                </div>
              </div>

              {/* Page Stats */}
              <div className="mb-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{page.fan_count?.toLocaleString() || 0} followers</span>
                </div>
                {page.about && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {page.about}
                  </p>
                )}
              </div>

              {/* Webhooks Status */}
              <div className="mb-3">
                {page.is_webhooks_subscribed ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    <span>Webhooks active</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Webhooks not active</span>
                  </div>
                )}
                {page.instagram_business_account_id && (
                  <div className="flex items-center gap-2 text-sm text-purple-600 mt-1">
                    <Check className="h-4 w-4" />
                    <span>Instagram connected</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => syncPageMutation.mutate(page.id)}
                  variant="outline"
                  size="sm"
                  disabled={syncPageMutation.isPending}
                  className="flex-1"
                >
                  {syncPageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                
                <a
                  href={`https://facebook.com/${page.facebook_page_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
                
                <Button
                  onClick={() => {
                    if (confirm('Are you sure you want to disconnect this page?')) {
                      disconnectPageMutation.mutate(page.id);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  disabled={disconnectPageMutation.isPending}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect Page Modal */}
      <Modal
        isOpen={showConnectModal}
        onClose={() => {
          setShowConnectModal(false);
          setAvailablePages([]);
          setSelectedAccount(null);
        }}
        title="Connect Facebook Page"
      >
        <div className="space-y-4">
          {/* Select Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Facebook Account
            </label>
            <select
              value={selectedAccount || ''}
              onChange={(e) => handleAccountSelect(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Choose an account...</option>
              {facebookAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_name}
                </option>
              ))}
            </select>
          </div>

          {/* Available Pages */}
          {loadingPages ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-gray-600 mt-2">Loading pages...</p>
            </div>
          ) : availablePages.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Page to Connect
              </label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availablePages.map((page) => {
                  const connected = isPageConnected(page.id);
                  
                  return (
                    <div
                      key={page.id}
                      className={`
                        flex items-center justify-between p-3 border rounded-lg
                        ${connected ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 hover:border-blue-500'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {page.picture?.data?.url ? (
                          <img
                            src={page.picture.data.url}
                            alt={page.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Facebook className="h-5 w-5 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{page.name}</div>
                          <div className="text-sm text-gray-500">{page.category}</div>
                        </div>
                      </div>
                      
                      {connected ? (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Check className="h-4 w-4" />
                          Connected
                        </span>
                      ) : (
                        <Button
                          onClick={() => handleConnectPage(page.id)}
                          disabled={connectPageMutation.isPending}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {connectPageMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Connect'
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : selectedAccount && (
            <div className="text-center py-8 text-gray-500">
              No pages available for this account
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default FacebookPages;

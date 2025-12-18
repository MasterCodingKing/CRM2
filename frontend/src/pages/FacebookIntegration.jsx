import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tantml:parameter>@tanstack/react-query';
import { 
  Facebook, MessageSquare, UserPlus, TrendingUp, 
  RefreshCw, Settings, Inbox, Users, BarChart3,
  Plus, Check, X, AlertCircle, Loader2, ExternalLink
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Loading } from '../components/common/Loading';
import facebookService from '../services/facebook';
import api from '../services/api';

// Sub-components
import FacebookPages from '../components/facebook/FacebookPages';
import FacebookMessenger from '../components/facebook/FacebookMessenger';
import FacebookLeads from '../components/facebook/FacebookLeads';
import FacebookAds from '../components/facebook/FacebookAds';

const FacebookIntegration = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pages');
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Fetch connected pages
  const { data: pagesData, isLoading: pagesLoading } = useQuery({
    queryKey: ['facebook-pages'],
    queryFn: facebookService.getPages
  });

  // Fetch social media accounts (for connecting pages)
  const { data: accountsData } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const response = await api.get('/social-media/accounts');
      return response.data;
    }
  });

  const facebookAccounts = accountsData?.accounts?.filter(a => a.platform === 'facebook') || [];
  const pages = pagesData?.pages || [];

  // Tab configuration
  const tabs = [
    { id: 'pages', label: 'Pages', icon: Facebook, badge: pages.length },
    { id: 'messenger', label: 'Messenger', icon: MessageSquare, badge: null },
    { id: 'leads', label: 'Leads', icon: UserPlus, badge: null },
    { id: 'ads', label: 'Ads & Insights', icon: BarChart3, badge: null },
  ];

  // Start OAuth flow
  const handleConnectFacebook = async () => {
    try {
      const response = await api.get('/social-media/auth/facebook');
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      console.error('Failed to start OAuth:', error);
      alert('Failed to connect to Facebook');
    }
  };

  if (pagesLoading) {
    return <Loading />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Facebook className="h-8 w-8 text-blue-600" />
              Facebook Integration
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your Facebook Pages, Messenger, Lead Ads, and Campaigns
            </p>
          </div>
          
          {facebookAccounts.length === 0 && (
            <Button
              onClick={handleConnectFacebook}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Facebook className="h-4 w-4 mr-2" />
              Connect Facebook
            </Button>
          )}
        </div>

        {/* Connection Status */}
        {facebookAccounts.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">
                Connected as {facebookAccounts[0].account_name}
              </span>
            </div>
            <Button
              onClick={handleConnectFacebook}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
                {tab.badge !== null && (
                  <span className={`
                    ml-2 px-2 py-0.5 rounded-full text-xs font-semibold
                    ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'pages' && (
          <FacebookPages 
            pages={pages} 
            facebookAccounts={facebookAccounts}
            onRefresh={() => queryClient.invalidateQueries(['facebook-pages'])}
          />
        )}
        
        {activeTab === 'messenger' && (
          <FacebookMessenger pages={pages} />
        )}
        
        {activeTab === 'leads' && (
          <FacebookLeads pages={pages} />
        )}
        
        {activeTab === 'ads' && (
          <FacebookAds facebookAccounts={facebookAccounts} />
        )}
      </div>
    </div>
  );
};

export default FacebookIntegration;

import { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Eye, MousePointerClick } from 'lucide-react';
import { Loading } from '../common/Loading';

const FacebookAds = ({ facebookAccounts }) => {
  if (facebookAccounts.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Connect a Facebook account to view Ads insights</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Impressions</div>
            <Eye className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Clicks</div>
            <MousePointerClick className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Spend</div>
            <DollarSign className="h-5 w-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">$0</div>
          <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">CTR</div>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">0%</div>
          <div className="text-xs text-gray-500 mt-1">Click-through rate</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Campaigns</h3>
        <div className="text-center py-12 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No campaigns data available</p>
          <p className="text-sm mt-2">Connect your Facebook Ads account to view campaign performance</p>
        </div>
      </div>
    </div>
  );
};

export default FacebookAds;

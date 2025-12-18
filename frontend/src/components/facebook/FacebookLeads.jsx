import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Download, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Loading } from '../common/Loading';
import facebookService from '../../services/facebook';

const FacebookLeads = ({ pages }) => {
  const queryClient = useQueryClient();
  const [selectedPage, setSelectedPage] = useState(pages[0]?.id || null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [convertData, setConvertData] = useState({ createDeal: false, dealValue: '', dealTitle: '' });

  // Fetch leads
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['facebook-leads', selectedPage],
    queryFn: () => facebookService.getLeads({ pageId: selectedPage }),
    enabled: !!selectedPage
  });

  // Convert lead mutation
  const convertMutation = useMutation({
    mutationFn: ({ id, data }) => facebookService.convertLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['facebook-leads']);
      setShowConvertModal(false);
      setSelectedLead(null);
    }
  });

  const getStatusBadge = (status) => {
    const badges = {
      new: { color: 'blue', label: 'New' },
      contacted: { color: 'yellow', label: 'Contacted' },
      qualified: { color: 'purple', label: 'Qualified' },
      converted: { color: 'green', label: 'Converted' },
      disqualified: { color: 'red', label: 'Disqualified' }
    };
    
    const badge = badges[status] || badges.new;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${badge.color}-100 text-${badge.color}-800`}>
        {badge.label}
      </span>
    );
  };

  if (pages.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Connect a Facebook Page to access Lead Ads</p>
      </div>
    );
  }

  if (isLoading) return <Loading />;

  const leads = leadsData?.leads || [];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Facebook Leads</h2>
          <select
            value={selectedPage || ''}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            {pages.map(page => (
              <option key={page.id} value={page.id}>{page.page_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {lead.first_name} {lead.last_name}
                  </div>
                  {lead.company && (
                    <div className="text-sm text-gray-500">{lead.company}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{lead.campaign_name || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{lead.ad_name || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(lead.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(lead.fb_created_time).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {lead.status !== 'converted' ? (
                    <Button
                      onClick={() => {
                        setSelectedLead(lead);
                        setShowConvertModal(true);
                      }}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Convert
                    </Button>
                  ) : (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Converted
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Convert Modal */}
      <Modal
        isOpen={showConvertModal}
        onClose={() => {
          setShowConvertModal(false);
          setSelectedLead(null);
        }}
        title="Convert Lead to Contact"
      >
        {selectedLead && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="font-medium">{selectedLead.first_name} {selectedLead.last_name}</div>
              <div className="text-sm text-gray-600">{selectedLead.email}</div>
              <div className="text-sm text-gray-600">{selectedLead.phone}</div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={convertData.createDeal}
                  onChange={(e) => setConvertData({ ...convertData, createDeal: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Create Deal</span>
              </label>
            </div>

            {convertData.createDeal && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deal Title</label>
                  <input
                    type="text"
                    value={convertData.dealTitle}
                    onChange={(e) => setConvertData({ ...convertData, dealTitle: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Enter deal title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value</label>
                  <input
                    type="number"
                    value={convertData.dealValue}
                    onChange={(e) => setConvertData({ ...convertData, dealValue: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => convertMutation.mutate({ id: selectedLead.id, data: convertData })}
                disabled={convertMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {convertMutation.isPending ? 'Converting...' : 'Convert to Contact'}
              </Button>
              <Button
                onClick={() => {
                  setShowConvertModal(false);
                  setSelectedLead(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FacebookLeads;

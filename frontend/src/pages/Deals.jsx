import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsService, pipelinesService } from '../services';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Plus, DollarSign } from 'lucide-react';

export const Deals = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    value: '',
    stage: '',
    probability: 0
  });

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => dealsService.getAll({ status: 'open' })
  });

  const { data: pipelinesData } = useQuery({
    queryKey: ['pipelines'],
    queryFn: pipelinesService.getAll
  });

  const createMutation = useMutation({
    mutationFn: dealsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
      setIsModalOpen(false);
      setFormData({ title: '', value: '', stage: '', probability: 0 });
    }
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage, probability }) => dealsService.updateStage(id, stage, probability),
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
    }
  });

  const defaultPipeline = pipelinesData?.pipelines?.find(p => p.is_default);
  const stages = defaultPipeline?.stages || [];

  const dealsByStage = stages.map(stage => ({
    ...stage,
    deals: dealsData?.deals?.filter(deal => deal.stage === stage.name) || []
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals Pipeline</h1>
          <p className="text-gray-600 mt-1">Track and manage your sales opportunities</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          Add Deal
        </Button>
      </div>

      {/* Kanban Board */}
      {dealsLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {dealsByStage.map((stage) => (
            <div key={stage.id} className="flex-shrink-0 w-80">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {stage.deals.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stage.probability}% probability</p>
                </div>

                <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                  {stage.deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <h4 className="font-medium text-gray-900 mb-2">{deal.title}</h4>
                      
                      <div className="flex items-center text-green-600 font-semibold mb-2">
                        <DollarSign size={16} />
                        {deal.value ? Number(deal.value).toLocaleString() : '0'}
                      </div>

                      {deal.Contact && (
                        <p className="text-sm text-gray-600">
                          {deal.Contact.first_name} {deal.Contact.last_name}
                        </p>
                      )}

                      {deal.expected_close_date && (
                        <p className="text-xs text-gray-500 mt-2">
                          Close: {new Date(deal.expected_close_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}

                  {stage.deals.length === 0 && (
                    <p className="text-center text-gray-400 py-8">No deals in this stage</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Deal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Deal">
        <form onSubmit={handleSubmit}>
          <Input
            label="Deal Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Input
            label="Deal Value"
            type="number"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
            <select
              className="input"
              value={formData.stage}
              onChange={(e) => {
                const selectedStage = stages.find(s => s.name === e.target.value);
                setFormData({
                  ...formData,
                  stage: e.target.value,
                  probability: selectedStage?.probability || 0
                });
              }}
              required
            >
              <option value="">Select stage</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.name}>
                  {stage.name} ({stage.probability}%)
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Expected Close Date"
            type="date"
            value={formData.expected_close_date || ''}
            onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
          />

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Deal'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

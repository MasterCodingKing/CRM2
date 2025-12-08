import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsService, pipelinesService } from '../services';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Plus, DollarSign, Eye, Settings, Menu, X } from 'lucide-react';

export const Deals = () => {
  const queryClient = useQueryClient();
  const pipelineMenuRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [isPipelineMenuOpen, setIsPipelineMenuOpen] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    value: '',
    stage: '',
    probability: 0,
    pipeline_id: null
  });
  const [pipelineFormData, setPipelineFormData] = useState({
    name: '',
    stages: [
      { name: 'Lead', probability: 10, order: 0 },
      { name: 'Qualified', probability: 30, order: 1 },
      { name: 'Proposal', probability: 60, order: 2 },
      { name: 'Negotiation', probability: 80, order: 3 },
      { name: 'Closed Won', probability: 100, order: 4 }
    ]
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

  const createPipelineMutation = useMutation({
    mutationFn: pipelinesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['pipelines']);
      setIsPipelineModalOpen(false);
      setPipelineFormData({
        name: '',
        stages: [
          { name: 'Lead', probability: 10, order: 0 },
          { name: 'Qualified', probability: 30, order: 1 },
          { name: 'Proposal', probability: 60, order: 2 },
          { name: 'Negotiation', probability: 80, order: 3 },
          { name: 'Closed Won', probability: 100, order: 4 }
        ]
      });
    }
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage, probability }) => dealsService.updateStage(id, stage, probability),
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
    }
  });

  const handleViewDeal = (deal) => {
    setSelectedDeal(deal);
    setIsViewModalOpen(true);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pipelineMenuRef.current && !pipelineMenuRef.current.contains(event.target)) {
        setIsPipelineMenuOpen(false);
      }
    };

    if (isPipelineMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPipelineMenuOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handlePipelineSubmit = (e) => {
    e.preventDefault();
    createPipelineMutation.mutate(pipelineFormData);
  };

  const addStage = () => {
    setPipelineFormData({
      ...pipelineFormData,
      stages: [
        ...pipelineFormData.stages,
        { name: '', probability: 0, order: pipelineFormData.stages.length }
      ]
    });
  };

  const updateStage = (index, field, value) => {
    const newStages = [...pipelineFormData.stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setPipelineFormData({ ...pipelineFormData, stages: newStages });
  };

  const removeStage = (index) => {
    const newStages = pipelineFormData.stages.filter((_, i) => i !== index);
    setPipelineFormData({ ...pipelineFormData, stages: newStages });
  };

  const handleSelectPipeline = (pipeline) => {
    setSelectedPipelineId(pipeline.id);
    setIsPipelineMenuOpen(false);
  };

  const handleAddDealToPipeline = (pipeline) => {
    setFormData({
      title: '',
      value: '',
      stage: pipeline.stages[0]?.name || '',
      probability: pipeline.stages[0]?.probability || 0,
      pipeline_id: pipeline.id
    });
    setIsPipelineMenuOpen(false);
    setIsModalOpen(true);
  };

  // Use selected pipeline or default pipeline
  const activePipeline = selectedPipelineId 
    ? pipelinesData?.pipelines?.find(p => p.id === selectedPipelineId)
    : pipelinesData?.pipelines?.find(p => p.is_default);
  
  const stages = activePipeline?.stages || [];

  const dealsByStage = stages.map(stage => ({
    ...stage,
    deals: dealsData?.deals?.filter(deal => 
      deal.stage === stage.name && 
      (deal.pipeline_id === activePipeline?.id || (!deal.pipeline_id && activePipeline?.is_default))
    ) || []
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deals Pipeline</h1>
            <p className="text-gray-600 mt-1">Track and manage your sales opportunities</p>
          </div>
          
          {/* Pipeline Selector Burger Menu */}
          <div className="relative" ref={pipelineMenuRef}>
            <Button 
              variant="secondary" 
              onClick={() => setIsPipelineMenuOpen(!isPipelineMenuOpen)}
              title="Select Pipeline"
            >
              <Menu size={20} />
            </Button>
            
            {/* Dropdown Menu */}
            {isPipelineMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Pipelines</h3>
                  <button 
                    onClick={() => setIsPipelineMenuOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {pipelinesData?.pipelines?.map((pipeline) => (
                    <div 
                      key={pipeline.id}
                      className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 
                            className="font-medium text-gray-900 cursor-pointer hover:text-primary-600"
                            onClick={() => handleSelectPipeline(pipeline)}
                          >
                            {pipeline.name}
                          </h4>
                          {pipeline.is_default && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                          {activePipeline?.id === pipeline.id && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {pipeline.stages?.slice(0, 3).map((stage) => (
                          <span 
                            key={stage.id || `${pipeline.id}-${stage.name}`}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {stage.name}
                          </span>
                        ))}
                        {pipeline.stages?.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{pipeline.stages.length - 3} more
                          </span>
                        )}
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="primary"
                        onClick={() => handleAddDealToPipeline(pipeline)}
                        className="w-full"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Deal to this Pipeline
                      </Button>
                    </div>
                  ))}
                  
                  {(!pipelinesData?.pipelines || pipelinesData.pipelines.length === 0) && (
                    <div className="p-4 text-center text-gray-500">
                      No pipelines available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsPipelineModalOpen(true)}>
            <Settings size={20} className="mr-2" />
            New Pipeline
          </Button>
          <Button onClick={() => {
            setFormData({
              title: '',
              value: '',
              stage: activePipeline?.stages[0]?.name || '',
              probability: activePipeline?.stages[0]?.probability || 0,
              pipeline_id: activePipeline?.id || null
            });
            setIsModalOpen(true);
          }}>
            <Plus size={20} className="mr-2" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Active Pipeline Info */}
      {activePipeline && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Active Pipeline:</span> {activePipeline.name}
            {activePipeline.is_default && <span className="ml-2 text-xs">(Default)</span>}
          </p>
        </div>
      )}

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
                      onClick={() => handleViewDeal(deal)}
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

      {/* View Deal Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => { setIsViewModalOpen(false); setSelectedDeal(null); }} title="Deal Details">
        {selectedDeal && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Title</label>
              <p className="text-gray-900 mt-1 text-lg font-semibold">{selectedDeal.title}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Value</label>
              <div className="flex items-center text-green-600 font-semibold text-xl mt-1">
                <DollarSign size={20} />
                {selectedDeal.value ? Number(selectedDeal.value).toLocaleString() : '0'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Stage</label>
                <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {selectedDeal.stage}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Probability</label>
                <p className="text-gray-900 mt-1">{selectedDeal.probability}%</p>
              </div>
            </div>

            {selectedDeal.Contact && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Contact</label>
                <p className="text-gray-900 mt-1">
                  {selectedDeal.Contact.first_name} {selectedDeal.Contact.last_name}
                </p>
                {selectedDeal.Contact.email && (
                  <p className="text-gray-600 text-sm">{selectedDeal.Contact.email}</p>
                )}
              </div>
            )}

            {selectedDeal.expected_close_date && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Expected Close Date</label>
                <p className="text-gray-900 mt-1">
                  {new Date(selectedDeal.expected_close_date).toLocaleDateString()}
                </p>
              </div>
            )}

            {selectedDeal.description && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900 mt-1">{selectedDeal.description}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-500">Status</label>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                selectedDeal.status === 'won' ? 'bg-green-100 text-green-800' :
                selectedDeal.status === 'lost' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedDeal.status}
              </span>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button variant="secondary" onClick={() => { setIsViewModalOpen(false); setSelectedDeal(null); }}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Pipeline Modal */}
      <Modal isOpen={isPipelineModalOpen} onClose={() => setIsPipelineModalOpen(false)} title="Create New Pipeline">
        <form onSubmit={handlePipelineSubmit}>
          <Input
            label="Pipeline Name"
            value={pipelineFormData.name}
            onChange={(e) => setPipelineFormData({ ...pipelineFormData, name: e.target.value })}
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Stages</label>
            <div className="space-y-3">
              {pipelineFormData.stages.map((stage, index) => (
                <div key={`stage-${index}-${stage.name || 'new'}`} className="flex gap-2 items-start p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <input
                      type="text"
                      className="input mb-2"
                      placeholder="Stage name"
                      value={stage.name}
                      onChange={(e) => updateStage(index, 'name', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      className="input"
                      placeholder="Probability %"
                      min="0"
                      max="100"
                      value={stage.probability}
                      onChange={(e) => updateStage(index, 'probability', parseInt(e.target.value))}
                      required
                    />
                  </div>
                  {pipelineFormData.stages.length > 1 && (
                    <Button 
                      type="button" 
                      variant="danger" 
                      size="sm" 
                      onClick={() => removeStage(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button 
              type="button" 
              variant="secondary" 
              size="sm" 
              onClick={addStage}
              className="mt-2"
            >
              <Plus size={16} className="mr-1" />
              Add Stage
            </Button>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" type="button" onClick={() => setIsPipelineModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPipelineMutation.isPending}>
              {createPipelineMutation.isPending ? 'Creating...' : 'Create Pipeline'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

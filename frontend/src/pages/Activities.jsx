import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesService } from '../services';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Plus, CheckCircle, Circle } from 'lucide-react';

export const Activities = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'note',
    subject: '',
    description: '',
    scheduled_at: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesService.getAll({ limit: 50 })
  });

  const createMutation = useMutation({
    mutationFn: activitiesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
      setIsModalOpen(false);
      setFormData({ type: 'note', subject: '', description: '', scheduled_at: '' });
    }
  });

  const completeMutation = useMutation({
    mutationFn: activitiesService.complete,
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    // Only include scheduled_at for task and meeting types
    if (!['task', 'meeting'].includes(formData.type)) {
      delete submitData.scheduled_at;
    }
    createMutation.mutate(submitData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
          <p className="text-gray-600 mt-1">Track tasks, notes, and communications</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          Add Activity
        </Button>
      </div>

      {/* Activities Timeline */}
      <div className="card">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            {data?.activities?.map((activity) => (
              <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-0">
                <div className="flex-shrink-0 mt-1">
                  {activity.is_completed ? (
                    <CheckCircle className="text-green-500" size={24} />
                  ) : (
                    <Circle className="text-gray-300" size={24} />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{activity.subject}</h3>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 rounded">{activity.type}</span>
                        {activity.scheduled_at && (
                          <span>
                            Due: {new Date(activity.scheduled_at).toLocaleDateString()}
                          </span>
                        )}
                        {activity.User && (
                          <span>
                            By: {activity.User.first_name} {activity.User.last_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {activity.type === 'task' && !activity.is_completed && (
                      <Button
                        variant="secondary"
                        onClick={() => completeMutation.mutate(activity.id)}
                        disabled={completeMutation.isPending}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {data?.activities?.length === 0 && (
              <p className="text-center text-gray-400 py-8">No activities yet</p>
            )}
          </div>
        )}
      </div>

      {/* Add Activity Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Activity">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="note">Note</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="task">Task</option>
            </select>
          </div>

          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {['task', 'meeting'].includes(formData.type) && (
            <Input
              label="Scheduled Date"
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
            />
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Activity'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

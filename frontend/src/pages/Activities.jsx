import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesService } from '../services';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Plus, CheckCircle, Circle, Phone, Mail, Check } from 'lucide-react';

export const Activities = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmailComposeOpen, setIsEmailComposeOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [emailCompose, setEmailCompose] = useState({
    to: '',
    subject: '',
    message: ''
  });
  const [formData, setFormData] = useState({
    type: 'note',
    subject: '',
    description: '',
    scheduled_at: '',
    phone_number: '',
    email_address: ''
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
      setFormData({ type: 'note', subject: '', description: '', scheduled_at: '', phone_number: '', email_address: '' });
    }
  });

  const completeMutation = useMutation({
    mutationFn: activitiesService.complete,
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
    }
  });

  const handleCall = (activity) => {
    // Get phone number from activity custom fields or contact
    const phoneNumber = activity.custom_fields?.phone_number || activity.Contact?.phone;
    
    if (phoneNumber) {
      // For desktop, copy to clipboard and show instructions
      if (navigator.clipboard) {
        navigator.clipboard.writeText(phoneNumber).then(() => {
          alert(`Phone number copied: ${phoneNumber}\n\nOn mobile devices, the call will be initiated automatically.\nOn desktop, use your phone or softphone application.`);
        });
      }
      // Try to initiate call (works on mobile devices)
      window.location.href = `tel:${phoneNumber}`;
    } else {
      const manualPhone = prompt('Enter phone number to call:');
      if (manualPhone && manualPhone.trim()) {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(manualPhone.trim());
        }
        window.location.href = `tel:${manualPhone.trim()}`;
      }
    }
  };

  const handleEmail = (activity) => {
    // Open email compose modal
    setSelectedActivity(activity);
    setEmailCompose({
      to: activity.custom_fields?.email_address || activity.Contact?.email || '',
      subject: activity.subject || '',
      message: activity.description || ''
    });
    setIsEmailComposeOpen(true);
  };

  const handleSendEmail = () => {
    if (!emailCompose.to || !emailCompose.subject) {
      alert('Please fill in recipient email and subject');
      return;
    }
  };

  const isOverdue = (scheduledAt) => {
    if (!scheduledAt) return false;
    return new Date(scheduledAt) < new Date();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    
    // Only include scheduled_at for task and meeting types
    if (!['task', 'meeting'].includes(formData.type)) {
      delete submitData.scheduled_at;
    }
    
    // Store phone_number and email_address in custom_fields
    const customFields = {};
    if (submitData.phone_number) {
      customFields.phone_number = submitData.phone_number;
    }
    if (submitData.email_address) {
      customFields.email_address = submitData.email_address;
    }
    
    if (Object.keys(customFields).length > 0) {
      submitData.custom_fields = customFields;
    }
    
    // Remove phone_number and email_address from root level
    delete submitData.phone_number;
    delete submitData.email_address;
    
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
                          <span className={isOverdue(activity.scheduled_at) && !activity.is_completed ? 'text-red-600 font-medium' : ''}>
                            Due: {new Date(activity.scheduled_at).toLocaleDateString()}
                          </span>
                        )}
                        {activity.custom_fields?.phone_number && (
                          <span className="flex items-center">
                            <Phone size={12} className="mr-1" />
                            {activity.custom_fields.phone_number}
                          </span>
                        )}
                        {activity.custom_fields?.email_address && (
                          <span className="flex items-center">
                            <Mail size={12} className="mr-1" />
                            {activity.custom_fields.email_address}
                          </span>
                        )}
                        {activity.User && (
                          <span>
                            By: {activity.User.first_name} {activity.User.last_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {/* Call button for call activities */}
                      {activity.type === 'call' && !activity.is_completed && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCall(activity)}
                        >
                          <Phone size={16} className="mr-1" />
                          Call
                        </Button>
                      )}

                      {/* Email button for email activities */}
                      {activity.type === 'email' && !activity.is_completed && (
                        <Button
                          variant={activity.custom_fields?.email_sent ? "secondary" : "primary"}
                          size="sm"
                          onClick={() => handleEmail(activity)}
                        >
                          <Mail size={16} className="mr-1" />
                          {activity.custom_fields?.email_sent ? 'Resend Email' : 'Send Email'}
                        </Button>
                      )}

                      {/* Complete button for meetings with due date */}
                      {activity.type === 'meeting' && activity.scheduled_at && (
                        <Button
                          variant={activity.is_completed ? "secondary" : "primary"}
                          size="sm"
                          onClick={() => completeMutation.mutate(activity.id)}
                          disabled={activity.is_completed || completeMutation.isPending}
                        >
                          <Check size={16} className="mr-1" />
                          {activity.is_completed ? 'Completed' : 'Complete'}
                        </Button>
                      )}

                      {/* Complete button for tasks */}
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

          {/* Phone Number field for call activities */}
          {formData.type === 'call' && (
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="+1234567890"
            />
          )}

          {/* Email Address field for email activities */}
          {formData.type === 'email' && (
            <Input
              label="Email Address"
              type="email"
              value={formData.email_address}
              onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
              placeholder="example@email.com"
            />
          )}

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

      {/* Email Compose Modal */}
      <Modal 
        isOpen={isEmailComposeOpen} 
        onClose={() => {
          setIsEmailComposeOpen(false);
        
        }} 
        title="Compose Email"
         >
        <div className="space-y-4">
          <Input
            label="To"
            type="email"
            value={emailCompose.to}
            onChange={(e) => setEmailCompose({ ...emailCompose, to: e.target.value })}
            placeholder="recipient@example.com"
            required
          />

          <Input
            label="Subject"
            value={emailCompose.subject}
            onChange={(e) => setEmailCompose({ ...emailCompose, subject: e.target.value })}
            placeholder="Email subject"
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              className="input"
              rows="6"
              value={emailCompose.message}
              onChange={(e) => setEmailCompose({ ...emailCompose, message: e.target.value })}
              placeholder="Type your message here..."
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="secondary" 
              type="button" 
              onClick={() => {
                setIsEmailComposeOpen(false);
                setEmailCompose({ to: '', subject: '', message: '' });
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={!emailCompose.to || !emailCompose.subject}
            >
              Send Email
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

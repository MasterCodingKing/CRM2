import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsService } from '../services';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Plus, Search, Mail, Phone, Building, Eye, Edit, Trash2 } from 'lucide-react';

export const Contacts = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    status: 'lead'
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['contacts', page, search],
    queryFn: () => contactsService.getAll({ page, limit: 20, search })
  });

  const createMutation = useMutation({
    mutationFn: contactsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
      setIsModalOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => contactsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
      setIsModalOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: contactsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
      setIsDeleteModalOpen(false);
      setSelectedContact(null);
    }
  });

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      job_title: '',
      status: 'lead'
    });
    setModalMode('create');
    setSelectedContact(null);
  };

  const handleView = (contact) => {
    setSelectedContact(contact);
    setIsViewModalOpen(true);
  };

  const handleEdit = (contact) => {
    setSelectedContact(contact);
    setFormData({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      job_title: contact.job_title || '',
      status: contact.status || 'lead'
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = (contact) => {
    setSelectedContact(contact);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedContact) {
      deleteMutation.mutate(selectedContact.id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === 'edit' && selectedContact) {
      updateMutation.mutate({ id: selectedContact.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAddNew = () => {
    resetForm();
    setModalMode('create');
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">Manage your contacts and leads</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus size={20} className="mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search contacts..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="card">
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-medium">Error loading contacts</p>
            <p className="text-sm mt-1">
              {error.response?.status === 403 
                ? 'Your session has expired. Please log out and log back in.' 
                : error.response?.data?.error || 'Failed to load contacts. Please try again.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                   Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.contacts?.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {contact.first_name} {contact.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-gray-600">
                        <Mail size={16} className="mr-2" />
                        {contact.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-gray-600">
                        <Phone size={16} className="mr-2" />
                        {contact.phone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-gray-600">
                        <Building size={16} className="mr-2" />
                        {contact.company || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        contact.status === 'customer' ? 'bg-green-100 text-green-800' :
                        contact.status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleView(contact)}>
                          <Eye size={16} className="mr-1" />
                          View
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => handleEdit(contact)}>
                          <Edit size={16} className="mr-1" />
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(contact)}>
                          <Trash2 size={16} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} contacts
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title={modalMode === 'edit' ? 'Edit Contact' : 'Add New Contact'}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label="Company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          />

          <Input
            label="Job Title"
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="input"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="lead">Lead</option>
              <option value="qualified">Qualified</option>
              <option value="customer">Customer</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" type="button" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {modalMode === 'edit' 
                ? (updateMutation.isPending ? 'Updating...' : 'Update Contact')
                : (createMutation.isPending ? 'Creating...' : 'Create Contact')
              }
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Contact Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => { setIsViewModalOpen(false); setSelectedContact(null); }} title="Contact Details">
        {selectedContact && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">First Name</label>
                <p className="text-gray-900 mt-1">{selectedContact.first_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Name</label>
                <p className="text-gray-900 mt-1">{selectedContact.last_name}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Email</label>
              <div className="flex items-center text-gray-900 mt-1">
                <Mail size={16} className="mr-2 text-gray-400" />
                {selectedContact.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Phone</label>
              <div className="flex items-center text-gray-900 mt-1">
                <Phone size={16} className="mr-2 text-gray-400" />
                {selectedContact.phone || 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Company</label>
              <div className="flex items-center text-gray-900 mt-1">
                <Building size={16} className="mr-2 text-gray-400" />
                {selectedContact.company || 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Job Title</label>
              <p className="text-gray-900 mt-1">{selectedContact.job_title || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Status</label>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                selectedContact.status === 'customer' ? 'bg-green-100 text-green-800' :
                selectedContact.status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedContact.status}
              </span>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button variant="secondary" onClick={() => { setIsViewModalOpen(false); setSelectedContact(null); }}>
                Close
              </Button>
              <Button onClick={() => { setIsViewModalOpen(false); handleEdit(selectedContact); }}>
                Edit Contact
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setSelectedContact(null); }} title="Delete Contact">
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{selectedContact?.first_name} {selectedContact?.last_name}</strong>? 
            This action cannot be undone.
          </p>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => { setIsDeleteModalOpen(false); setSelectedContact(null); }}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Contact'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

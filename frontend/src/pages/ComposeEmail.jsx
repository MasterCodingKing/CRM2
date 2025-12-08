import { useState } from 'react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import api from '../services/api';
import { contactsService } from '../services';
import { useQuery } from '@tanstack/react-query';

export const ComposeEmail = () => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sendto, setSendto] = useState('');
  const [customername, setCustomername] = useState('');

  const {data, isLoading: contactsLoading} = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsService.getAll({ limit: 20 }),
  })

  // Debug: Log contacts data
  console.log('Contacts data:', data);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false)

   
    const token = localStorage.getItem('accessToken');
   

    // Check if token exists
    if (!token) {
      setError('You are not logged in. Please login again.');
      setLoading(false);
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }

    try {
      // Determine recipient email(s)
      let recipientEmail = '';
      
      if (sendto === '1') {
        // Send to all customers
        const allEmails = data?.contacts?.map(contact => {
          // Try different email field names
          return contact.email || contact.email_address || contact.mail;
        }).filter(Boolean).join(', ');
        recipientEmail = allEmails;
      } else if (sendto === '2' && customername) {
        // Send to individual customer
        const selectedContact = data?.contacts?.find(c => String(c.id) === String(customername));
        recipientEmail = selectedContact?.email || selectedContact?.email_address || selectedContact?.mail || '';
      }

      if (!recipientEmail) {
        setError('No valid email addresses found. Please check contact email fields.');
        setLoading(false);
        return;
      }

      
      const response = await api.post('/email/send', {
        to: recipientEmail,
        subject: formData.subject,
        message: formData.message,

         
      });

     
      
      if (response.data.success) {
        setSuccess(true);
        setFormData({
          subject: '',  
          message: '',
        });
        setSendto('');
        setCustomername('');
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Email send error:', err);
      console.error('Error response:', err.response);
      
      // Check if it's an auth error
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to send email');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      subject: '',
      message: '',
    });
    setSendto('');
    setCustomername('');
    setError('');
    setSuccess(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compose Email</h1>
        <p className="text-gray-600 mt-1">Send emails to your contacts</p>
      </div>

      <div className="card max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Email sent successfully!
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* To Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Send To <span className="text-red-500">*</span>
            </label>
             <Select value={sendto} onChange={(e) => setSendto(e.target.value)}>
                    <option value="">Choose option</option>
                    <option value="1">All Customers</option>
                    <option value="2">Individual Customer</option>
                
            </Select>
          </div>
          {sendto === '2' && (
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
              <Select value={customername} onChange={(e) => setCustomername(e.target.value)} disabled={contactsLoading}>
                    <option value="">Choose option</option>
                  {contactsLoading && <option>Loading contacts...</option>}
                  {data?.contacts?.map((contact) =>{
                    return <option key={contact.id} value={contact.id}>{contact.first_name + ' ' + contact.last_name + (contact.email ? ` (${contact.email})` : '')}</option>;
                  })}
            </Select>
          </div>
          )}
         
          {/* Subject Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Enter email subject"
              required
            />
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Type your message here..."
              rows={10}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClear}
              disabled={loading}
            >
              Clear
            </Button>
            
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading || !sendto || (sendto === '2' && !customername) || !formData.subject || !formData.message}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Email
                  </span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Email Tips */}
      <div className="card max-w-3xl bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Tips:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Separate multiple email addresses with commas</li>
         
        </ul>
      </div>
    </div>
  );
};

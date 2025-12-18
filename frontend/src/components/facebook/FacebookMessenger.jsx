import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, User, Clock, Check } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Loading } from '../common/Loading';
import facebookService from '../../services/facebook';

const FacebookMessenger = ({ pages }) => {
  const queryClient = useQueryClient();
  const [selectedPage, setSelectedPage] = useState(pages[0]?.id || null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');

  // Fetch messages
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['facebook-messages', selectedPage],
    queryFn: () => facebookService.getMessages({ pageId: selectedPage, limit: 100 }),
    enabled: !!selectedPage
  });

  // Group messages by conversation
  const conversations = {};
  (messagesData?.messages || []).forEach(msg => {
    if (!conversations[msg.conversation_id]) {
      conversations[msg.conversation_id] = [];
    }
    conversations[msg.conversation_id].push(msg);
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: facebookService.sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries(['facebook-messages']);
      setMessageText('');
    }
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    const conversation = conversations[selectedConversation];
    const recipientId = conversation[0].direction === 'incoming' 
      ? conversation[0].sender_id 
      : conversation[0].recipient_id;

    sendMutation.mutate({
      pageId: selectedPage,
      recipientId,
      message: messageText
    });
  };

  if (pages.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Connect a Facebook Page to access Messenger</p>
      </div>
    );
  }

  if (isLoading) return <Loading />;

  return (
    <div className="grid grid-cols-3 gap-4 h-[600px]">
      {/* Conversations List */}
      <div className="col-span-1 border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 p-3 border-b">
          <select
            value={selectedPage || ''}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {pages.map(page => (
              <option key={page.id} value={page.id}>{page.page_name}</option>
            ))}
          </select>
        </div>
        
        <div className="overflow-y-auto h-full">
          {Object.keys(conversations).map(convId => {
            const msgs = conversations[convId];
            const lastMsg = msgs[0];
            const isSelected = selectedConversation === convId;
            
            return (
              <div
                key={convId}
                onClick={() => setSelectedConversation(convId)}
                className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <User className="h-8 w-8 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{lastMsg.sender_name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500 truncate">{lastMsg.message_text}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(lastMsg.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {!lastMsg.is_read && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="col-span-2 border border-gray-200 rounded-lg flex flex-col">
        {selectedConversation ? (
          <>
            <div className="bg-gray-50 p-3 border-b">
              <div className="font-medium">
                {conversations[selectedConversation][0].sender_name || 'Conversation'}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conversations[selectedConversation].reverse().map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-4 py-2 ${
                      msg.direction === 'outgoing'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm">{msg.message_text}</div>
                    <div className={`text-xs mt-1 ${msg.direction === 'outgoing' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t p-3 flex gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || sendMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  );
};

export default FacebookMessenger;

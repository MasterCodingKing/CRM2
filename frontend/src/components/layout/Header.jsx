import { useAuthStore } from '../../store/authStore';
import { LogOut, User } from 'lucide-react';

export const Header = () => {
  const { user, logout } = useAuthStore();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Welcome back, {user?.first_name || 'User'}
          </h2>
          <p className="text-sm text-gray-600">{user?.organization?.name}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <User size={16} className="text-gray-600" />
            <span className="text-gray-700">{user?.email}</span>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  CheckSquare, 
  Mail,
  Settings,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const Sidebar = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'Deals', href: '/deals', icon: Briefcase },
    { name: 'Marketing', href: '/marketing', icon: Mail },
    { name: 'Activities', href: '/activities', icon: CheckSquare },
    { name: 'Emails', href: '/emails', icon: Mail },
  ];

  // Add Users link for admin and super_admin
  if (user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'manager') {
    navigation.push({ name: 'Users', href: '/users', icon: Shield });
  }

  navigation.push({ name: 'Settings', href: '/settings', icon: Settings });
//Task & Activity Management - Assign Task, Set Reminders, Meetings Sales and service
  return (
    <div className="w-64 bg-white h-screen shadow-sm border-r border-gray-200">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary-600">CRM</h1>
      </div>

      <nav className="px-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

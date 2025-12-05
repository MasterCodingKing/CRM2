import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services';
import { Users, Briefcase, DollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="card">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="text-white" size={24} />
      </div>
    </div>
  </div>
);

export const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  const stats = data?.stats || {};
  const dealsByStage = data?.dealsByStage || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your CRM performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Contacts"
          value={stats.totalContacts || 0}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Deals"
          value={stats.totalDeals || 0}
          icon={Briefcase}
          color="bg-green-500"
        />
        <StatCard
          title="Total Revenue"
          value={`$${(stats.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="bg-purple-500"
        />
        <StatCard
          title="Win Rate"
          value={`${stats.winRate || 0}%`}
          icon={TrendingUp}
          color="bg-orange-500"
        />
      </div>

      {/* Pipeline Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Deals by Stage</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dealsByStage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activities and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
          <div className="space-y-3">
            {data?.recentActivities?.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.subject || activity.type}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {activity.Contact && `${activity.Contact.first_name} ${activity.Contact.last_name}`}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(activity.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Upcoming Tasks</h2>
          <div className="space-y-3">
            {data?.upcomingTasks?.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium">{task.subject}</p>
                  <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {task.scheduled_at && new Date(task.scheduled_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

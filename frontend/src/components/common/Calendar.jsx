import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, 
  isToday, addMonths, subMonths, parseISO
} from 'date-fns';

const ACTIVITY_TYPE_COLORS = {
  task: 'bg-blue-500',
  meeting: 'bg-purple-500',
  call: 'bg-green-500',
  email: 'bg-orange-500',
  demo: 'bg-pink-500',
  proposal: 'bg-indigo-500',
  support_ticket: 'bg-red-500',
  note: 'bg-gray-500'
};

export const Calendar = ({ activities = [], onDateClick, onActivityClick, onCreateActivity }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [calendarStart, calendarEnd]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  // Group activities by date
  const activitiesByDate = useMemo(() => {
    const grouped = {};
    
    activities.forEach(activity => {
      const dateKey = activity.scheduled_at || activity.due_date || activity.created_at;
      if (!dateKey) return;

      const date = format(parseISO(dateKey), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(activity);
    });

    return grouped;
  }, [activities]);

  const getActivitiesForDay = (day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return activitiesByDate[dateKey] || [];
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={today}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 text-sm ${
                view === 'month' ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 text-sm border-l ${
                view === 'week' ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 text-sm border-l ${
                view === 'day' ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
              }`}
            >
              Day
            </button>
          </div>
          
          <button
            onClick={() => onCreateActivity && onCreateActivity()}
            className="ml-2 px-3 py-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center gap-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {view === 'month' && (
        <div className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {calendarDays.map((day, index) => {
              const dayActivities = getActivitiesForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={index}
                  onClick={() => onDateClick && onDateClick(day)}
                  className={`min-h-[100px] bg-white p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !isCurrentMonth ? 'opacity-40' : ''
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isTodayDate 
                      ? 'w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center'
                      : 'text-gray-700'
                  }`}>
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-1">
                    {dayActivities.slice(0, 3).map((activity, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          onActivityClick && onActivityClick(activity);
                        }}
                        className={`${ACTIVITY_TYPE_COLORS[activity.type] || 'bg-gray-500'} text-white text-xs px-1 py-0.5 rounded truncate hover:opacity-80`}
                        title={activity.subject}
                      >
                        {activity.subject}
                      </div>
                    ))}
                    {dayActivities.length > 3 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{dayActivities.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="p-4">
          <div className="text-center text-gray-500 py-12">
            Week view - Coming soon
          </div>
        </div>
      )}

      {/* Day View */}
      {view === 'day' && (
        <div className="p-4">
          <div className="text-center text-gray-500 py-12">
            Day view - Coming soon
          </div>
        </div>
      )}
    </div>
  );
};

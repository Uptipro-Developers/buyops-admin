'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { NotificationList } from './notification-list';
import { notificationService } from '@/services/notification-service';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { count } = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowList(!showList)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {showList && (
        <NotificationList
          onClose={() => setShowList(false)}
          onUpdate={fetchUnreadCount}
        />
      )}
    </div>
  );
}
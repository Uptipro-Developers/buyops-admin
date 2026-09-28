// NOTE: This file is superseded by notificationsApi in src/utils/api-service.ts
// which uses the configured axios instance with auth headers.
// Use notificationsApi from api-service.ts for all notification operations.

import { api } from '@/utils/api-service';

class NotificationService {
  private async fetch(url: string, options?: RequestInit) {
    const response = await api.request({
      url,
      method: options?.method || 'GET',
      data: options?.body,
    });
    return response.data;
  }

  async getNotifications() {
    return this.fetch('/notifications');
  }

  async getUnreadCount() {
    return this.fetch('/notifications/unread');
  }

  async markAsRead(id: string) {
    return this.fetch(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllAsRead() {
    return this.fetch('/notifications/read-all', { method: 'PUT' });
  }
}

export const notificationService = new NotificationService();

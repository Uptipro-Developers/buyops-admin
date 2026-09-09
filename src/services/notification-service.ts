// NOTE: This file is superseded by notificationsApi in src/utils/api-service.ts
// which uses the configured axios instance with auth headers.
// Use notificationsApi from api-service.ts for all notification operations.

// Vite projects use import.meta.env.VITE_* — not process.env.NEXT_PUBLIC_*
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';

class NotificationService {
  private async fetch(url: string, options?: RequestInit) {
    const token = localStorage.getItem('access_token');

    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    return response.json();
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
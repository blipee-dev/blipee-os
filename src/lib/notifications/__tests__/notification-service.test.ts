import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Notification Service', () => {
  class NotificationService {
    notifications = [];
    subscribers = new Map();
    
    send(userId, notification) {
      const fullNotification = {
        id: 'notif_' + Math.random().toString(36).substr(2, 9),
        userId,
        ...notification,
        createdAt: new Date(),
        read: false
      };
      
      this.notifications.push(fullNotification);
      
      // Notify subscribers
      const userSubscribers = this.subscribers.get(userId) || [];
      userSubscribers.forEach(callback => callback(fullNotification));
      
      return fullNotification;
    }
    
    getUnread(userId) {
      return this.notifications.filter(n => n.userId === userId && !n.read);
    }
    
    getAll(userId, limit = 50) {
      return this.notifications
        .filter(n => n.userId === userId)
        .slice(-limit)
        .reverse();
    }
    
    markAsRead(notificationId) {
      const notification = this.notifications.find(n => n.id === notificationId);
      if (!notification) return false;
      
      notification.read = true;
      notification.readAt = new Date();
      return true;
    }
    
    markAllAsRead(userId) {
      const userNotifications = this.notifications.filter(
        n => n.userId === userId && !n.read
      );
      
      userNotifications.forEach(n => {
        n.read = true;
        n.readAt = new Date();
      });
      
      return userNotifications.length;
    }
    
    delete(notificationId) {
      const index = this.notifications.findIndex(n => n.id === notificationId);
      if (index === -1) return false;
      
      this.notifications.splice(index, 1);
      return true;
    }
    
    subscribe(userId, callback) {
      const subscribers = this.subscribers.get(userId) || [];
      subscribers.push(callback);
      this.subscribers.set(userId, subscribers);
      
      // Return unsubscribe function
      return () => {
        const subs = this.subscribers.get(userId) || [];
        const index = subs.indexOf(callback);
        if (index > -1) {
          subs.splice(index, 1);
        }
      };
    }
    
    getUnreadCount(userId) {
      return this.notifications.filter(n => n.userId === userId && !n.read).length;
    }
  }
  
  let service;
  
  beforeEach(() => {
    service = new NotificationService();
  });
  
  describe('Sending notifications', () => {
    it('should send a notification', () => {
      const notification = service.send('user123', {
        title: 'Test Notification',
        message: 'This is a test',
        type: 'info'
      });
      
      expect(notification.id).toMatch(/^notif_/);
      expect(notification.userId).toBe('user123');
      expect(notification.title).toBe('Test Notification');
      expect(notification.read).toBe(false);
    });
    
    it('should notify subscribers', () => {
      const callback = jest.fn();
      service.subscribe('user123', callback);
      
      const notification = service.send('user123', {
        title: 'Test',
        message: 'Message'
      });
      
      expect(callback).toHaveBeenCalledWith(notification);
    });
  });
  
  describe('Reading notifications', () => {
    it('should get unread notifications', () => {
      service.send('user123', { title: 'Unread 1' });
      service.send('user123', { title: 'Unread 2' });
      service.send('user456', { title: 'Other user' });
      
      const unread = service.getUnread('user123');
      expect(unread).toHaveLength(2);
      expect(unread.every(n => n.userId === 'user123' && !n.read)).toBe(true);
    });
    
    it('should get all notifications with limit', () => {
      for (let i = 0; i < 10; i++) {
        service.send('user123', { title: `Notification ${i}` });
      }
      
      const all = service.getAll('user123', 5);
      expect(all).toHaveLength(5);
      expect(all[0].title).toBe('Notification 9'); // Most recent first
    });
  });
  
  describe('Marking as read', () => {
    it('should mark single notification as read', () => {
      const notif = service.send('user123', { title: 'Test' });
      
      expect(service.markAsRead(notif.id)).toBe(true);
      expect(notif.read).toBe(true);
      expect(notif.readAt).toBeInstanceOf(Date);
    });
    
    it('should mark all as read for user', () => {
      service.send('user123', { title: 'Test 1' });
      service.send('user123', { title: 'Test 2' });
      service.send('user456', { title: 'Other' });
      
      const marked = service.markAllAsRead('user123');
      expect(marked).toBe(2);
      expect(service.getUnread('user123')).toHaveLength(0);
      expect(service.getUnread('user456')).toHaveLength(1);
    });
  });
  
  describe('Deleting notifications', () => {
    it('should delete a notification', () => {
      const notif = service.send('user123', { title: 'Test' });
      
      expect(service.delete(notif.id)).toBe(true);
      expect(service.getAll('user123')).toHaveLength(0);
    });
    
    it('should return false for non-existent notification', () => {
      expect(service.delete('invalid')).toBe(false);
    });
  });
  
  describe('Subscriptions', () => {
    it('should handle multiple subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      service.subscribe('user123', callback1);
      service.subscribe('user123', callback2);
      
      service.send('user123', { title: 'Test' });
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
    
    it('should unsubscribe correctly', () => {
      const callback = jest.fn();
      const unsubscribe = service.subscribe('user123', callback);
      
      unsubscribe();
      service.send('user123', { title: 'Test' });
      
      expect(callback).not.toHaveBeenCalled();
    });
  });
  
  describe('Unread count', () => {
    it('should get correct unread count', () => {
      service.send('user123', { title: 'Test 1' });
      service.send('user123', { title: 'Test 2' });
      const notif = service.send('user123', { title: 'Test 3' });
      
      expect(service.getUnreadCount('user123')).toBe(3);
      
      service.markAsRead(notif.id);
      expect(service.getUnreadCount('user123')).toBe(2);
    });
  });
});
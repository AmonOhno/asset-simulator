import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { API_URL, toCamelCase, toSnakeCase } from '../types/common';
import {
  ScheduleEvent
} from '../types/common';

interface EventsState {
  events: ScheduleEvent[];

  // Actions
  fetchEvents: () => Promise<void>;
  addEvent: (event: Omit<ScheduleEvent, 'eventId' | 'createdAt'>) => Promise<void>;
  updateEvent: (event: ScheduleEvent) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

// --- Zustandストアの作成 ---
const eventsStore: StateCreator<EventsState> = (set, get) => ({
  events: [],

  // イベント一覧の取得
  fetchEvents: async () => {
    try {
      const response = await fetch(`${API_URL}/schedule-events`);
      if (!response.ok) throw new Error('Failed to fetch schedule events');
      const data = await response.json();
      set({ events: data.map(toCamelCase) });
    } catch (error) {
      console.error("Error fetching schedule events:", error);
    }
  },

  // イベントの追加
  addEvent: async (event: Omit<ScheduleEvent, 'eventId' | 'createdAt'>) => {
    try {
      const response = await fetch(`${API_URL}/schedule-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSnakeCase(event))
      });
      if (!response.ok) throw new Error('Failed to add schedule event');
      const newEvent = await response.json();
      set((state) => ({ events: [...state.events, toCamelCase(newEvent)] }));
    } catch (error) {
      console.error("Error adding schedule event:", error);
    }
  },

  // イベントの更新
  updateEvent: async (event: ScheduleEvent) => {
    try {
      const response = await fetch(`${API_URL}/schedule-events/${event.eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSnakeCase(event))
      });
      if (!response.ok) throw new Error('Failed to update schedule event');
      const updated = await response.json();
      set((state) => ({
        events: state.events.map(e =>
          e.eventId === event.eventId ? toCamelCase(updated) : e
        )
      }));
    } catch (error) {
      console.error("Error updating schedule event:", error);
    }
  },

  // イベントの削除
  deleteEvent: async (eventId) => {
    try {
      console.log('削除API呼び出し:', `${API_URL}/schedule-events/${eventId}`);
      const response = await fetch(`${API_URL}/schedule-events/${eventId}`, {
        method: 'DELETE'
      });
      console.log('削除APIレスポンス:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('削除APIエラー:', errorText);
        throw new Error(`Failed to delete schedule event: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('削除API結果:', result);
      
      set((state) => ({
        events: state.events.filter(event => event.eventId !== eventId)
      }));
    } catch (error) {
      console.error("Error deleting schedule event:", error);
      throw error; // エラーを再スローして上位でキャッチできるようにする
    }
  }
});

export const useEventsStore = create<EventsState>(eventsStore);
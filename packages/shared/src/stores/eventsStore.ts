import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { toCamelCase, toSnakeCase } from '../utils/caseConvert';
import {
  ScheduleEvent
} from '../types/common';
import { useAuthStore, supabase } from './authStore';

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
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      set({ events: toCamelCase(data || []) });
    } catch (error) {
      console.error("Error fetching schedule events:", error);
    }
  },

  // イベントの追加
  addEvent: async (event: Omit<ScheduleEvent, 'eventId' | 'createdAt'>) => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const newEvent = {
        event_id: `event_${crypto.randomUUID()}`,
        user_id: userId,
        title: event.title,
        all_day_flg: event.allDayFlg,
        start_date: event.startDate,
        start_time: event.startTime || null,
        end_date: event.endDate,
        end_time: event.endTime || null,
        description: event.description || '',
        created_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('schedule_events')
        .insert([newEvent])
        .select()
        .single();
      if (error) throw error;
      set((state) => ({ events: [...state.events, toCamelCase(data)] }));
    } catch (error) {
      console.error("Error adding schedule event:", error);
    }
  },

  // イベントの更新
  updateEvent: async (event: ScheduleEvent) => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('schedule_events')
        .update({
          title: event.title,
          all_day_flg: event.allDayFlg,
          start_date: event.startDate,
          start_time: event.startTime || null,
          end_date: event.endDate,
          end_time: event.endTime || null,
          description: event.description || '',
        })
        .eq('event_id', event.eventId)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      set((state) => ({
        events: state.events.map((e) =>
          e.eventId === event.eventId ? toCamelCase(data) : e
        ),
      }));
    } catch (error) {
      console.error("Error updating schedule event:", error);
    }
  },

  // イベントの削除
  deleteEvent: async (eventId) => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('schedule_events')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);
      if (error) throw error;
      set((state) => ({
        events: state.events.filter((event) => event.eventId !== eventId),
      }));
    } catch (error) {
      console.error("Error deleting schedule event:", error);
      throw error;
    }
  },
});

export const useEventsStore = create<EventsState>(eventsStore);

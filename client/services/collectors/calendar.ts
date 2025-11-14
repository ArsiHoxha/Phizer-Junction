/**
 * Calendar Integration
 * Read-only calendar access to detect stress periods (busy days, meetings)
 */

import * as Calendar from 'expo-calendar';

export interface CalendarData {
  timestamp: Date;
  eventsToday: number;
  busyHoursToday: number;
  stressScore: number; // 0-100 based on calendar load
  upcomingHighStressPeriods: string[];
}

interface CalendarEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  duration: number; // minutes
}

class CalendarIntegration {
  private calendarPermissionGranted: boolean = false;
  private defaultCalendarId: string | null = null;

  /**
   * Request calendar permissions
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      this.calendarPermissionGranted = status === 'granted';
      
      if (this.calendarPermissionGranted) {
        await this.findDefaultCalendar();
      }
      
      return this.calendarPermissionGranted;
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      return false;
    }
  }

  /**
   * Find the default calendar
   */
  private async findDefaultCalendar() {
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      if (calendars.length > 0) {
        // Prefer primary or first calendar
        const primary = calendars.find(cal => cal.isPrimary) || calendars[0];
        this.defaultCalendarId = primary.id;
      }
    } catch (error) {
      console.error('Error finding calendar:', error);
    }
  }

  /**
   * Get today's events
   */
  private async getTodayEvents(): Promise<CalendarEvent[]> {
    if (!this.calendarPermissionGranted || !this.defaultCalendarId) {
      return this.getSimulatedEvents();
    }

    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const events = await Calendar.getEventsAsync(
        [this.defaultCalendarId],
        startOfDay,
        endOfDay
      );

      return events.map(event => ({
        title: event.title,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        duration: (new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60),
      }));
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return this.getSimulatedEvents();
    }
  }

  /**
   * Generate simulated calendar events for demo
   */
  private getSimulatedEvents(): CalendarEvent[] {
    const hour = new Date().getHours();
    const today = new Date();
    
    // Simulate typical work day if during business hours
    if (hour < 9 || hour > 17) {
      return []; // No events outside work hours
    }
    
    const events: CalendarEvent[] = [];
    
    // Morning standup (9 AM)
    const standup = new Date(today);
    standup.setHours(9, 0, 0, 0);
    events.push({
      title: 'Team Standup',
      startDate: standup,
      endDate: new Date(standup.getTime() + 30 * 60 * 1000),
      duration: 30,
    });
    
    // Mid-morning meeting (10:30 AM)
    if (Math.random() > 0.3) {
      const meeting1 = new Date(today);
      meeting1.setHours(10, 30, 0, 0);
      events.push({
        title: 'Project Review',
        startDate: meeting1,
        endDate: new Date(meeting1.getTime() + 60 * 60 * 1000),
        duration: 60,
      });
    }
    
    // Afternoon meeting (2 PM)
    if (Math.random() > 0.4) {
      const meeting2 = new Date(today);
      meeting2.setHours(14, 0, 0, 0);
      events.push({
        title: 'Client Call',
        startDate: meeting2,
        endDate: new Date(meeting2.getTime() + 45 * 60 * 1000),
        duration: 45,
      });
    }
    
    // Late afternoon (4 PM)
    if (Math.random() > 0.5) {
      const meeting3 = new Date(today);
      meeting3.setHours(16, 0, 0, 0);
      events.push({
        title: 'Planning Session',
        startDate: meeting3,
        endDate: new Date(meeting3.getTime() + 90 * 60 * 1000),
        duration: 90,
      });
    }
    
    return events;
  }

  /**
   * Calculate busy hours (time in meetings)
   */
  private calculateBusyHours(events: CalendarEvent[]): number {
    const totalMinutes = events.reduce((sum, event) => sum + event.duration, 0);
    return totalMinutes / 60;
  }

  /**
   * Calculate stress score based on calendar load
   */
  private calculateStressScore(events: CalendarEvent[], busyHours: number): number {
    let score = 0;
    
    // Base score from number of events
    score += events.length * 10; // 10 points per event
    
    // Additional score for busy hours
    if (busyHours > 4) {
      score += (busyHours - 4) * 15; // 15 points per hour over 4
    }
    
    // Back-to-back meetings increase stress
    const sortedEvents = events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const gap = sortedEvents[i + 1].startDate.getTime() - sortedEvents[i].endDate.getTime();
      if (gap < 15 * 60 * 1000) { // Less than 15 minutes between meetings
        score += 10;
      }
    }
    
    // Long meetings (>60 min) are more stressful
    const longMeetings = events.filter(e => e.duration > 60);
    score += longMeetings.length * 15;
    
    return Math.min(100, score);
  }

  /**
   * Identify upcoming high-stress periods
   */
  private identifyStressPeriods(events: CalendarEvent[]): string[] {
    const periods: string[] = [];
    const now = new Date();
    
    // Check for upcoming back-to-back meetings
    const sortedEvents = events
      .filter(e => e.startDate > now)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const gap = sortedEvents[i + 1].startDate.getTime() - sortedEvents[i].endDate.getTime();
      if (gap < 15 * 60 * 1000) {
        const timeStr = sortedEvents[i].startDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        });
        periods.push(`Back-to-back meetings at ${timeStr}`);
      }
    }
    
    // Check for long meetings
    const upcomingLong = sortedEvents.filter(e => e.duration > 90);
    upcomingLong.forEach(event => {
      const timeStr = event.startDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
      periods.push(`Long meeting at ${timeStr} (${Math.round(event.duration)} min)`);
    });
    
    return periods.slice(0, 3); // Return max 3 periods
  }

  /**
   * Collect calendar data
   */
  public async collectData(): Promise<CalendarData> {
    const events = await this.getTodayEvents();
    const busyHours = this.calculateBusyHours(events);
    const stressScore = this.calculateStressScore(events, busyHours);
    const stressPeriods = this.identifyStressPeriods(events);
    
    return {
      timestamp: new Date(),
      eventsToday: events.length,
      busyHoursToday: Math.round(busyHours * 10) / 10, // Round to 1 decimal
      stressScore,
      upcomingHighStressPeriods: stressPeriods,
    };
  }

  /**
   * Check if currently in a meeting
   */
  public async isInMeeting(): Promise<boolean> {
    const events = await this.getTodayEvents();
    const now = new Date();
    
    return events.some(event => 
      event.startDate <= now && event.endDate >= now
    );
  }
}

// Singleton instance
let integrationInstance: CalendarIntegration | null = null;

export const getCalendarIntegration = (): CalendarIntegration => {
  if (!integrationInstance) {
    integrationInstance = new CalendarIntegration();
  }
  return integrationInstance;
};

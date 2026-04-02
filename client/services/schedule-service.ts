import { serverApi } from "@/config/serverApi";
import Schedule from "@/models/Schedule";

const SERVICE = "schedule";

export const addSchedule = async (schedule: Schedule): Promise<boolean> => {
  try {
    const res = await serverApi.post(`${SERVICE}/add`, {
      title: schedule.title,
      occasion: schedule.occasion,
      timestamp: schedule.timestamp.toISOString(),
    });

    return res.data.success;
  } catch (error) {
    console.error("Error adding schedule:", error);
    return false;
  }
};

export const fetchSchedules = async (): Promise<Schedule[]> => {
  try {
    const res = await serverApi.get(`${SERVICE}/list`);
    
    return res.data.map((item: any) => new Schedule(
      item.id,
      item.title,
      item.occasion,
      new Date(item.timestamp)
    ));
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return [];
  }
};

export const fetchLatestSchedulesByHours = async (hours: number): Promise<Schedule[]> => {
  try {
    const res = await serverApi.get(`${SERVICE}/latest-by-hours/${hours}`);
    
    return res.data.map((item: any) => new Schedule(
      item.id,
      item.title,
      item.occasion,
      new Date(item.timestamp)
    ));
  } catch (error) {
    console.error("Error fetching latest schedules by hours:", error);
    return [];
  }
};

export const deleteSchedule = async (scheduleId: string): Promise<boolean> => {
  try {
    const res = await serverApi.delete(`${SERVICE}/delete/${scheduleId}`);
    return res.data === "Deleted" || res.data === true;
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return false;
  }
};
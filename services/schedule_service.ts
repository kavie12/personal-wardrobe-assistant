import { SAMPLE_USER_ID } from "@/data";
import Schedule from "@/models/Schedule";
import axios from "axios";

const BASE_URL = "http://10.225.145.138:8000/schedule";

export const addSchedule = async (schedule: Schedule): Promise<boolean> => {
  try {
    const res = await axios.post(`${BASE_URL}/add`, {
      user_id: SAMPLE_USER_ID,
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

export const fetchSchedules = async (userId: string): Promise<Schedule[]> => {
  try {
    const res = await axios.get(`${BASE_URL}/list/${userId}`);
    
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

export const fetchLatestSchedulesByHours = async (userId: string, hours: number): Promise<Schedule[]> => {
  try {
    const res = await axios.get(`${BASE_URL}/latest-by-hours/${userId}/${hours}`);
    
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
    const res = await axios.delete(`${BASE_URL}/delete/${scheduleId}`);
    return res.data === "Deleted" || res.data === true;
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return false;
  }
};
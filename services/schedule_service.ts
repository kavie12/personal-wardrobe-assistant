import { SAMPLE_USER_ID } from "@/data";
import Schedule from "@/models/Schedule";
import axios from "axios";

const BASE_URL = "http://10.225.145.138:8000/schedule";

export const addSchedule = async (schedule: Schedule): Promise<boolean> => {
  const res = await axios.post(`${BASE_URL}/add`, {
    user_id: SAMPLE_USER_ID,
    title: schedule.title,
    occasion: schedule.occasion,
    timestamp: schedule.timestamp.toISOString(),
  });

  return res.data.success;
};

export const fetchSchedules = async (userId: string): Promise<Schedule[]> => {
  const res = await axios.get(`${BASE_URL}/list/${userId}`);
  
  return res.data.map((item: any) => new Schedule(
    item.id,
    item.title,
    item.occasion,
    new Date(item.timestamp)
  ));
};

export const fetchLatestSchedule = async (userId: string): Promise<Schedule | null> => {
  const res = await axios.get(`${BASE_URL}/latest/${userId}`);
  
  if (!res.data) return null;

  return new Schedule(
    res.data.id,
    res.data.title,
    res.data.occasion,
    new Date(res.data.timestamp)
  );
};

export const fetchLatestSchedules24H = async (userId: string): Promise<Schedule[]> => {
  const res = await axios.get(`${BASE_URL}/latest-24h/${userId}`);
  
  return res.data.map((item: any) => new Schedule(
    item.id,
    item.title,
    item.occasion,
    new Date(item.timestamp)
  ));
};

export const deleteSchedule = async (scheduleId: string): Promise<boolean> => {
  const res = await axios.delete(`${BASE_URL}/delete/${scheduleId}`);
  return res.data === "Deleted" || res.data === true;
};
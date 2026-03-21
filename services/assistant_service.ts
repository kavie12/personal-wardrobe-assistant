import { SAMPLE_USER_ID } from "@/data";
import axios from "axios";

const BASE_URL = "http://10.225.145.138:8000/assistant";

export const chat = async (
  userId: string = SAMPLE_USER_ID,
  message: string
): Promise<{ message: string, readyToGenerate: boolean, context: string | null, time: Date | null, formality: string | null }> => {
  const res = await axios.post(`${BASE_URL}/chat`, {
    user_id: userId,
    message: message
  });
  
  const chatObj = {
    message: res.data.message,
    readyToGenerate: res.data.ready_to_generate,
    context: res.data.context,
    time: res.data.time ? new Date(res.data.time) : null,
    formality: res.data.formality
  };

  console.log(chatObj);

  return chatObj;
};
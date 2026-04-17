import { serverApi } from "@/config/serverApi";

const SERVICE = "assistant";

interface ChatResponse {
  message: string;
  readyToGenerate: boolean;
  context: string | null;
  time: Date | null;
  formality: string | null;
}

export const chat = async (message: string): Promise<ChatResponse> => {
  const res = await serverApi.post(`${SERVICE}/chat`, {
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

export const resetChat = async (): Promise<void> => {
  await serverApi.post(`${SERVICE}/reset`);
};
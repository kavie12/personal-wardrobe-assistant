import { serverApi } from "@/config/serverApi";
import { NULL_SLOT_HINTS } from "@/data";
import { SlotHints } from "@/types";

const SERVICE = "assistant";

interface ChatResponse {
  message: string;
  readyToGenerate: boolean;
  occasion: string | null;
  time: Date | null;
  type: SlotHints;
  color: SlotHints;
}

export const chat = async (message: string): Promise<ChatResponse> => {
  const res = await serverApi.post(`${SERVICE}/chat`, { message });

  const chatObj: ChatResponse = {
    message:           res.data.message,
    readyToGenerate:   res.data.ready_to_generate,
    occasion:          res.data.occasion ?? null,
    time:              res.data.time ? new Date(res.data.time) : null,
    type:              res.data.type  ?? NULL_SLOT_HINTS,
    color:             res.data.color ?? NULL_SLOT_HINTS,
  };

  console.log(chatObj);
  return chatObj;
};

export const resetChat = async (): Promise<void> => {
  await serverApi.post(`${SERVICE}/reset`);
};
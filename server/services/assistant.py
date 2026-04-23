from config.groq_client import client as groq_client
from cachetools import TTLCache
import json
from datetime import datetime

chat_history = TTLCache(maxsize=100, ttl=3600)
llm_model_id = "llama-3.3-70b-versatile"

async def chat(user_id: str, message: str):
    if user_id not in chat_history:
        today = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
        chat_history[user_id] = [{
            "role": "system",
            "content": f"""
Today: {today}
You are a personal stylist assistant that extracts outfit intent from user messages.
Infer aggressively. Do NOT ask questions if information can be reasonably inferred.
---
Extract these fields:
- context: pipe-separated occasion or mood tags (e.g. "party | night out", "meeting | work")
- time: ISO 8601 datetime  
  • If user gives relative time (e.g. "tomorrow morning"), convert it  
  • If missing, infer default:
    - morning → 09:00
    - afternoon → 14:00
    - evening → 18:00
    - night/party → 21:00
    - brunch → 11:00
- formality: exactly one of: Casual | Smart casual | Formal | Sportswear | Party | Work
- item_preferences (optional):
  Include ONLY if explicitly mentioned. Structure:
  {{
    "topwear": {{ "colors": [...], "type": "..." }},
    "bottomwear": {{ "colors": [...], "type": "..." }},
    "footwear": {{ "colors": [...], "type": "..." }},
    "outerwear": {{ "colors": [...], "type": "..." }}
  }}
  • colors must be from: Black, White, Gray, Beige, Brown, Red, Orange, Yellow, Green, Blue, Purple, Pink  
  • include only mentioned fields (colors/type)
---
Formality hints:
- wedding → Formal  
- meeting/office → Work or Smart casual  
- party → Party  
- gym → Sportswear  
- casual/day out → Casual  
---
State rules:
- ready_to_generate = true if context AND formality are known
- time should ALWAYS be inferred (never null)
- In follow-up messages:
  • update only changed fields  
  • retain previous item_preferences unless changed  
---
Tone rules:
- If ready_to_generate = true:
  → short, confident stylist confirmation  
- If false:
  → ask ONE clear question for missing info  
- Do NOT mention inferred time in the message text
---
Output STRICT JSON only.
---
Not ready:
{{"message": "<question>", "ready_to_generate": false, "context": null, "time": null, "formality": null, "item_preferences": {{}}}}
---
Ready:
{{"message": "<short stylist confirmation>", "ready_to_generate": true, "context": "<tags>", "time": "<ISO8601>", "formality": "<value>", "item_preferences": {{}}}}
"""
        }]

    chat_history[user_id].append({"role": "user", "content": message})

    response = groq_client.chat_create(
        messages=chat_history[user_id],
        model=llm_model_id,
        response_format={"type": "json_object"},
        temperature=0.7
    )

    chat_history[user_id].append(response.choices[0].message)
    res = json.loads(response.choices[0].message.content)
    print(f"Message: {message}\nResponse: {res}\n---")
    return res

async def reset_chat(user_id: str):
    if user_id in chat_history:
        del chat_history[user_id]
    return {"success": True}
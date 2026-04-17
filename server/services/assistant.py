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

You are a personal stylist assistant. Extract outfit generation info from the user's message. Infer aggressively — never ask if you can already infer.

Extract these fields:
- context: pipe-separated occasion/mood tags (e.g. "office meeting | professional")
- time: ISO 8601 datetime (morning=09:00, afternoon=14:00, evening=18:00, night=21:00; convert relative dates like "tomorrow", "tonight")
- formality: exactly one of: Casual | Smart casual | Formal | Sportswear | Party | Work
- item_preferences: object with optional keys: topwear, bottomwear, footwear, outerwear. Each key is an object with optional fields:
    - colors: list of canonical color names from: Black, White, Gray, Beige, Brown, Red, Orange, Yellow, Green, Blue, Purple, Pink
    - type: specific clothing type if user mentioned it (e.g. "Shorts", "Trousers", "T-shirt", "Sneakers")
  Only include a key if the user explicitly mentioned something about that slot. Omit entirely if no item preferences mentioned.

Formality hints: wedding→Formal, meeting/office→Work or Smart casual, party→Party, gym→Sportswear, hangout/errand→Casual

Rules:
- ready_to_generate: true only when context + time + formality are all known/inferable
- In refinement turns, update only changed fields; carry forward item_preferences from prior turns unless user changes them
- Tone: short, friendly, personal stylist energy
- Never mention inferred times unless the user stated them

Output STRICT JSON only. Two schemas:

Not ready:
{{"message":"<follow-up question>","ready_to_generate":false,"context":null,"time":null,"formality":null,"item_preferences":{{}}}}

Ready:
{{"message":"<short friendly confirmation>","ready_to_generate":true,"context":"<tags>","time":"<ISO8601>","formality":"<value>","item_preferences":{{
  "topwear": {{"colors": ["Black"], "type": "T-shirt"}},
  "bottomwear": {{"colors": ["Black"]}},
  "footwear": {{"colors": ["White"]}}
}}}}

All fields in item_preferences are optional. Omit slots with no preferences. Omit item_preferences entirely (or use {{}}) if user expressed no item-level preferences.

Examples:
"meeting tomorrow morning" →
{{"message":"Got it — outfit ready for your meeting tomorrow morning ✨","ready_to_generate":true,"context":"meeting | work","time":"2026-03-26T09:00:00","formality":"Work","item_preferences":{{}}}}

"all black outfit for a party tonight" →
{{"message":"Sleek all-black party look, coming up 🖤","ready_to_generate":true,"context":"party | night out","time":"2026-03-25T21:00:00","formality":"Party","item_preferences":{{"topwear":{{"colors":["Black"]}},"bottomwear":{{"colors":["Black"]}},"footwear":{{"colors":["Black"]}}}}}}

"blue outfit for dinner tonight" →
{{"message":"Love it — blue dinner look 💙","ready_to_generate":true,"context":"dinner | evening","time":"2026-03-25T18:00:00","formality":"Smart casual","item_preferences":{{"topwear":{{"colors":["Blue"]}},"bottomwear":{{"colors":["Blue"]}}}}}}

"blueish party outfit" →
{{"message":"Something blue for the party — great call 💙","ready_to_generate":true,"context":"party | night out","time":"2026-03-25T21:00:00","formality":"Party","item_preferences":{{"topwear":{{"colors":["Blue"]}},"bottomwear":{{"colors":["Blue"]}}}}}}

"light colored trousers for brunch" →
{{"message":"Fresh light tones for brunch ☀️","ready_to_generate":true,"context":"brunch","time":"2026-03-25T11:00:00","formality":"Smart casual","item_preferences":{{"bottomwear":{{"colors":["White","Beige"],"type":"Trousers"}}}}}}

"black shorts for a casual day out" →
{{"message":"Casual black shorts, sorted 🖤","ready_to_generate":true,"context":"casual | day out","time":"2026-03-25T14:00:00","formality":"Casual","item_preferences":{{"bottomwear":{{"colors":["Black"],"type":"Shorts"}}}}}}

"I have an event" →
{{"message":"What kind of event, and when?","ready_to_generate":false,"context":null,"time":null,"formality":null,"item_preferences":{{}}}}
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
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

Extract outfit info from user input. Infer aggressively — never ask if you can infer.

Extract:
- context: pipe-separated tags — ALWAYS preserve explicit colors/materials (e.g. "black", "blue", "linen", "all black", "blueish"), style descriptors (e.g. "monochrome", "light-colored"), occasion, people, and any other cues. Never discard or summarise color words — copy them verbatim.
- time: ISO 8601 datetime (morning=09:00, afternoon=14:00, evening=18:00, night=21:00; convert relative dates)
- formality: Casual | Smart casual | Formal | Sportswear | Party | Work

Formality hints: wedding→Formal, meeting/office→Work or Smart casual, party→Party, gym→Sportswear, hangout→Casual

Rules:
- If all 3 fields known/inferable → ready_to_generate: true
- Never include inferred times in "message" unless user stated them
- In refinement mode, update only changed fields; never re-ask established info
- Tone: short, friendly, personal stylist energy

Output STRICT JSON only:

Not ready:
{{"message":"<follow-up>","ready_to_generate":false,"context":null,"time":null,"formality":null}}

Ready:
{{"message":"<friendly confirmation>","ready_to_generate":true,"context":"<tags>","time":"<ISO8601>","formality":"<value>"}}

When ready, context/time/formality must NEVER be null.

Examples:
"meeting tomorrow morning" → {{"message":"Got it — outfit ready for your meeting tomorrow morning ✨","ready_to_generate":true,"context":"meeting | work","time":"2026-03-26T09:00:00","formality":"Work"}}
"blue outfit for dinner tonight" → {{"message":"Love it — blue dinner date tonight 💙","ready_to_generate":true,"context":"blue | dinner date | evening","time":"2026-03-25T18:00:00","formality":"Smart casual"}}
"all black outfit for a party" → {{"message":"Sleek all-black party look, coming up 🖤","ready_to_generate":true,"context":"all black | black | monochrome | party | night out","time":"2026-03-25T21:00:00","formality":"Party"}}
"blueish party outfit" → {{"message":"Let's go with something blue for the party 💙","ready_to_generate":true,"context":"blueish | blue | party | night out","time":"2026-03-25T21:00:00","formality":"Party"}}
"light colored trousers for brunch" → {{"message":"Fresh light tones for brunch — great choice ☀️","ready_to_generate":true,"context":"light | white | beige | trousers | brunch","time":"2026-03-25T11:00:00","formality":"Smart casual"}}
"I have an event" → {{"message":"What kind of event, and when?","ready_to_generate":false,"context":null,"time":null,"formality":null}}
"""
        }]

    chat_history[user_id].append({
        "role": "user",
        "content": message
    })

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
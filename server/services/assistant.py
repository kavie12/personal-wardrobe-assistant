from config.groq_client import client as groq_client
from cachetools import TTLCache
from datetime import datetime
from services.recommendation_module.outfit_filters import OCCASION_FILTER, TYPE_FILTER, COLOR_FILTER
import json

chat_history = TTLCache(maxsize=100, ttl=3600)

llm_model_id = "llama-3.3-70b-versatile"

# ---------------------------------------------------------------------------
# Build allowed-value lists from outfit_filters so the prompt stays in sync
# with the actual filter tables — no duplication, no drift.
# ---------------------------------------------------------------------------
_ALLOWED_OCCASIONS = list(OCCASION_FILTER.keys())
_ALLOWED_TYPES = {
    slot: list(types.keys())
    for slot, types in TYPE_FILTER.items()
}
_ALLOWED_COLORS = list(COLOR_FILTER.keys())

_SYSTEM_PROMPT = f"""Today: {{today}}

You are a personal stylist assistant. Extract outfit preferences from the user's messages.

=== OUTPUT FORMAT (strict JSON only) ===

Not ready (missing occasion or time):
{{"message":"<short friendly question>","ready_to_generate":false,"occasion":null,"time":null,"type":{{"topwear":null,"bottomwear":null,"footwear":null,"outerwear":null}},"color":{{"topwear":null,"bottomwear":null,"footwear":null,"outerwear":null}}}}

Ready:
{{"message":"<short friendly confirmation>","ready_to_generate":true,"occasion":"<value>","time":"<ISO8601>","type":{{"topwear":"<value>|null","bottomwear":"<value>|null","footwear":"<value>|null","outerwear":"<value>|null"}},"color":{{"topwear":"<value>|null","bottomwear":"<value>|null","footwear":"<value>|null","outerwear":"<value>|null"}}}}

=== FIELD RULES ===

occasion (REQUIRED to be ready):
  Allowed values: {_ALLOWED_OCCASIONS}
  Infer aggressively:
    wedding/interview/graduation → Formal
    meeting/office/client → Work
    dinner/date → Smart casual
    hangout/brunch/beach → Casual
    party/birthday → Party
    gym/workout/sport → Sportswear

time (REQUIRED to be ready):
  ISO 8601 datetime. Convert relative references using today's date.
  morning=09:00, afternoon=14:00, evening=18:00, night=21:00
  If user says "today" with no time, use 09:00.

type (OPTIONAL — extract only if user explicitly mentions a clothing type):
  topwear allowed:    {_ALLOWED_TYPES['topwear']}
  bottomwear allowed: {_ALLOWED_TYPES['bottomwear']}
  footwear allowed:   {_ALLOWED_TYPES['footwear']}
  outerwear allowed:  {_ALLOWED_TYPES['outerwear']}
  Set slot to null if user did not mention a type for it.

color (OPTIONAL — extract only if user explicitly mentions a color):
  Allowed values (per slot): {_ALLOWED_COLORS}
  Set slot to null if user did not mention a color for it.

=== BEHAVIOUR RULES ===
- ready_to_generate is true only when BOTH occasion AND time are known or inferable.
- type and color are always optional — never ask for them, never block on them.
- In follow-up messages: update only changed fields. Never re-ask what is already known.
- Never mention inferred times in your message unless the user stated them.
- Tone: short, warm, personal stylist energy.

=== EXAMPLES ===
"job interview tomorrow morning"
→ {{"message":"All set for your interview tomorrow morning!","ready_to_generate":true,"occasion":"Formal","time":"<tomorrow>T09:00:00","type":{{"topwear":null,"bottomwear":null,"footwear":null,"outerwear":null}},"color":{{"topwear":null,"bottomwear":null,"footwear":null,"outerwear":null}}}}

"casual hangout this afternoon, want a blue shirt"
→ {{"message":"Blue shirt for a casual hangout — love it!","ready_to_generate":true,"occasion":"Casual","time":"<today>T14:00:00","type":{{"topwear":"Shirt","bottomwear":null,"footwear":null,"outerwear":null}},"color":{{"topwear":"Blue","bottomwear":null,"footwear":null,"outerwear":null}}}}

"party tonight, black dress and heels"
→ {{"message":"Black dress and heels for tonight's party — stunning!","ready_to_generate":true,"occasion":"Party","time":"<today>T21:00:00","type":{{"topwear":null,"bottomwear":null,"footwear":"Heels","outerwear":null}},"color":{{"topwear":null,"bottomwear":"Black","footwear":null,"outerwear":null}}}}

"I need an outfit"
→ {{"message":"What's the occasion, and when?","ready_to_generate":false,"occasion":null,"time":null,"type":{{"topwear":null,"bottomwear":null,"footwear":null,"outerwear":null}},"color":{{"topwear":null,"bottomwear":null,"footwear":null,"outerwear":null}}}}

"gym session"
→ {{"message":"What time are you heading to the gym?","ready_to_generate":false,"occasion":"Sportswear","time":null,"type":{{"topwear":null,"bottomwear":null,"footwear":null,"outerwear":null}},"color":{{"topwear":null,"bottomwear":null,"footwear":null,"outerwear":null}}}}
"""


async def chat(user_id: str, message: str):
    if user_id not in chat_history:
        today = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
        chat_history[user_id] = [{
            "role":    "system",
            "content": _SYSTEM_PROMPT.replace("{today}", today),
        }]

    chat_history[user_id].append({"role": "user", "content": message})

    response = groq_client.chat_create(
        model=llm_model_id,
        messages=chat_history[user_id],
        response_format={"type": "json_object"},
        temperature=0.7,
    )

    chat_history[user_id].append(response.choices[0].message)

    res = json.loads(response.choices[0].message.content)
    print(f"User   : {message}\nAssistant: {res}\n---")

    return res


async def reset_chat(user_id: str):
    if user_id in chat_history:
        del chat_history[user_id]
    return {"success": True}
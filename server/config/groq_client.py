import os
from groq import Groq
from groq._exceptions import RateLimitError

keys = [
    os.getenv("GROQ_API_KEY_1"),
    os.getenv("GROQ_API_KEY_2"),
    os.getenv("GROQ_API_KEY_3"),
    os.getenv("GROQ_API_KEY_4")
]

class GroqClientManager:
    def __init__(self, api_keys: list[str]):
        self.api_keys = [k for k in api_keys if k]
        self.index = 0
        self._client = Groq(api_key=self.api_keys[0])

    def _rotate(self):
        self.index = (self.index + 1) % len(self.api_keys)
        self._client = Groq(api_key=self.api_keys[self.index])
        print(f"[GroqClientManager] Rotated to key index {self.index}")

    def chat_create(self, **kwargs):
        """Directly wraps chat.completions.create with rotation + retry."""
        attempts = 0
        while attempts < len(self.api_keys):
            try:
                return self._client.chat.completions.create(**kwargs)
            except RateLimitError as e:
                print(f"[GroqClientManager] Rate limit hit on key {self.index}, rotating...")
                self._rotate()
                attempts += 1
        raise RateLimitError("All API keys exhausted.")

client = GroqClientManager(keys)
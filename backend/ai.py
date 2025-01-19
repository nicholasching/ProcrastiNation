import os
from google import genai
from google.genai import types
from dotenv import load_dotenv, dotenv_values

class Ai:
    def __init__(self):
        load_dotenv()
        self.model = genai.Client(api_key=os.environ["API_KEY"])
        self.mimeType = 'image/jpeg'
        self.profiles = []
        self.loadProfiles()
    
    def loadProfiles(self):
        # Temp load prof 1
        self.profiles.append([["STH_FE", "failure"], ["STH-WG", "what you doing?"], ["STH-WL", "what the helllll"]])

        # Temp load prof 2
        self.profiles.append(["UKR_HA", "haiyaa"], )

    def genIns(self, type, name, time, app, profile):
        # Time worked in current session
        if type == 0:
            response = self.model.models.generate_content(model='gemini-2.0-flash-exp', contents=[
            types.Part.from_text(f"Your job is the pursuade the user to do work through FOMO and peer pressure, by making them feel bad about procrastinating. Compare them to their friend, {name}, who has been working for {time} minutes already! For reference, the user is wasting time on {app} right now. Keep your response short, it is intended to be a notification."
                                 f"Furthermore, you can play an audio track on the user's computer to further pursuade them, your options are will be contained in the following list, where the first item in each sublist will be the ID to be returned and the second item is the sound that will be played:"
                                 f"{self.profiles[profile]}")],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "required": [
                        "text",
                        "audioID",
                    ],
                    "properties": {
                        "text": {"type": "STRING"},
                        "audioID": {"type": "STRING"},
                    },
                    "type": "OBJECT",
                },
                system_instruction="Respond creatively, humourously, and concisely. You may convert minutes to hours and minutes if an hour is exceeded.",
                temperature=1.5,
            ),
        )
        # Time worked today
        else:
            response = self.model.models.generate_content(model='gemini-2.0-flash-exp', contents=[
            types.Part.from_text(f"Your job is the pursuade the user to do work through FOMO and peer pressure, by making them feel bad about procrastinating. Compare them to their friend, {name}, who has already done {time} minutes of work today! For reference, the user is wasting time on {app} right now. Keep your response short, it is intended to be a notification."
                                 f"Furthermore, you can play an audio track on the user's computer to further pursuade them, your options are will be contained in the following list, where the first item in each sublist will be the ID to be returned and the second item is the sound that will be played:"
                                 f"{self.profiles[profile]}")],
                config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "required": [
                        "text",
                        "audioID",
                    ],
                    "properties": {
                        "text": {"type": "STRING"},
                        "audioID": {"type": "STRING"},
                    },
                    "type": "OBJECT",
                },
                system_instruction="Respond creatively, humourously, and concisely. You may convert minutes to hours and minutes if an hour is exceeded.",
                temperature=1.5,
                ),
            )
        return response.text
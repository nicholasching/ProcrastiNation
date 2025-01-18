import os
from google import genai
from google.genai import types
from dotenv import load_dotenv, dotenv_values

class Ai:
    def __init__(self):
        load_dotenv()
        self.model = genai.Client(api_key=os.environ["API_KEY"])
        self.mimeType = 'image/jpeg'

    def runIdent(self, type, name, time, app):
        # Time worked in current session
        if type == 0:
            response = self.model.models.generate_content(model='gemini-2.0-flash-exp', contents=[
            types.Part.from_text(f"Your job is the pursuade the user to do work through FOMO and peer pressure, by making them feel bad about procrastinating. Compare them to their friend, {name}, who has been working for {time} minutes already! For reference, the user is wasting time on {app} right now. Keep your response short, it is intended to be a notification."),
            ])
        else:
            response = self.model.models.generate_content(model='gemini-2.0-flash-exp', contents=[
            types.Part.from_text(f"Your job is the pursuade the user to do work through FOMO and peer pressure, by making them feel bad about procrastinating. Compare them to their friend, {name}, who has already done {time} minutes of work today! For reference, the user is wasting time on {app} right now. Keep your response short, it is intended to be a notification."),
            ])
        return response.text
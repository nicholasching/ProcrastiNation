# UTHacks

Running front-end:

```sh
cd frontend
npm install
npm start
```

This starts the electron app.

Running back-end:

```sh
cd backend
pip install -r requirements.txt
python run.py
```

This runs the flask server. You will require a `.env` file to setup auth0, firebase, and GenAI.
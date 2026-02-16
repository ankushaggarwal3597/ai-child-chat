# Picture Talk

Picture Talk is a real-time voice interaction application where a child can have a natural 1-minute conversation with an AI about an image. The AI asks questions, listens to spoken responses, and adapts its replies based on the conversation.

The project demonstrates image-context conversation, speech input/output, and live LLM interaction.

---

## Features

- Image-driven AI conversation
- Real-time speech recognition and text-to-speech
- 60-second structured interaction session
- Dynamic AI responses based on image context
- UI feedback triggered by AI output
- Continuous conversational loop

---

## How It Works

1. An image is displayed on screen
2. The AI introduces the image and asks a question
3. The user responds using voice
4. Speech is transcribed in the browser
5. The transcript is sent to the backend LLM
6. The AI generates a contextual reply
7. The reply is spoken out loud
8. The loop continues until the timer ends

The AI receives conversation history on each turn so the dialogue remains contextual and unscripted.

---

## Quick Start

Install dependencies:

```bash
npm install
```

Start backend server:

```bash
node index.js
```

Start frontend:

```bash
npm run dev
```

Open the URL shown in the terminal (typically http://localhost:5173).

---

## Requirements

- Node.js 16 or higher
- Chrome or Edge browser
- Microphone access enabled

---

## Using the App

1. Select an image
2. Click Start Conversation
3. Wait for the AI to speak
4. Respond when listening begins
5. Continue until the session ends

The conversation runs automatically without additional user controls.

---

## Changing Images

Images are paired with descriptions in the backend.

To add a new image:

1. Place the image inside `src/`
2. Add a matching description in `index.js`
3. Register the image in `App.jsx`

The AI only understands what is written in the description.

---

## API Key

Create a `.env` file in the root directory:

```
GROQ_API_KEY=your_key_here
```

Never commit API keys to public repositories.

---

## Project Structure

```
src/
  App.jsx
  App.css
  image assets

index.js
package.json
README.md
```

---

## Customization

- Change session duration by editing the timer in `App.jsx`
- Modify AI behavior through the system prompt in `index.js`
- Swap the LLM model by changing the Groq model name
- Adjust speech settings in the speech synthesis function

---

## Common Issues

No audio  
Check browser volume and mute settings.

Microphone not working  
Allow permission and refresh the page.

AI asks unrelated questions  
Update the image description for accuracy.

Conversation feels unnatural  
Refine the backend prompt.

---

## Technical Stack

- React
- Web Speech API
- Express.js
- Groq LLM API

---

## License

Open for educational and demonstration use.

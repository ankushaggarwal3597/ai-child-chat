import { useState, useEffect, useRef } from "react"
import Confetti from "react-confetti"
import img from "./image.jpg"
import "./App.css"

function App() {
  const [star, setStar] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [conversationStarted, setConversationStarted] = useState(false)
  const [transcript, setTranscript] = useState([])
  const [countdown, setCountdown] = useState(60)
  const [isInitializing, setIsInitializing] = useState(false)
  
  const recognitionRef = useRef(null)
  const timerRef = useRef(null)
  const isListeningRef = useRef(false)
  const conversationStartedRef = useRef(false)
  const countdownRef = useRef(60)
  const isEndingRef = useRef(false)

  useEffect(() => {
    conversationStartedRef.current = conversationStarted
  }, [conversationStarted])

  useEffect(() => {
    countdownRef.current = countdown
  }, [countdown])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Sorry, your browser doesn't support speech recognition. Please use Chrome or Edge.")
      return
    }
    
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.lang = "en-US"
    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = false

    recognitionRef.current.onstart = () => {
      isListeningRef.current = true
      setIsListening(true)
    }

    recognitionRef.current.onresult = (event) => {
      const text = event.results[0][0].transcript
      isListeningRef.current = false
      setIsListening(false)
      addToTranscript("Child", text)
      sendToAI(text)
    }

    recognitionRef.current.onerror = (event) => {
      isListeningRef.current = false
      setIsListening(false)
      
      if (event.error === 'no-speech' && countdownRef.current > 0 && !isEndingRef.current) {
        setTimeout(() => startListening(), 1000)
      } else if (event.error === 'audio-capture') {
        alert("Please allow microphone access to continue the conversation.")
      }
    }

    recognitionRef.current.onend = () => {
      isListeningRef.current = false
      setIsListening(false)
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {}
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      window.speechSynthesis.cancel()
    }
  }, [])

  useEffect(() => {
    if (conversationStarted && countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          const newCountdown = prev - 1
          
          if (newCountdown === 0 && !isEndingRef.current) {
            setTimeout(() => endConversation(), 500)
          }
          
          return newCountdown
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [conversationStarted, countdown])

  function addToTranscript(speaker, text) {
    setTranscript(prev => [...prev, { speaker, text, time: new Date() }])
  }

  function speak(text) {
    return new Promise((resolve) => {
      setIsAISpeaking(true)
      
      const utter = new SpeechSynthesisUtterance(text)
      utter.rate = 0.9
      utter.pitch = 1.2
      utter.volume = 1
      utter.lang = 'en-US'
      
      utter.onend = () => {
        setIsAISpeaking(false)
        resolve()
      }

      utter.onerror = () => {
        setIsAISpeaking(false)
        resolve()
      }
      
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0]
        utter.voice = englishVoice
      }
      
      window.speechSynthesis.speak(utter)
    })
  }

  async function sendToAI(text) {
    if (isEndingRef.current) return

    try {
      const res = await fetch("https://ai-child-chat.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: text, 
          conversationHistory: transcript,
          sessionId: "user-123"
        })
      })

      const data = await res.json()
      
      if (isEndingRef.current) return
      
      addToTranscript("AI", data.reply)

      if (data.showStar) {
        setStar(true)
        setTimeout(() => setStar(false), 3000)
      }

      await speak(data.reply)
      
      if (countdownRef.current > 0 && !isEndingRef.current) {
        setTimeout(() => startListening(), 1000)
      }
    } catch (error) {
      if (!isEndingRef.current && countdownRef.current > 0) {
        await speak("Oops, I didn't catch that. Can you say it again?")
        setTimeout(() => startListening(), 1000)
      }
    }
  }

  function startListening() {
    if (isListeningRef.current) return
    if (isEndingRef.current) return
    if (!conversationStartedRef.current || countdownRef.current <= 0) return
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.start()
    } catch (error) {
      if (error.message && error.message.includes('already started')) {
        isListeningRef.current = true
        setIsListening(true)
      } else if (!isEndingRef.current && countdownRef.current > 0) {
        setTimeout(() => startListening(), 500)
      }
    }
  }

  async function startConversation() {
    if (isInitializing || conversationStarted) return
    
    setIsInitializing(true)
    isEndingRef.current = false
    
    window.speechSynthesis.cancel()
    
    if (window.speechSynthesis.getVoices().length === 0) {
      await new Promise((resolve) => {
        window.speechSynthesis.onvoiceschanged = resolve
        setTimeout(resolve, 1000)
      })
    }
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    setConversationStarted(true)
    conversationStartedRef.current = true
    setCountdown(60)
    countdownRef.current = 60
    setIsInitializing(false)
    
    const greeting = "Hello! Wow, look at this beautiful sunset! What do you see in the picture?"
    addToTranscript("AI", greeting)
    
    await speak(greeting)
    
    setTimeout(() => {
      startListening()
    }, 1000)
  }

  async function endConversation() {
    if (isEndingRef.current) return
    
    isEndingRef.current = true
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    if (isListeningRef.current && recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        isListeningRef.current = false
        setIsListening(false)
      } catch (e) {}
    }
    
    window.speechSynthesis.cancel()
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const farewell = "You did an amazing job talking with me! See you next time!"
    addToTranscript("AI", farewell)
    setStar(true)
    
    await speak(farewell)
    
    setTimeout(() => {
      setStar(false)
      setConversationStarted(false)
      conversationStartedRef.current = false
      setCountdown(60)
      countdownRef.current = 60
      setTranscript([])
      isEndingRef.current = false
    }, 4000)
  }

  return (
    <div className="app-container">
      {star && <Confetti numberOfPieces={300} recycle={false} />}

      <div className="header">
        <h1>AI Picture Talk</h1>

        {conversationStarted && countdown > 0 && (
          <div className="timer">
            {countdown}s
          </div>
        )}
      </div>

      <div className="main-content">
        <div className="glass-card image-section">
          <div className="image-container">
            <img
              src={img}
              alt="AI conversation subject"
              className={isAISpeaking ? "image-pulse" : ""}
            />
            {star && <div className="star-overlay">⭐</div>}
          </div>
        </div>

        <div className="glass-card interaction-section">
          {isInitializing && (
            <div className="status">Initializing...</div>
          )}

          {isAISpeaking && !isInitializing && (
            <div className="status">AI is speaking...</div>
          )}

          {isListening && (
            <div className="status">Listening to you...</div>
          )}

          {!isAISpeaking && !isListening && !isInitializing &&
            conversationStarted && countdown > 0 && (
              <div className="status">Processing...</div>
          )}

          {!conversationStarted && !isInitializing && (
            <>
              <p style={{
                textAlign: "center",
                color: "#c4b5fd",
                fontSize: "1.2rem",
                lineHeight: "1.6"
              }}>
                Click the button below to start a 60-second
                voice conversation about the image
              </p>

              <button className="start-button" onClick={startConversation}>
                Start Conversation
              </button>
            </>
          )}

          {transcript.length > 0 && (
            <div className="transcript">
              {transcript.slice(-4).map((entry, idx) => (
                <div key={idx} className={`message ${entry.speaker.toLowerCase()}`}>
                  <strong>{entry.speaker}</strong>
                  {entry.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App

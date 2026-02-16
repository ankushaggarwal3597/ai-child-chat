import dotenv from "dotenv"
dotenv.config()

import express from "express"
import cors from "cors"
import Groq from "groq-sdk"

const app = express()
app.use(cors())
app.use(express.json())

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

const IMAGE_DESCRIPTION = `
A sunset over the ocean. The sun is bright orange-gold at the horizon. The sky has orange, 
pink, and purple clouds. The sun's light makes a golden path on the water. The ocean is calm 
with small waves. That's it - no animals, no boats, no people, no buildings. Just sky, sun, 
water, and clouds.
`

app.post("/chat", async (req, res) => {
  try {
    const { message, conversationHistory = [], sessionId = "default" } = req.body

    const childTurns = conversationHistory.filter(e => e.speaker === "Child").length
    const isFirstResponse = childTurns === 0
    const isSecondResponse = childTurns === 1
    const isThirdResponse = childTurns === 2
    const isFourthResponse = childTurns === 3
    const shouldWrapUp = childTurns >= 4

    let systemPrompt = `You're talking to a young child about a sunset picture.

WHAT'S IN THE IMAGE:
${IMAGE_DESCRIPTION}

WHAT'S NOT IN THE IMAGE:
No animals, no birds, no fish, no boats, no people, no buildings, no trees, no sand castles.

YOUR JOB:
- Keep answers under 20 words
- Ask about things actually visible: sun, sky colors, clouds, water, waves, reflections
- React to what the child says
- Be warm and encouraging

CONVERSATION STAGE:`

    if (isFirstResponse) {
      systemPrompt += `
First response - they just spoke:
- React to what they said with excitement
- Ask about the sun, sky colors, or water
- Example: "Yes! What colors do you see in the sky?"`

    } else if (isSecondResponse) {
      systemPrompt += `
Second response:
- Acknowledge their color choice
- Point out the golden light path on water OR the colorful clouds
- Example: "Pretty! See how the sun makes the water glow? What does it look like?"`

    } else if (isThirdResponse) {
      systemPrompt += `
Third response:
- Praise their observation
- Ask what sounds they'd hear, or what the water/sky feels like
- Example: "Great answer! If you were there, what sounds would you hear?"`

    } else if (isFourthResponse) {
      systemPrompt += `
Fourth response - start wrapping up:
- React positively
- Ask one last question about the peaceful feeling or what they'd do there
- Use words like "amazing" or "wonderful"`

    } else if (shouldWrapUp) {
      systemPrompt += `
Final response:
- Big praise for all they noticed
- Mention the colors/sun/water they talked about
- Use: "amazing", "wonderful", "fantastic", or "incredible"`

    } else {
      systemPrompt += `
Middle of conversation:
- Build on what they said
- Ask about clouds, waves, reflections, or how the scene makes them feel`
    }

    systemPrompt += `

CRITICAL RULES:
- If child mentions something not in the image (animals, boats, etc), gently redirect: "I don't see that, but I do see the colorful sky! What colors do you notice?"
- Stay focused on: sun, sky, clouds, water, waves, golden reflection, colors, feelings
- Never make up details not listed in the image description
- Keep it short and natural`

    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ]

    const recentHistory = conversationHistory.slice(-6)
    recentHistory.forEach(entry => {
      messages.push({
        role: entry.speaker === "AI" ? "assistant" : "user",
        content: entry.text
      })
    })

    messages.push({
      role: "user",
      content: message
    })

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: messages,
      temperature: 0.75,
      max_tokens: 60,
    })

    let reply = completion.choices[0].message.content

    const shouldCelebrate = 
      reply.toLowerCase().includes("amazing") ||
      reply.toLowerCase().includes("wonderful") ||
      reply.toLowerCase().includes("fantastic") ||
      reply.toLowerCase().includes("incredible") ||
      shouldWrapUp

    reply = reply.replace(/CELEBRATE/gi, "").trim()

    res.json({ 
      reply,
      showStar: shouldCelebrate,
      turnCount: childTurns,
      isEnding: shouldWrapUp
    })

  } catch (err) {
    res.status(500).json({ 
      reply: "Oops! Can you say that again?",
      showStar: false 
    })
  }
})

app.post("/reset", (req, res) => {
  res.json({ success: true })
})

app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString()
  })
})

app.listen(3001, () => {
  console.log("Server running on port 3001")
})
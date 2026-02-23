// index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// POST route
app.post('/', async (req, res) => {
  let { gender, country } = req.body;

  if (!gender || !country) {
    return res.status(400).json({ error: 'Missing gender or country' });
  }

  // Ensure country is always an array
  if (!Array.isArray(country)) {
    country = [country];
  }

  try {
    const countryList = country.join(', ');

    const prompt = `
You are a baby name expert.

Generate exactly 20 unique baby names based on the criteria below.

Context:
- The baby’s gender is ${gender} (boy, girl, or neutral)
- The baby will live in the following countries: ${countryList}, so names should work well in those cultural contexts
- Names should be familiar, pronounceable, and appropriate for modern use
- Avoid joke names, novelty spellings, or near-duplicates (e.g., Aiden/Ayden)

For each name, provide exactly:
- name: the first name only
- origin: the cultural or linguistic origin (e.g., Hebrew, Latin, Irish)
- meaning: a brief meaning of the name (one sentence max)
- popularity: one of "Very Popular", "Popular", "Rising", "Uncommon", "Rare"

Return ONLY a JSON array of 20 objects with exactly the fields above. No markdown, no backticks, no explanations.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    // Parse JSON safely
    let names;
    try {
      names = JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      return res.status(500).json({
        error: 'Invalid JSON from OpenAI',
        details: completion.choices[0].message.content
      });
    }

    res.json(names);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong', details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());

// Membaca konten teks dari file PDF
const readPdfContent = async (pdfPath) => {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

// Mengirim permintaan untuk menghasilkan konten
const generateContent = async (apiKey, prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey
  };
  const data = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data)
  });

  if (response.ok) {
    return await response.json();
  } else {
    console.error(`Error ${response.status}: ${response.statusText}`);
    return null;
  }
};

// Function to format API response and extract "text" field
const extractText = (response) => {
  return response.candidates[0].content.parts[0].text;
};

// Membuat prompt berdasarkan input pengguna dan konten PDF
const generatePrompt = (gender, age, weight, height, headCircumference, weightAgeGender, heightAgeGender, headCircumferenceAgeGender, weightHeight, pdfContent) => {
  return (
    `Saya seorang dokter anak, menganalisis seorang anak ${gender}, ` +
    `usia ${age} bulan, dengan berat ${weight} kg, tinggi ${height} cm, dan lingkar kepala ${headCircumference} cm. ` +
    `Analisis model pembelajaran mesin berdasarkan data WHO menunjukkan bahwa hasil analisis ` +
    `Berat Badan/Usia&Jenis Kelamin adalah ${weightAgeGender}, analisis Tinggi Badan/Usia&Jenis Kelamin adalah ${heightAgeGender}, ` +
    `analisis Lingkar Kepala/Usia&Jenis Kelamin adalah ${headCircumferenceAgeGender}, dan analisis Berat Badan/Tinggi Badan adalah ${weightHeight}. ` +
    `Informasi tambahan dari PDF:\n\n${pdfContent}\n\n` +
    `Bagaimana kondisi anak ini mengenai norma berat badan, tinggi badan, dan lingkar kepala berdasarkan jenis kelamin? ` +
    `Apa rekomendasi nutrisi dan jenis makanan yang Anda sarankan dalam situasi ini?` +
    ` Berikan jawaban Anda dalam bahasa Indonesia.`
  );
};

// Membuat prompt ringkasan berdasarkan konten
const generateSummaryPrompt = (content) => {
  return (
    `Silakan ringkas dan sederhanakan konten berikut agar lebih mudah dipahami:\n\n${content}\n\n` +
    `Berikan ringkasan dalam bahasa yang jelas dan singkat dalam bahasa Indonesia.`
  );
};

app.post('/analyze', async (req, res) => {
  const { gender, age, weight, height, headCircumference, weightAgeGender, heightAgeGender, headCircumferenceAgeGender, weightHeight } = req.body;
  const apiKey = "AIzaSyCysvet8wiINcIQcdnagnb8t7MqjDMe3Fw";  // Replace with your actual API key
  const pdfPath = path.resolve(__dirname, 'source_tambahan.pdf');  // source_tambahan

  try {
    // Read PDF content
    const pdfContent = await readPdfContent(pdfPath);

    // Generate prompt based on user input and PDF content
    const prompt = generatePrompt(gender, age, weight, height, headCircumference, weightAgeGender, heightAgeGender, headCircumferenceAgeGender, weightHeight, pdfContent);

    // Generate content using the prompt
    const initialResponse = await generateContent(apiKey, prompt);
    if (!initialResponse) {
      throw new Error("Failed to generate initial content");
    }

    // Extract "text" field from initial response
    const initialText = extractText(initialResponse);

    // Generate summary prompt based on initial response content
    const summaryPrompt = generateSummaryPrompt(initialText);

    // Generate summary content using the summary prompt
    const summaryResponse = await generateContent(apiKey, summaryPrompt);
    if (!summaryResponse) {
      throw new Error("Failed to generate summary content");
    }

    // Extract "text" field from summary response
    const summaryText = extractText(summaryResponse);

    // Return the extracted text
    res.status(200).json({ summaryText });
  } catch (error) {
    console.error(`Error reading PDF file or interacting with API: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

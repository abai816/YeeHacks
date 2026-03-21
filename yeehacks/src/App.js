import { useState } from 'react';
import './App.css';

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState(null);

  const getGeminiIdeas = async (trashClass) => {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAll2mmlTOmWKcN725Z1JKdB5Skj0CjgrI", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `I found a "${trashClass}" in the trash. Create a fun lesson plan for ONE of these themes (pick the most creative fit): a craft project, a science experiment, or a wild west themed activity. Include: title, materials needed, and 3-5 steps.`
          }]
        }]
      })
    });

    const data = await response.json();
    console.log("Gemini response:", JSON.stringify(data));
    return data.candidates[0].content.parts[0].text;
  };

  const detectTrash = async (imageFile) => {
    setLoading(true);
    setResult(null);
    setLessonPlan(null);

    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch("https://florance-blousiest-deetta.ngrok-free.dev/detect", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setResult(data);

    const lessonPlan = await getGeminiIdeas(data.class);
    setLessonPlan(lessonPlan);
    setLoading(false);
  };

  return (
    <div className="App">
      <h1>Trash Detector</h1>
      <input type="file" onChange={(e) => detectTrash(e.target.files[0])} />
      {loading && <p>Detecting...</p>}
      {result && (
        <div>
          <p>Detected: {result.class}</p>
          <p>Confidence: {result.confidence}%</p>
        </div>
      )}
      {lessonPlan && (
        <div>
          <h2>Lesson Plan</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{lessonPlan}</p>
        </div>
      )}
    </div>
  );
}

export default App;
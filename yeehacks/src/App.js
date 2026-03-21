import { useState } from "react";
import "./App.css";
import logo from "./tumbleweed.png";

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState(null);

  const getGeminiIdeas = async (trashClass) => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
   
    if (!apiKey) {
      throw new Error("Missing Gemini API key. Add REACT_APP_GEMINI_API_KEY to your .env file.");
    }

    const prompt = `
A student found a discarded ${trashClass}.

Create a fun lesson plan based on ONE of these themes:
- science
- DIY craft
- history

Pick the theme that best fits the object.

Include:
- a title
- the chosen theme
- a short explanation of what the object is
- why reusing or recycling it matters
- materials needed
- 3 to 5 steps
- one fun fact

Format clearly with labels.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    console.log("Gemini raw response:", data);

    if (!response.ok) {
      throw new Error(data?.error?.message || "Gemini request failed");
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Gemini returned no lesson plan text");
    }

    return text;
  };

  const detectTrash = async (imageFile) => {
    setLoading(true);
    setResult(null);
    setLessonPlan(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await fetch(
        "https://florance-blousiest-deetta.ngrok-free.dev/detect",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      console.log("Detection response:", data);

      if (!response.ok) {
        throw new Error(data?.error || "Detection failed");
      }

      if (!data?.class) {
        throw new Error("Detector did not return an object class");
      }

      setResult(data);

      const generatedLessonPlan = await getGeminiIdeas(data.class);
      setLessonPlan(generatedLessonPlan);
    } catch (error) {
      console.error("App error:", error);
      setLessonPlan(`Lesson plan error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Trash Detector</h1>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            detectTrash(file);
          }
        }}
      />

      {/* Loading overlay with rotating image */}
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Loading..." className="spinner" />
          <p>Howdy!</p>
        </div>
      )}
 
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
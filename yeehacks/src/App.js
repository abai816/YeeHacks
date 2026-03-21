import { useState } from "react";
import "./App.css";
import bootImg from './assets/boot.png';
import cactusImg from './assets/cactus.png';
import cloudImg from './assets/cloud.png';
import cowboyHatImg from './assets/cowboy_hat.png';
import fatHorseImg from './assets/fat_horse.png';
import flowerImg from './assets/flower.png';
import lassoImg from './assets/lasso.png';
import lizardImg from './assets/lizard.png';
import sheriffStarImg from './assets/sherriff_star.png';
import skinnyHorseImg from './assets/skinny_horse.png';
import sunImg from './assets/sun.png';
import tumbleweedImg from './assets/tumbleweed.png';
import tumbleweedShadowImg from './assets/tumbleweed_shadow.png';

function App() {
  const [page, setPage] = useState("home");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [lessonPlan, setLessonPlan] = useState("");
  const [lessonType, setLessonType] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const detectTrash = async () => {
    if (!selectedFile) {
      setError("Please upload an image first.");
      return;
    }

    setDetecting(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

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
        throw new Error("No detected object returned.");
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong during detection.");
    } finally {
      setDetecting(false);
    }
  };

  const getGeminiIdeas = async (trashClass, chosenType) => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Missing Gemini API key. Add REACT_APP_GEMINI_API_KEY to your .env file."
      );
    }

    const themeMap = {
      diy: "DIY craft project",
      science: "science lesson",
      history: "history lesson",
    };

    const prompt = `
A student found a discarded ${trashClass}.

Create a ${themeMap[chosenType]} about this object.

Requirements:
- Match the lesson specifically to a ${chosenType} theme
- Give it a creative title
- Briefly explain what the object is
- Explain why reusing or recycling it matters
- List materials needed
- Provide 3 to 5 clear steps
- Include one fun fact
- Keep the tone fun, kid-friendly, and educational

Format exactly like this:

Title:
Theme:
About the object:
Why it matters:
Materials:
Steps:
Fun fact:
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
      throw new Error("Gemini returned no lesson text.");
    }

    return text;
  };

  const handleGenerateLesson = async (type) => {
    if (!result?.class) {
      setError("Please detect an object first.");
      return;
    }

    setGenerating(true);
    setError("");
    setLessonPlan("");
    setLessonType(type);

    try {
      const generatedLesson = await getGeminiIdeas(result.class, type);
      setLessonPlan(generatedLesson);
      setPage("lesson");
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong while generating the lesson.");
    } finally {
      setGenerating(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResult(null);
    setLessonPlan("");
    setError("");
  };

  const lessonHeadingMap = {
    diy: "DIY Project",
    science: "Science Lesson",
    history: "History Lesson",
  };

  if (page === "lesson") {
    return (
      <div className="app page-bg">
        <img src={bootImg} alt="" className="decor boot" />
        <div className="decor star star-one">✸</div>
        <img src={flowerImg} alt="" className="decor flower" />
        <img src={fatHorseImg} alt="" className="decor horse" />

        <div className="lesson-page">
          <h1 className="title">Wild Lessons</h1>
          <p className="subtitle">
            Your recyclable has been transformed into a learning adventure.
          </p>

          <div className="lesson-card">
            <div className="lesson-top">
              <span className="detected-pill">
                Detected: {result?.class || "Unknown object"}
              </span>
              <span className="lesson-type-pill">
                {lessonHeadingMap[lessonType]}
              </span>
            </div>

            <h2 className="lesson-title">{lessonHeadingMap[lessonType]}</h2>

            <div className="lesson-output">
              {lessonPlan || "No lesson generated yet."}
            </div>

            <div className="lesson-actions">
              <button className="secondary-btn" onClick={() => setPage("home")}>
                Back
              </button>
              <button
                className="primary-btn"
                onClick={() => handleGenerateLesson(lessonType)}
                disabled={generating}
              >
                {generating ? "Regenerating..." : "Regenerate"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app page-bg">
      <img src={bootImg} alt="" className="decor boot" />
      <img src={lassoImg} alt="" className="decor rope" />
      <div className="decor star star-one">✸</div>
      <div className="decor star star-two">✸</div>
      <img src={cactusImg} alt="" className="decor cactus" />
      <img src={flowerImg} alt="" className="decor flower" />
      <img src={skinnyHorseImg} alt="" className="decor horse" />
      <img src={cowboyHatImg} alt="" className="decor hat" />

      <div className="home-page">
        <h1 className="title">Wild Lessons</h1>
        <p className="subtitle">
          Upload an image of your recyclable to generate a response on how you
          can re-purpose your object!
        </p>

        <div className="main-layout">
          <div className="image-box">
            {imagePreview ? (
              <img src={imagePreview} alt="Uploaded recyclable" className="preview-image" />
            ) : (
              <span className="image-placeholder">(image)</span>
            )}
          </div>

          <div className="controls-column">
            <label className="upload-btn">
              Upload Image
              <input type="file" accept="image/*" onChange={handleFileChange} hidden />
            </label>

            <button
              className="detect-btn"
              onClick={detectTrash}
              disabled={detecting || !selectedFile}
            >
              {detecting ? "Detecting..." : "Detect Image"}
            </button>

            <div className="detected-box">
              {result?.class ? result.class : "No object detected yet"}
            </div>
          </div>
        </div>

        {result && (
          <div className="confidence-text">Confidence: {result.confidence}%</div>
        )}

        {error && <div className="error-text">{error}</div>}

        <div className="lesson-buttons">
          <button
            className="lesson-btn"
            onClick={() => handleGenerateLesson("diy")}
            disabled={!result || generating}
          >
            {generating && lessonType === "diy"
              ? "Generating..."
              : "Generate DIY Project"}
          </button>

          <button
            className="lesson-btn"
            onClick={() => handleGenerateLesson("science")}
            disabled={!result || generating}
          >
            {generating && lessonType === "science"
              ? "Generating..."
              : "Generate Science Lesson"}
          </button>

          <button
            className="lesson-btn"
            onClick={() => handleGenerateLesson("history")}
            disabled={!result || generating}
          >
            {generating && lessonType === "history"
              ? "Generating..."
              : "Generate History Lesson"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
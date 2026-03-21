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
import pairBootsImg from './assets/boots_pair.png';

function App() {
  const [page, setPage] = useState("home");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [lessonPlan, setLessonPlan] = useState("");
  const [parsedLesson, setParsedLesson] = useState("");
  const [lessonType, setLessonType] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const lessonHeadingMap = {
    diy: "DIY Project",
    science: "Science Lesson",
    history: "History Lesson",
  };

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

  const parseLessonPlan = (text) => {
    const parsed = {
      pageTitle: "",
      theme: "",
      about: "",
      whyItMatters: "",
      materials: [],
      steps: [],
      funFact: "",
    };

    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    let currentSection = "";

    for (const line of lines){
      if (line.startsWith("PAGE_TITLE:")) {
        parsed.pageTitle = line.replace("PAGE_TITLE:", "").trim();
        currentSection = "";
      } else if (line.startsWith("THEME:")) {
        parsed.theme = line.replace("THEME:", "").trim();
        currentSection = "";
      } else if (line.startsWith("ABOUT:")) {
        parsed.about = line.replace("ABOUT:", "").trim();
        currentSection = "";
      } else if (line.startsWith("WHY_IT_MATTERS:")) {
        parsed.whyItMatters = line.replace("WHY_IT_MATTERS:", "").trim();
        currentSection = "";
      } else if (line.startsWith("MATERIALS:")) {
        currentSection = "materials";
      } else if (line.startsWith("STEPS:")) {
        currentSection = "steps";
      } else if (line.startsWith("FUN_FACT:")) {
        parsed.funFact = line.replace("FUN_FACT:", "").trim();
        currentSection = "";
      } else if (currentSection === "materials" && line.startsWith("-")) {
        parsed.materials.push(line.replace("-", "").trim());
      } else if (currentSection === "steps" && /^\d+\./.test(line)) {
        parsed.steps.push(line.replace(/^\d+\.\s*/, "").trim());
      } else if (currentSection === "about") {
        parsed.about += ` ${line}`;
      } else if (currentSection === "why") {
        parsed.whyItMatters += ` ${line}`;
      }
    }

    return parsed;

  }

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

Important formatting rules:
- Do NOT use markdown
- Do NOT use asterisks
- Do NOT bold anything
- Write in plain text only
- Put each section on its own line
- Use this exact format:

PAGE_TITLE: creative title (e.g. “Hanging Bird Feeder – Upcycling for Greener Garden”)
THEME: a short theme label
ABOUT: 2 to 4 sentences explaining the object
WHY_IT_MATTERS: 2 to 4 sentences
MATERIALS:
- item 1
- item 2
- item 3
STEPS:
1. first step
2. second step
3. third step
FUN_FACT: one short fun fact

Rules:
- Keep it kid-friendly and educational
- Make the theme creative and short
- If the chosen type is diy, follow the above steps exactly and for steps, in the first start with: To create a ___, start by...
- If the chosen type is science lesson, in why it matters, talk about materials needed for the experiment, and in steps talk about a science experiment to do (on the first step, start with: to do an experiment with this material, start by...)
- If the chosen type is history lesson, in about, talk about when it was invented, by who, and why, and in materials, talk about what it is made out of, and in steps, talk about how you can responsible reuse or recycle it (on the first step, start with: To recycle this, ...)
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
    setParsedLesson(null);
    setLessonType(type);

    try {
      const generatedLesson = await getGeminiIdeas(result.class, type);
      const parsed = parseLessonPlan(generatedLesson);

      setLessonPlan(generatedLesson);
      setParsedLesson(parsed);
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
    setParsedLesson(null);
    setError("");
  };
 if (page === "lesson") {
    return (
      <div className="app page-bg">
        {generating && (
          <div className="tumbleweed-overlay">
            <img src={tumbleweedImg} alt="Loading..." className="tumbleweed-spinner" />
            <p>Creating lesson plan...</p>
          </div>
        )}
        <img src={lassoImg} alt="" className="decor rope" />
        <div className="decor star star-one">✸</div>
        <div className="decor star star-two">✸</div>
        <img src={cactusImg} alt="" className="decor cactus" />
        <img src={flowerImg} alt="" className="decor flower" />
        <img src={skinnyHorseImg} alt="" className="decor horse" />
        <img src={cowboyHatImg} alt="" className="hat" />
        <img src={sunImg} alt="" className="decor sun" />
        <img src={cloudImg} alt="" className="decor cloud" />
        <img src={lizardImg} alt="" className="decor lizard" />
        <img src={tumbleweedShadowImg} alt="" className="decor shadow" />
        <img src={pairBootsImg} alt="" className="decor pairboots" />

        <div className="lesson-page">
          <h1 className="title">Wild Lessons</h1>
          <p className="subtitle">
            Your recyclable has been transformed into a learning adventure!
          </p>

          <div className="lesson-card">
            <div className="lesson-top">
              <span className="detected-pill">
                Detected: {result?.class || "Unknown object"}
              </span>
              <span className="lesson-type-pill">
                {parsedLesson?.theme || lessonHeadingMap[lessonType]}
              </span>
            </div>

            <h2 className="lesson-title">
              {parsedLesson?.pageTitle || lessonHeadingMap[lessonType]}
            </h2>

            <div className="lesson-output">
              <p>
                <span className="section-label">About the object:</span>{" "}
                {parsedLesson?.about || ""}
              </p>

              <p>
                <span className="section-label">Why it matters:</span>{" "}
                {parsedLesson?.whyItMatters || ""}
              </p>

              <div className="lesson-section">
                <div className="section-label">Materials:</div>
                <ul className="lesson-list">
                  {(parsedLesson?.materials || []).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="lesson-section">
                <div className="section-label">Steps:</div>
                <ol className="lesson-list lesson-steps">
                  {(parsedLesson?.steps || []).map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>

              <p>
                <span className="section-label">Fun fact:</span>{" "}
                {parsedLesson?.funFact || ""}
              </p>
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
      {generating && (
        <div className="tumbleweed-overlay">
          <img src={tumbleweedImg} alt="Loading..." className="tumbleweed-spinner" />
          <p>Creating lesson plan…</p>
        </div>
      )}
      <img src={lassoImg} alt="" className="decor rope" />
      <div className="decor star star-one">✸</div>
      <div className="decor star star-two">✸</div>
      <img src={cactusImg} alt="" className="decor cactus" />
      <img src={flowerImg} alt="" className="decor flower" />
      <img src={skinnyHorseImg} alt="" className="decor horse" />
      <img src={cowboyHatImg} alt="" className="hat" />
      <img src={sunImg} alt="" className="decor sun" />
      <img src={cloudImg} alt="" className="decor cloud" />
      <img src={lizardImg} alt="" className="decor lizard" />
      <img src={tumbleweedShadowImg} alt="" className="decor shadow" />
      <img src={pairBootsImg} alt="" className="decor pairboots" />

      <div className="home-page">
        <h1 className="title">Wild Lessons</h1>
        <p className="subtitle">
          Upload an image of your recyclable to generate a response on how you
          can re-purpose your object!
        </p>

        <div className="main-layout">
          <div className="image-box">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Uploaded recyclable"
                className="preview-image"
              />
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
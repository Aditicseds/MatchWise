import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/analyze';

function extractAnalysis(raw) {
  try {
    const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n') || raw;
    return String(text).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  } catch {
    return String(raw || '').trim();
  }
}

function scoreFromText(text) {
  const value = text.match(/(?:ATS\s*(?:match\s*)?score|match\s*score|score)\s*(?:of|:|is)?\s*(\d{1,3})/i)?.[1];
  return value ? Math.min(100, Number(value)) : null;
}

function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState('');

  const score = useMemo(() => scoreFromText(analysis), [analysis]);
  const canAnalyze = file && jobDescription.trim().length > 20 && !isLoading;

  const chooseFile = (candidate) => {
    if (!candidate) return;
    if (candidate.type !== 'application/pdf' && !candidate.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF resume.');
      return;
    }
    setFile(candidate);
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!canAnalyze) return;
    setIsLoading(true); setError(''); setAnalysis('');
    const data = new FormData();
    data.append('resume', file);
    data.append('jobDescription', jobDescription.trim());
    try {
      const response = await fetch(API_URL, { method: 'POST', body: data });
      const responseText = await response.text();
      if (!response.ok) throw new Error(responseText || `Request failed (${response.status})`);
      setAnalysis(extractAnalysis(responseText));
    } catch (err) {
      setError(err.message.includes('Failed to fetch')
        ? 'Could not reach the backend. Start Spring Boot on port 8080 or set VITE_API_URL.'
        : err.message);
    } finally { setIsLoading(false); }
  };

  return <main className="page-shell">
    <nav className="nav"><a className="brand" href="#top"><span className="brand-mark">M</span>matchwise</a><span className="nav-note">AI-powered career clarity</span></nav>
    <section className="hero" id="top">
      <p className="eyebrow">Resume intelligence, made human</p>
      <h1>Make every application<br/><em>count.</em></h1>
      <p className="hero-copy">See how well your experience speaks to a role — and get concrete, tailored ways to make it stronger.</p>
      <div className="proof"><span>✦ ATS-aware analysis</span><span>✦ Tailored feedback</span><span>✦ Private by design</span></div>
    </section>

    <section className="workspace" aria-label="Resume analysis form">
      <form onSubmit={submit} className="analyzer-card">
        <div className="step-heading"><span>01</span><div><h2>Your resume</h2><p>We’ll read your PDF and compare it to the role.</p></div></div>
        <label className={`dropzone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); chooseFile(e.dataTransfer.files?.[0]); }}>
          <input type="file" accept="application/pdf,.pdf" onChange={(e) => chooseFile(e.target.files?.[0])} />
          <span className="upload-icon">{file ? '✓' : '↑'}</span>
          <span><strong>{file ? file.name : 'Drop your resume here'}</strong><small>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · PDF ready` : 'or browse files · PDF only'}</small></span>
          {file && <button type="button" className="remove-file" onClick={(e) => { e.preventDefault(); setFile(null); }}>Remove</button>}
        </label>

        <div className="step-heading second"><span>02</span><div><h2>The role you want</h2><p>Paste the job description below.</p></div><span className="word-count">{jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0} words</span></div>
        <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the complete job description here — responsibilities, requirements, and preferred qualifications all help..." />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="analyze-button" disabled={!canAnalyze}>{isLoading ? <><i className="spinner"/> Reading your story...</> : <>Analyze my match <b>→</b></>}</button>
        <p className="privacy">Your files are sent only for this analysis and are never stored by this app.</p>
      </form>

      <aside className="insight-card">
        <div className="insight-top"><p className="eyebrow">Your insight report</p><span className="live-dot">LIVE</span></div>
        {isLoading ? <div className="loading-state"><div className="orb"></div><h3>Finding your strongest fit</h3><p>Comparing experience, skills, and language…</p></div>
          : analysis ? <div className="result-state">
            {score !== null && <div className="score"><svg viewBox="0 0 36 36"><path className="score-bg" d="M18 2.8a15.2 15.2 0 1 1 0 30.4a15.2 15.2 0 1 1 0-30.4"/><path className="score-bar" strokeDasharray={`${score}, 100`} d="M18 2.8a15.2 15.2 0 1 1 0 30.4a15.2 15.2 0 1 1 0-30.4"/></svg><strong>{score}<small>/100</small></strong></div>}
            <h3>{score !== null ? 'Your match analysis' : 'Your tailored analysis'}</h3><article className="analysis-text">{analysis}</article>
            <button type="button" className="new-analysis" onClick={() => setAnalysis('')}>Start a new analysis</button>
          </div>
          : <div className="empty-state"><div className="preview-score"><span>—</span><small>match score</small></div><h3>Your next best move,<br/>made clear.</h3><p>Upload your resume and add a job description to reveal your ATS match, missing keywords, and practical improvements.</p><div className="mini-lines"><i/><i/><i/></div></div>}
      </aside>
    </section>
    <footer>© 2026 Matchwise <span>Built for ambitious people.</span></footer>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Github, Linkedin, Mail, FileText, Pause, Play, Copy, Check, MapPin } from "lucide-react";
import MapExperience from "./MapExperience";
import ImperialCursor from './starwars/ImperialCursor';
import SecretMessage, { type SecretMode } from './SecretMessage';
import ProjectSection from './ProjectSection';
const VaderPortrait = lazy(() => import('./starwars/VaderPortrait'));
const email = "imranelakniti9@gmail.com";
const github = "https://github.com/imranelak1";
const linkedin = "https://www.linkedin.com/in/imrane-lakniti/";
const sections = ["About", "Projects", "Experience", "Education", "Stack", "Interests"];
export default function App() {
  const [active, setActive] = useState("about");
  const mapTrigger = useRef<HTMLElement | null>(null);
  const [exploring, setExploring] = useState(false);
  const [secret, setSecret] = useState<SecretMode>('closed');
  const [projectPreviewOpen, setProjectPreviewOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState("marrakech");
  const showPlace = useCallback((id: string) => { setSelectedPlace(id); }, []);
  const exploreMap = useCallback((open: boolean) => { if (open) mapTrigger.current = document.activeElement as HTMLElement; setExploring(open); }, []);
  const [paused, setPaused] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const pauseForPerformance = useCallback(() => setPaused(true), []);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPaused(media.matches);
    media.addEventListener("change", onChange);
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: "-10% 0px -65% 0px" });
    document.querySelectorAll("main section[id]").forEach(section => observer.observe(section));
    return () => { media.removeEventListener("change", onChange); observer.disconnect(); };
  }, []);
  useEffect(() => { if (!copied) return; const timer = setTimeout(() => setCopied(false), 2200); return () => clearTimeout(timer); }, [copied]);
  async function copyEmail() {
    try { await navigator.clipboard.writeText(email); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  }
  return <div>
    <ImperialCursor disabled={exploring || secret !== 'closed' || projectPreviewOpen} />
    <SecretMessage mode={secret} onChange={setSecret} disabled={exploring || projectPreviewOpen} />
    <MapExperience selected={selectedPlace} exploring={exploring} paused={paused || secret !== 'closed' || projectPreviewOpen} onExplore={exploreMap} returnFocus={mapTrigger.current} onSelect={setSelectedPlace} onPause={() => setPaused(!paused)} onPerformanceLimited={pauseForPerformance} />
    <a className="skip-link" href="#projects">Skip to projects</a>
    <div className={`portfolio ${exploring ? "map-is-open" : ""}`} inert={exploring}>
      <header className="sidebar">
        <div>
          <a href="#about" className="name-link"><h1 aria-label="Imrane Lakniti">Imrane<br />Lakniti</h1></a>
          <p className="role">Full-stack &amp; mobile developer</p>
          <p className="tagline">I build web and mobile applications, from business tools and APIs to apps that work with sensors and on-device ML.</p>
          <nav aria-label="Main navigation">{sections.map(label => <a key={label} href={`#${label.toLowerCase()}`} aria-current={active === label.toLowerCase() ? "location" : undefined} onClick={() => { setActive(label.toLowerCase()); if (label === "Education") setSelectedPlace("emsi-centre"); else if (label === "About") setSelectedPlace("marrakech"); }}><span className="nav-line" />{label}</a>)}</nav>
        </div>
        <div className="sidebar-bottom">
          <div className="contact-buttons"><a href={`${import.meta.env.BASE_URL}cv.pdf`} download="Imrane_Lakniti_CV_EN.pdf" aria-label="Download CV (PDF)"><FileText />CV</a><a href={`mailto:${email}`}><Mail />Email</a></div>
          <div className="socials"><a href={github} target="_blank" rel="noreferrer"><Github />GitHub <ArrowUpRight /></a><a href={linkedin} target="_blank" rel="noreferrer"><Linkedin />LinkedIn <ArrowUpRight /></a><span>Marrakech, Morocco</span></div>
          <button className="motion-control" onClick={() => setPaused(!paused)} aria-label={paused ? "Play background animation" : "Pause background animation"}>{paused ? <Play /> : <Pause />}{paused ? "Motion off" : "Motion on"}</button>
        </div>
        <Suspense fallback={<div className="vader-portrait" aria-hidden="true" />}><VaderPortrait paused={paused || exploring || secret !== 'closed' || projectPreviewOpen} onSecret={() => setSecret('code')} /></Suspense>
      </header>
      <main>
        <section id="about" className="intro" aria-label="About">
          <p>I’m a full-stack and mobile developer studying computer science and networks at <strong>EMSI Marrakech</strong>, with graduation expected in <strong>2027</strong>. I build React and TypeScript interfaces, Python and Java backends, and Flutter mobile apps.</p>
          <p>My freelance work includes <strong>MonsterGarage</strong> and <strong>Neurodive</strong>. At Neurodive, my role includes full-stack development, technical leadership, IT, and deployment. I’m also developing <strong>Forge</strong>, an engineering intelligence platform for GitHub activity and test results.</p>
          <p className="muted">Two internships at Sensthings brought hands-on experience with full-stack dashboards, APIs, phone sensors, BLE presence detection, and on-device machine learning. Most of my code lives in private repositories.</p>
        </section>
        <ProjectSection email={email} selectedPlace={selectedPlace} onViewLocation={showPlace} onPreviewChange={setProjectPreviewOpen} />
        <section id="experience" aria-labelledby="experience-title"><h2 id="experience-title" className="section-label">Experience</h2>
          <div className="entry"><span className="entry-meta">SUMMER 2026</span><div><h3>Sensthings</h3><p className="entry-subtitle">Mobile development &amp; machine learning internship</p><p>Built a Flutter/Dart module for T3-Shield to detect motion, estimate room presence with BLE beacons, and relate in-app activity to movement. Sensor processing and TensorFlow Lite inference run on the phone, with a rule-based fallback.</p><p>Created a Python training pipeline and a React/TypeScript dashboard connected through a local HTTP/WebSocket relay. Structured the tracking module for integration into an existing Flutter app.</p></div></div>
          <div className="entry"><span className="entry-meta">SUMMER 2025</span><div><h3>Sensthings</h3><p className="entry-subtitle">Full-stack development internship</p><p>Developed T3-Shield’s React and TypeScript frontend with analytics dashboards, regional maps, filters, and data visualizations.</p><p>Built Python/FastAPI APIs backed by MySQL for collecting and querying analysis data, statistics, regional comparisons, and Excel exports. Implemented session-based authentication, role-based access control, and WebSocket updates for dashboard data.</p></div></div>
          <div className="experience-locations"><p>Sensthings locations</p><div className="entry-map-links"><button aria-pressed={selectedPlace === "sensthings-skhirat"} onClick={() => showPlace("sensthings-skhirat")}><MapPin />Skhirat · area</button><button aria-pressed={selectedPlace === "sensthings-benguerir"} onClick={() => showPlace("sensthings-benguerir")}><MapPin />Benguerir · area</button></div></div>
        </section>
        <section id="education" aria-labelledby="education-title"><h2 id="education-title" className="section-label">Education</h2><div className="entry"><span className="entry-meta">2022 – 2027 (EXPECTED)</span><div><h3>EMSI Marrakech</h3><p className="entry-subtitle">Engineering studies in computer science and networks</p><p>Specialization in digital development and information systems. Studying across EMSI’s Centre and Guéliz campuses in Marrakech.</p><div className="entry-map-links"><button aria-pressed={selectedPlace === "emsi-centre"} onClick={() => showPlace("emsi-centre")}><MapPin />Centre campus</button><button aria-pressed={selectedPlace === "emsi-gueliz"} onClick={() => showPlace("emsi-gueliz")}><MapPin />Guéliz campus</button></div></div></div></section>
        <section id="stack" aria-labelledby="stack-title"><h2 id="stack-title" className="section-label">Stack</h2>
          <div className="entry stack-entry"><span className="entry-meta">BACKEND</span><div><h3>Python · Java</h3><p>REST APIs and business logic with FastAPI, Flask, and Spring Boot. Other projects use PHP/Laravel and Node.js/Express, with HTTP and WebSocket communication.</p></div></div>
          <div className="entry stack-entry"><span className="entry-meta">FRONTEND</span><div><h3>TypeScript · React · Next.js</h3><p>JavaScript and TypeScript for web applications, administration tools, and live data dashboards.</p></div></div>
          <div className="entry stack-entry"><span className="entry-meta">MOBILE</span><div><h3>Flutter · Dart</h3><p>Mobile interfaces, phone sensors, BLE, and event-driven tracking.</p></div></div>
          <div className="entry stack-entry"><span className="entry-meta">DATA &amp; ML</span><div><h3>SQL · TensorFlow Lite</h3><p>PostgreSQL, MySQL, MongoDB, and SQLAlchemy for application data. Python for model training and TensorFlow Lite for inference on the phone.</p></div></div>
          <div className="entry stack-entry"><span className="entry-meta">TOOLS</span><div><h3>Git · Docker · Playwright</h3><p>Version control, reproducible environments, and automated API and UI testing with pytest, Vitest, and Playwright.</p></div></div>
          <div className="entry stack-entry"><span className="entry-meta">LANGUAGES</span><div><h3>English · French · Arabic</h3><p>English: C1. French: C1. Arabic: native.</p></div></div>
        </section>
        <section id="interests" aria-labelledby="interests-title"><h2 id="interests-title" className="section-label">Interests</h2><div className="interest"><h3>Developer tools</h3><p>Making a codebase easier to understand, change, and maintain.</p></div><div className="interest"><h3>Web, mobile &amp; connected devices</h3><p>Connecting interfaces, APIs, and sensor data to build useful applications.</p></div></section>
        <footer><div className="email-line"><a href={`mailto:${email}`}>{email}</a><button onClick={copyEmail} aria-label="Copy email address">{copied ? <Check /> : <Copy />}</button></div><p role="status" className="copy-status">{copied ? "Email copied." : copyError ? "Select the address above to copy it." : ""}</p><p>Built with React, Three.js and CesiumJS.<br />Map exploration inspired by <a href="https://github.com/bilawalsidhu/gods-eye-view" target="_blank" rel="noreferrer">God’s Eye View</a>.</p><a className="asset-credit-link" href={`${import.meta.env.BASE_URL}models/CREDITS.txt`} target="_blank" rel="noreferrer">3D model credits</a></footer>
      </main>
    </div>
  </div>;
}

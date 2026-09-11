import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Github, Mail, FileText, Pause, Play, Copy, Check, MapPin } from "lucide-react";
import MapExperience from "./MapExperience";
import ImperialCursor from './starwars/ImperialCursor';
const VaderPortrait = lazy(() => import('./starwars/VaderPortrait'));
const email = "imranelakniti9@gmail.com";
const github = "https://github.com/imranelak1";
const sections = ["About", "Projects", "Experience", "Education", "Stack", "Interests"];
const projects = [
  { name: "MonsterGarage", language: "FREELANCE", summary: "A garage-management application for a Marrakech business.", description: "Built a local web application for Monster Garage / WIDINE MOTORS SERVICES, covering customers, vehicles, repair jobs, quotations, invoices, and staff workflows.", details: ["Customer, vehicle, and repair records", "Quotes, invoices, and PDF exports", "Python, Flask, and a browser-based interface"], place: "monstergarage" },
  { name: "Neurodive", language: "FREELANCE", summary: "Resources, professional discovery, and memberships.", description: "A full-stack platform for resources, professional discovery, memberships, and administration, pairing a React and TypeScript interface with a Python/FastAPI backend.", details: ["Resource and professional discovery", "Membership and admin workflows", "React, TypeScript, FastAPI, and SQLAlchemy"] },
  { name: "codeGraph", language: "TYPESCRIPT", summary: "Understand what a code change puts at risk.", description: "A dependency analyzer for JavaScript and TypeScript. Trace the impact of a change, inspect test coverage, and see which imports could not be resolved.", details: ["Dependency maps and change impact", "Coverage and unresolved imports", "Web interface, CLI, and GitHub Action"] },
];
export default function App() {
  const [active, setActive] = useState("about");
  const mapTrigger = useRef<HTMLElement | null>(null);
  const [exploring, setExploring] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState("marrakech");
  const openPlace = useCallback((id: string) => { mapTrigger.current = document.activeElement as HTMLElement; setSelectedPlace(id); setExploring(true); }, []);
  const exploreMap = useCallback((open: boolean) => { if (open) mapTrigger.current = document.activeElement as HTMLElement; setExploring(open); }, []);
  const [paused, setPaused] = useState(() => matchMedia("(prefers-reduced-motion: reduce), (hover: none) and (pointer: coarse)").matches);
  const [cv, setCv] = useState(false);
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
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}cv.pdf`, { method: "HEAD", signal: controller.signal })
      .then(response => setCv(response.ok && !!response.headers.get("content-type")?.includes("application/pdf"))).catch(() => {});
    return () => { media.removeEventListener("change", onChange); observer.disconnect(); controller.abort(); };
  }, []);
  useEffect(() => { if (!copied) return; const timer = setTimeout(() => setCopied(false), 2200); return () => clearTimeout(timer); }, [copied]);
  async function copyEmail() {
    try { await navigator.clipboard.writeText(email); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  }
  return <div>
    <ImperialCursor disabled={exploring} />
    <MapExperience selected={selectedPlace} exploring={exploring} paused={paused} onExplore={exploreMap} returnFocus={mapTrigger.current} onSelect={setSelectedPlace} onPause={() => setPaused(!paused)} />
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
          <div className="contact-buttons">{cv ? <a href={`${import.meta.env.BASE_URL}cv.pdf`} download><FileText />CV</a> : <span className="cv-pending" title="CV will be added soon"><FileText />CV <span>soon</span></span>}<a href={`mailto:${email}`}><Mail />Email</a></div>
          <div className="socials"><a href={github} target="_blank" rel="noreferrer"><Github />GitHub <ArrowUpRight /></a><span>Marrakech, Morocco</span></div>
          <button className="motion-control" onClick={() => setPaused(!paused)} aria-label={paused ? "Play background animation" : "Pause background animation"}>{paused ? <Play /> : <Pause />}{paused ? "Motion off" : "Motion on"}</button>
        </div>
        <Suspense fallback={<div className="vader-portrait" aria-hidden="true" />}><VaderPortrait paused={paused || exploring} /></Suspense>
      </header>
      <main>
        <section id="about" className="intro" aria-label="About">
          <p>I’m a full-stack and mobile developer in my final year at <strong>EMSI Marrakech</strong>. I build React and TypeScript interfaces, Python and Java backends, and Flutter mobile apps.</p>
          <p>My work spans business software like <strong>MonsterGarage</strong>, the <strong>Neurodive</strong> platform, and developer tools like <strong>codeGraph</strong>. At Sensthings, I also built a Flutter module that combines phone sensors, BLE room detection, and on-device machine learning.</p>
          <p className="muted">I completed two internships at Sensthings, in summer 2025 and summer 2026, and work on freelance projects including MonsterGarage and Neurodive. Most of my code lives in private repositories.</p>
        </section>
        <section id="projects" aria-labelledby="projects-title"><h2 id="projects-title" className="section-label">Projects</h2><div className="project-list">{projects.map(project => <details className="project" key={project.name}><summary><span className="entry-meta">{project.language}</span><span className="project-summary"><span className="project-name">{project.name}<span className="disclosure" aria-hidden="true">▸</span></span><span className="project-description">{project.summary}</span></span></summary><div className="project-details"><p>{project.description}</p><ul>{project.details.map(detail => <li key={detail}>{detail}</li>)}</ul><div className="project-links">{project.place && <button onClick={() => openPlace(project.place)}><MapPin />View location</button>}<a href={`mailto:${email}?subject=${encodeURIComponent(`Tell me about ${project.name}`)}`}>Ask about this project <ArrowUpRight /></a><span>Private repository</span></div></div></details>)}</div></section>
        <section id="experience" aria-labelledby="experience-title"><h2 id="experience-title" className="section-label">Experience</h2>
          <div className="entry"><span className="entry-meta">SUMMER 2026</span><div><h3>Sensthings</h3><p className="entry-subtitle">Mobile development &amp; on-device ML</p><p>Built a Flutter/Dart module for T3-Shield to detect motion, estimate room presence with BLE beacons, and relate in-app activity to movement. Sensor processing and TensorFlow Lite inference run on the phone, with a rule-based fallback.</p><p>Created a Python training pipeline and a React/TypeScript dashboard connected through a local HTTP/WebSocket relay. Structured the tracking module for integration into an existing Flutter app.</p></div></div>
          <div className="entry"><span className="entry-meta">SUMMER 2025</span><div><h3>Sensthings</h3><p className="entry-subtitle">Frontend development internship</p><p>Built a React and TypeScript frontend with analytics dashboards, regional maps, filters, and data visualizations.</p></div></div>
          <div className="experience-locations"><p>Sensthings locations</p><div className="entry-map-links"><button onClick={() => openPlace("sensthings-skhirat")}><MapPin />Skhirat · area</button><button onClick={() => openPlace("sensthings-benguerir")}><MapPin />Benguerir · area</button></div></div>
        </section>
        <section id="education" aria-labelledby="education-title"><h2 id="education-title" className="section-label">Education</h2><div className="entry"><span className="entry-meta">FINAL YEAR</span><div><h3>EMSI Marrakech</h3><p className="entry-subtitle">Engineering studies</p><p>Final-year engineering studies across EMSI’s Centre and Guéliz campuses in Marrakech.</p><div className="entry-map-links"><button onClick={() => openPlace("emsi-centre")}><MapPin />Centre campus</button><button onClick={() => openPlace("emsi-gueliz")}><MapPin />Guéliz campus</button></div></div></div></section>
        <section id="stack" aria-labelledby="stack-title"><h2 id="stack-title" className="section-label">Stack</h2>
          <div className="entry stack-entry"><span className="entry-meta">BACKEND</span><div><h3>Python · Java</h3><p>APIs and business logic with FastAPI, Flask, and Spring Boot. Other projects use PHP/Laravel and Node.js/Express.</p></div></div>
          <div className="entry stack-entry"><span className="entry-meta">FRONTEND</span><div><h3>TypeScript · React · Next.js</h3><p>Web applications, administration tools, and live data dashboards.</p></div></div>
          <div className="entry stack-entry"><span className="entry-meta">MOBILE</span><div><h3>Flutter · Dart</h3><p>Mobile interfaces, phone sensors, BLE, and event-driven tracking.</p></div></div>
          <div className="entry stack-entry"><span className="entry-meta">DATA &amp; ML</span><div><h3>SQL · TensorFlow Lite</h3><p>PostgreSQL and MySQL for application data; MongoDB in MERN projects. Python for model training and TensorFlow Lite for inference on the phone.</p></div></div>
          <div className="entry stack-entry"><span className="entry-meta">TOOLS</span><div><h3>Git · Docker · Playwright</h3><p>Version control, reproducible environments, and browser testing.</p></div></div>
        </section>
        <section id="interests" aria-labelledby="interests-title"><h2 id="interests-title" className="section-label">Interests</h2><div className="interest"><h3>Developer tools</h3><p>Making a codebase easier to understand, change, and maintain.</p></div><div className="interest"><h3>Web, mobile &amp; connected devices</h3><p>Connecting interfaces, APIs, and sensor data to build useful applications.</p></div></section>
        <footer><div className="email-line"><a href={`mailto:${email}`}>{email}</a><button onClick={copyEmail} aria-label="Copy email address">{copied ? <Check /> : <Copy />}</button></div><p role="status" className="copy-status">{copied ? "Email copied." : copyError ? "Select the address above to copy it." : ""}</p><p>Built with React, Three.js and CesiumJS.<br />Map exploration inspired by <a href="https://github.com/bilawalsidhu/gods-eye-view" target="_blank" rel="noreferrer">God’s Eye View</a>.</p><a className="asset-credit-link" href={`${import.meta.env.BASE_URL}models/CREDITS.txt`} target="_blank" rel="noreferrer">3D model credits</a></footer>
      </main>
    </div>
  </div>;
}

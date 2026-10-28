import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Github, MapPin, Maximize2, X } from 'lucide-react';
import { projects, type Project, type ProjectImage } from './projects';

const asset = (file: string, preview = false) =>
  `${import.meta.env.BASE_URL}projects/${file}${preview ? '-720' : ''}.webp`;
type Selection = { project: Project; index: number };

function ImageViewer({ selection, onChange, onClose }: {
  selection: Selection;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const images = selection.project.images!;
  const image = images[selection.index];

  useEffect(() => {
    const element = dialog.current!;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  function move(direction: number) {
    onChange((selection.index + direction + images.length) % images.length);
  }

  return <dialog
    ref={dialog}
    className="project-viewer"
    aria-labelledby="project-viewer-title"
    aria-describedby="project-viewer-note"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}
    onKeyDown={event => {
      if (event.key === 'Tab') {
        const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]');
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
      if (images.length < 2) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        move(event.key === 'ArrowLeft' ? -1 : 1);
      }
    }}
  >
    <header className="project-viewer-header">
      <div><h2 id="project-viewer-title">{selection.project.name}</h2><p>{image.label}</p></div>
      <button type="button" onClick={onClose} aria-label="Close project preview" autoFocus><X /></button>
    </header>
    <div className="project-viewer-image"><img src={asset(image.file)} alt={image.alt} width={image.width} height={image.height} /></div>
    <footer className="project-viewer-footer">
      <p id="project-viewer-note">{selection.project.imageNote}</p>
      {images.length > 1 && <div className="project-viewer-navigation" aria-label="Screenshot navigation">
        <button type="button" onClick={() => move(-1)} aria-label="Previous screenshot"><ChevronLeft /></button>
        <span aria-live="polite">{selection.index + 1} / {images.length}</span>
        <button type="button" onClick={() => move(1)} aria-label="Next screenshot"><ChevronRight /></button>
      </div>}
      <a href={asset(image.file)} target="_blank" rel="noreferrer">Open image <ArrowUpRight /></a>
    </footer>
  </dialog>;
}

function ProjectVisual({ project, onOpen }: {
  project: Project;
  onOpen: (index: number, trigger: HTMLButtonElement) => void;
}) {
  const [index, setIndex] = useState(0);
  const [unavailable, setUnavailable] = useState<Record<string, boolean>>({});
  const images = project.images!;
  const image: ProjectImage = images[index];
  const failed = unavailable[image.file];

  return <figure className="project-visual">
    <button
      type="button" className="project-image-button"
      aria-label={`Enlarge ${project.name}: ${image.label}`}
      aria-haspopup="dialog" disabled={failed}
      onClick={event => onOpen(index, event.currentTarget)}
    >
      {failed ? <span className="project-image-error">Screenshot unavailable. Project details are still available above.</span> : <>
        <img
          src={asset(image.file, true)}
          srcSet={`${asset(image.file, true)} 720w, ${asset(image.file)} ${image.width}w`}
          sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1023px) calc(100vw - 80px), 680px"
          alt={image.alt} width={image.width} height={image.height}
          loading="lazy" decoding="async"
          onError={() => setUnavailable(value => ({ ...value, [image.file]: true }))}
        />
        <span className="project-image-expand" aria-hidden="true"><Maximize2 />Enlarge</span>
      </>}
    </button>
    <figcaption>
      {images.length > 1 ? <div className="project-image-options" role="group" aria-label={`${project.name} screenshots`}>
        {images.map((entry, imageIndex) => <button key={entry.file} type="button"
          aria-pressed={index === imageIndex} onClick={() => setIndex(imageIndex)}>{entry.label}</button>)}
      </div> : <span className="project-image-label">{image.label}</span>}
      <span className="project-image-note">{project.imageNote}</span>
    </figcaption>
  </figure>;
}

export default function ProjectSection({ email, selectedPlace, onViewLocation, onPreviewChange }: {
  email: string;
  selectedPlace: string;
  onViewLocation: (place: string) => void;
  onPreviewChange: (open: boolean) => void;
}) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);

  function closePreview() {
    setSelection(null);
    onPreviewChange(false);
    requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
  }

  return <section id="projects" aria-labelledby="projects-title">
    <h2 id="projects-title" className="section-label">Projects</h2>
    <p className="project-intro">Selected work, with screenshots from the applications. Open a preview to take a closer look.</p>
    <div className="project-list">{projects.map(project => <article className="project-case" key={project.id} aria-labelledby={`project-${project.id}`}>
      <details className="project">
        <summary>
          <span className="entry-meta">{project.category}</span>
          <div className="project-summary">
            <h3 className="project-name" id={`project-${project.id}`}>{project.name}<ChevronRight className="disclosure" aria-hidden="true" /></h3>
            <p className="project-description">{project.summary}</p>
          </div>
        </summary>
        <div className="project-details">
          {project.period && <p className="entry-meta">{project.period}</p>}
          <p>{project.description}</p>
          <ul>{project.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
          <div className="project-links">
            {project.place && <button type="button" aria-pressed={selectedPlace === project.place} onClick={() => onViewLocation(project.place!)}><MapPin />View location</button>}
            <a href={`mailto:${email}?subject=${encodeURIComponent(`Tell me about ${project.name}`)}`}>Ask about this project <ArrowUpRight /></a>
            {project.privateRepo && <span>Private repository</span>}
          </div>
        </div>
      </details>
      <p className="project-stack">{project.stack}</p>
      {project.images && <ProjectVisual project={project} onOpen={(index, button) => {
        trigger.current = button;
        setSelection({ project, index });
        onPreviewChange(true);
      }} />}
      {project.source && <div className="project-source-links">
        <a href={project.source} target="_blank" rel="noreferrer"><Github />View repository <ArrowUpRight /></a>
        {project.release && <a href={project.release} target="_blank" rel="noreferrer">Windows releases <ArrowUpRight /></a>}
      </div>}
    </article>)}</div>
    {selection && <ImageViewer selection={selection} onClose={closePreview} onChange={index => setSelection({ ...selection, index })} />}
  </section>;
}

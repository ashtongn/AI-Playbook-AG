import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { CSAF_LETTER } from "@/content/leadership";
import { Photo, PhotoCredit } from "@/components/Photograph";
import styles from "./LeadershipHero.module.css";

const progression = [
  { title: "Leadership intent", detail: "A shared purpose", href: "#leadership-source" },
  { title: "Institutional direction", detail: "An AI-first force", href: "#direction-title" },
  { title: "Airman adoption", detail: "A practical starting point", href: "#start-here" },
  { title: "Mission execution", detail: "Work that makes a difference", href: "#engagement-title" },
];

export default function LeadershipHero() {
  return (
    <section className={styles.hero} aria-labelledby="playbook-title" data-tone="dark">
      <div className={styles.media} aria-hidden="true">
        <Photo id="c17-dusk" priority decorative sizes="100vw" className={styles.photo} />
      </div>
      <div className={styles.grade} aria-hidden="true" />
      <div className={styles.colonnade} aria-hidden="true" />

      <div className={styles.stage}>
        <figure className={styles.leadership} id="leadership-source">
          <div className={styles.leadSignature}>
            <p className={styles.eyebrow}>Leadership intent <span aria-hidden="true">/</span> A published message</p>
            <div className={styles.signatureFrame}>
              {/* The original scanned ink is revealed, never retraced or synthesized. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={CSAF_LETTER.signatureUrl}
                width={596}
                height={138}
                alt="Kenneth S. Wilsbach's signature, reproduced from his letter of 3 November 2025"
                className={styles.signature}
                fetchPriority="high"
                draggable={false}
                data-leadership-signature
              />
            </div>
          </div>
          <blockquote cite={CSAF_LETTER.officialUrl}><p>“{CSAF_LETTER.quote}”</p></blockquote>
          <div className={styles.leadSource}>
            <figcaption>
              <strong>{CSAF_LETTER.author}</strong>
              <span>{CSAF_LETTER.role}</span>
              <a href={CSAF_LETTER.localUrl} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                First letter to the force <ArrowUpRight size={14} aria-hidden="true" />
              </a>
              <time dateTime={CSAF_LETTER.date}>{CSAF_LETTER.dateLabel}</time>
            </figcaption>
            <p className={styles.disclosure}>Published leadership intent. Not an endorsement of this Playbook.</p>
          </div>
        </figure>

        <div className={styles.identity}>
          <p className={styles.eyebrow}>The Playbook <span aria-hidden="true">/</span> From intent to execution</p>
          <h1 id="playbook-title" className={styles.wordmark}>Airman&apos;s <span>AI Playbook</span></h1>
          <div className={styles.identityFoot}>
            <p className={styles.thesis}>Leadership sets direction.<br />Airmen put it to work.</p>
            <div className={styles.actions}>
              <Link href="/plays" className={styles.primaryAction}>Find your next move <ArrowRight size={18} aria-hidden="true" /></Link>
              <a href="#start-here" className={styles.secondaryAction}>Explore the Playbook <ArrowDown size={16} aria-hidden="true" /></a>
            </div>
          </div>
        </div>
      </div>

      <nav aria-label="From leadership intent to mission execution" className={styles.progression}>
        <ol>
          {progression.map(({ title, detail, href }, index) => (
            <li key={title}>
              <a href={href}>
                <span className={styles.numeral} aria-hidden="true">0{index + 1}</span>
                <span className={styles.progressionText}><strong>{title}</strong><span>{detail}</span></span>
                <ArrowRight size={16} aria-hidden="true" className={styles.progressionArrow} />
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className={styles.foot}>
        <details className={styles.provenance}>
          <summary>About the signature &amp; its source</summary>
          <div>
            <p>This is a cropped reproduction of the signature in Gen. Wilsbach&apos;s public letter dated {CSAF_LETTER.dateLabel}.
              The animation reveals the original scan; it does not recreate his pen strokes or imply a new signing.
              The letter is not an endorsement of this concept, and is not the DAF AI strategy.</p>
            <p>The strategy below is separately attributed to Secretary of the Air Force Troy E. Meink.</p>
            <div className={styles.provenanceLinks}>
              <a href={CSAF_LETTER.officialUrl} target="_blank" rel="noopener noreferrer">Official letter <ArrowUpRight size={14} aria-hidden="true" /></a>
              <a href={CSAF_LETTER.archivedUrl} target="_blank" rel="noopener noreferrer">Archived official copy <ArrowUpRight size={14} aria-hidden="true" /></a>
              <a href={CSAF_LETTER.localUrl} target="_blank" rel="noopener noreferrer">Read the complete letter (PDF) <ArrowUpRight size={14} aria-hidden="true" /></a>
            </div>
          </div>
        </details>
        <PhotoCredit id="c17-dusk" className={styles.credit} />
      </div>
    </section>
  );
}

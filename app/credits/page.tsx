import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import { Photo } from "@/components/Photograph";
import { PHOTOGRAPHS } from "@/content/photography";
import { CSAF_LETTER } from "@/content/leadership";
import styles from "./credits.module.css";

export const metadata: Metadata = {
  title: "Photography & sources · Airman's AI Playbook",
  description: "Where every photograph, signature, and typeface on this site comes from.",
};

export default function CreditsPage() {
  const photographs = Object.values(PHOTOGRAPHS);
  return (
    <div className="editorial-page bleed">
      <PageHero eyebrow="Provenance" title="Photography & sources">
        <p>Everything shown here is authentic and attributed. Nothing is generated, composited, or retouched.
          Official photographs are reproduced as published; showing them does not imply endorsement by the people
          or units pictured.</p>
      </PageHero>

      <section className={styles.section} aria-labelledby="photo-heading">
        <h2 id="photo-heading" className={styles.heading}>Photographs</h2>
        <p className={styles.note}>Each image is a resized, compressed copy of a public-domain photograph. Tone and
          colour are adjusted only with CSS overlays on this site. The originals remain at the linked sources.</p>
        <ul className={styles.list}>
          {photographs.map((photo) => (
            <li key={photo.id} id={photo.id} className={styles.entry}>
              <div className={styles.thumb}><Photo id={photo.id} sizes="(min-width: 48rem) 320px, 90vw" /></div>
              <div>
                <h3>{photo.caption}</h3>
                <dl>
                  <div><dt>Credit</dt><dd>{photo.credit}</dd></div>
                  <div><dt>Date</dt><dd>{photo.date}</dd></div>
                  <div><dt>Location</dt><dd>{photo.location}</dd></div>
                  {photo.releaseId && <div><dt>Release ID</dt><dd>{photo.releaseId}</dd></div>}
                  <div><dt>Rights</dt><dd>{photo.rights}</dd></div>
                </dl>
                <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  View the original <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="signature-heading">
        <h2 id="signature-heading" className={styles.heading}>Signature and message</h2>
        <p className={styles.note}>
          The signature and quotation come from {CSAF_LETTER.author}&apos;s published {CSAF_LETTER.title},
          dated {CSAF_LETTER.dateLabel}. They are reproduced from the original scan and are not retraced. They represent
          published leadership intent and are not an endorsement of this Playbook.
        </p>
        <div className={styles.links}>
          <a href={CSAF_LETTER.officialUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>Official letter <ArrowUpRight size={14} aria-hidden="true" /></a>
          <a href={CSAF_LETTER.archivedUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>Archived copy <ArrowUpRight size={14} aria-hidden="true" /></a>
          <a href={CSAF_LETTER.localUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>Local PDF <ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
        <p className={styles.note}>The strategy foreword quoted on the home page is separately attributed to Secretary of the Air Force Troy E. Meink.</p>
      </section>

      <section className={styles.section} aria-labelledby="type-heading">
        <h2 id="type-heading" className={styles.heading}>Typefaces</h2>
        <p className={styles.note}>Libre Caslon Display and Libre Caslon Text, and Public Sans, are self-hosted under the
          SIL Open Font License 1.1. Nothing is loaded from third-party servers.</p>
      </section>
    </div>
  );
}

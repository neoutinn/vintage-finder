import { buildDeepLinks } from '@/lib/deepLinks';
import styles from './DeepLinkButtons.module.css';

type Props = {
  query: string;
  connected: { depop: boolean; facebook: boolean };
};

export default function DeepLinkButtons({ query, connected }: Props) {
  const links = buildDeepLinks(query, connected);

  if (links.length === 0) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.heading}>MORE PLATFORMS (NO LIVE PREVIEW AVAILABLE):</div>
      <div className={styles.links}>
        {links.map((link) => (
          <a
            key={link.label}
            className="linkButton"
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.label} &rarr;
          </a>
        ))}
      </div>
    </div>
  );
}

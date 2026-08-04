import type { NormalizedResult } from '@/lib/providers/types';
import styles from './ResultCard.module.css';

export default function ResultCard({ result }: { result: NormalizedResult }) {
  return (
    <div className={styles.card}>
      {result.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.image} src={result.imageUrl} alt={result.title} loading="lazy" />
      ) : (
        <div className={styles.placeholder}>NO IMAGE</div>
      )}

      <div className={styles.title}>{result.title}</div>

      <div className={styles.meta}>
        <span>
          ${result.price.toFixed(2)} {result.currency}
        </span>
        <span className={styles.badges}>
          {result.size && <span className={styles.size}>{result.size}</span>}
          <span className={styles.source}>{result.source.toUpperCase()}</span>
        </span>
      </div>

      <a
        className="linkButton"
        style={{ textAlign: 'center' }}
        href={result.itemUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        VIEW
      </a>
    </div>
  );
}

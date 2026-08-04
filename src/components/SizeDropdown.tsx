'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './SizeDropdown.module.css';

export type SizeGroup = { label: string; sizes: string[] };

// Curated per category since formats don't share a scale — letter sizes for
// tops, waist inches for bottoms, US sizing for shoes. "etc." beyond these
// three is free-form in the eBay item data itself (see ebay.ts matching),
// just not offered as a checkbox yet.
export const SIZE_GROUPS: SizeGroup[] = [
  { label: 'TOPS / SHIRTS / JACKETS', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] },
  { label: 'BOTTOMS / PANTS (WAIST)', sizes: ['26', '28', '30', '32', '34', '36', '38', '40', '42'] },
  {
    label: 'SHOES (US)',
    sizes: ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13', '14'],
  },
];

type Props = {
  selected: string[];
  onChange: (sizes: string[]) => void;
};

export default function SizeDropdown({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function toggleSize(size: string) {
    onChange(selected.includes(size) ? selected.filter((s) => s !== size) : [...selected, size]);
  }

  const buttonLabel = selected.length > 0 ? `SIZE: ${selected.join(', ')}` : 'SIZE: ANY';

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {buttonLabel} {open ? '▲' : '▼'}
      </button>

      {open && (
        <div className={styles.panel}>
          {SIZE_GROUPS.map((group) => (
            <div key={group.label} className={styles.group}>
              <div className={styles.groupLabel}>{group.label}</div>
              <div className={styles.options}>
                {group.sizes.map((size) => (
                  <label key={size} className={styles.option}>
                    <input
                      type="checkbox"
                      checked={selected.includes(size)}
                      onChange={() => toggleSize(size)}
                    />
                    {size}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {selected.length > 0 && (
            <button type="button" className={styles.clearButton} onClick={() => onChange([])}>
              CLEAR ({selected.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

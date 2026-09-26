import styles from './externalIcon.module.scss'

// Box-and-arrow external-link glyph (Wikipedia's shape); inherits the
// link's text colour.
function ExternalIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M6 1h5v5L8.86 3.85 4.7 8 4 7.3l4.15-4.16zM2 3h2v1H2v6h6V8h1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1"
      />
    </svg>
  )
}

export default ExternalIcon

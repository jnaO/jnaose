import classNames from 'classnames'

import { ROTATE_KEEP } from '@/constants'

import styles from './rotateNotice.module.scss'

// Covers the site on phones held in landscape; hidden by CSS otherwise.
function RotateNotice() {
  return (
    <div
      className={classNames(styles.notice, ROTATE_KEEP)}
      aria-hidden="true"
    >
      <svg
        className={styles.phone}
        viewBox="0 0 24 24"
        focusable="false"
      >
        <rect
          x="7"
          y="2"
          width="10"
          height="20"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path fill="currentColor" d="M10.5 18.5h3v1h-3z" />
      </svg>
      <p className={styles.text}>rotate your phone</p>
    </div>
  )
}

export default RotateNotice

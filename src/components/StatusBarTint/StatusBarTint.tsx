'use client'

import classNames from 'classnames'

import { useFinaleBlur } from '@/hooks/useFinaleBlur'

import styles from './statusBarTint.module.scss'

// Shown from the moment the finale starts (data-finale on <html>) and
// while Backdrop's finale blur layer is mounted: that layer alone
// leaves iOS Safari no colour for its status bar, and it can turn
// white until reload.
function StatusBarTint() {
  const blurring = useFinaleBlur()
  return (
    <div
      className={classNames(
        styles.tint,
        blurring && styles.shown
      )}
      aria-hidden="true"
    />
  )
}

export default StatusBarTint

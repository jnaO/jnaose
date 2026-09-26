'use client'

import Link from 'next/link'

import { useSceneLink } from '@/hooks/useSceneLink'

interface WorkLinkProps {
  className?: string
  children: React.ReactNode
}

function WorkLink({ className, children }: WorkLinkProps) {
  const toWork = useSceneLink('/work')
  return (
    <Link
      href="/work"
      scroll={false}
      onClick={toWork}
      className={className}
    >
      {children}
    </Link>
  )
}

export default WorkLink

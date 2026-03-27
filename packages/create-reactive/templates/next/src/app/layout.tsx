import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Reactive App',
  description: 'A Next.js app powered by Reactive',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

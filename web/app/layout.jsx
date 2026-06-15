import '../src/styles.css'

export const metadata = {
  title: '7-0 — daily MTG trophy draft game',
  description:
    'Follow a real 7-win Arena Premier Draft pick by pick and see how well you match the trophy drafter.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}

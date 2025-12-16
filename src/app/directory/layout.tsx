import { DirectoryHeader } from '@/components/directory/DirectoryHeader'

export default function DirectoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DirectoryHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-800/50 py-6 mt-12">
        <div className="container mx-auto px-4">
          <p className="text-center text-muted-foreground text-xs">
            Photos by{' '}
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-muted-foreground transition-colors"
            >
              Unsplash
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

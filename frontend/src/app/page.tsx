import Footer from '@/components/Footer'
import ScrapeForm from '@/components/ScrapeForm'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="flex-grow">
      <ScrapeForm />
      </div>
      <Footer />
    </div>
  )
}

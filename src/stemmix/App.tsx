import StudioPage from '@/stemmix/pages/StudioPage'
import SeparationOverlay from '@/stemmix/components/ui/SeparationOverlay'
import PrivacyNoticeOverlay from '@/stemmix/components/ui/PrivacyNoticeOverlay'
import './styles/globals.css'

export default function App() {
  return (
    <>
      <StudioPage />
      <SeparationOverlay />
      <PrivacyNoticeOverlay />
    </>
  )
}

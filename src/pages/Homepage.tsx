import HeroSection from '../sections/HeroSection'
import ImpactStats from '../sections/ImpactStats'
import ActivitiesSection from '../sections/ActivitiesSection'
import ProgramsSection from '../sections/ProgramsSection'
import DocumentationSection from '../sections/DocumentationSection'
import FinalCTA from '../sections/FinalCTA'
import { useSiteContent } from '../prototype/SiteContentContext'

export default function Homepage() {
  const { isSectionVisible } = useSiteContent()

  return (
    <>
      {isSectionVisible('hero') && <HeroSection />}
      {isSectionVisible('impact') && <ImpactStats />}
      {isSectionVisible('activities') && <ActivitiesSection />}
      {isSectionVisible('programs') && <ProgramsSection />}
      {isSectionVisible('documentation') && <DocumentationSection />}
      {isSectionVisible('cta') && <FinalCTA />}
    </>
  )
}

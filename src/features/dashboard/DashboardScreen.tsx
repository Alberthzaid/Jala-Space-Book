import { useNavigate } from 'react-router-dom';

import { getCatalogSearchPath } from '@/shared/lib/paths';
import SubjectShelf from './components/SubjectShelf';
import TrendingSection from './components/TrendingSection';
import WelcomeBanner from './components/WelcomeBanner';
import { SHELF_SUBJECTS } from './data/home';

export default function DashboardScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full">
      <div className="p-6 lg:p-8 flex flex-col gap-8 max-w-[1440px] mx-auto w-full">
        <WelcomeBanner onSearch={(term) => navigate(getCatalogSearchPath(term))} />
        <TrendingSection />
        {SHELF_SUBJECTS.map((slug) => (
          <SubjectShelf key={slug} slug={slug} />
        ))}
      </div>
    </div>
  );
}

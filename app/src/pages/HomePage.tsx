import { useCityContent } from "../lib/useCityContent";
import { SearchBar } from "../components/SearchBar";
import {
  CategoryGrid,
  EmergencyBanner,
  EventsSection,
  GlobalNav,
  NewsSection,
  PopularMenus,
  WardGrid,
} from "../components/Sections";

export function HomePage() {
  const { news, emergencies, events, source } = useCityContent();

  return (
    <>
      <SearchBar />
      <GlobalNav />
      <EmergencyBanner notices={emergencies} />
      <div className="container">
        <NewsSection news={news} source={source} />
        <CategoryGrid />
        <PopularMenus />
        <WardGrid />
        <EventsSection events={events} source={source} />
      </div>
    </>
  );
}

// src/app/directory/[city]/page.tsx
type CityPageProps = {
  params: Promise<{
    city: string;
  }>;
};

export default async function CityPage({ params }: CityPageProps) {
  const { city } = await params;
  const cityName = city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold text-center">Photography Locations in {cityName}</h1>
      {/* Location list and filters will be rendered here */}
    </div>
  );
}

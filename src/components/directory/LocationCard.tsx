// src/components/directory/LocationCard.tsx
import Link from 'next/link';

type LocationCardProps = {
  location: {
    slug: string;
    name: string;
    city: string;
    state: string;
    cover_image_url?: string;
  };
};

export function LocationCard({ location }: LocationCardProps) {
  return (
    <Link href={`/directory/${location.city.toLowerCase().replace(/ /g, '-')}/${location.slug}`}>
      <div className="block border rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
        <img src={location.cover_image_url || '/placeholder.svg'} alt={`Photo of ${location.name}`} className="w-full h-48 object-cover" />
        <div className="p-4">
          <h3 className="text-xl font-semibold">{location.name}</h3>
          <p className="text-gray-600">{location.city}, {location.state}</p>
        </div>
      </div>
    </Link>
  );
}

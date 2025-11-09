// src/components/directory/PhotographerCard.tsx
import Link from 'next/link';

type PhotographerCardProps = {
  photographer: {
    username: string;
    business_name?: string;
    profile_image_url?: string;
    bio?: string;
  };
};

export function PhotographerCard({ photographer }: PhotographerCardProps) {
  return (
    <Link href={`/directory/photographers/${photographer.username}`}>
      <div className="block border rounded-lg p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors duration-200">
        <img src={photographer.profile_image_url || '/placeholder.svg'} alt={photographer.business_name || photographer.username} className="w-24 h-24 rounded-full object-cover" />
        <div>
          <h3 className="text-xl font-semibold">{photographer.business_name || photographer.username}</h3>
          <p className="text-gray-600 line-clamp-2">{photographer.bio}</p>
        </div>
      </div>
    </Link>
  );
}

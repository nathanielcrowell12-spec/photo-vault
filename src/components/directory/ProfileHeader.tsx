// src/components/directory/ProfileHeader.tsx
type ProfileHeaderProps = {
  profile: {
    business_name?: string;
    username: string;
    website?: string;
    profile_image_url?: string;
    bio?: string;
    is_founding_member?: boolean;
  };
};

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left space-y-4 md:space-y-0 md:space-x-8">
      <img src={profile.profile_image_url || '/placeholder.svg'} alt={profile.business_name || profile.username} className="w-48 h-48 rounded-full object-cover" />
      <div className="flex-1">
        <h1 className="text-4xl font-bold">{profile.business_name || profile.username}</h1>
        {profile.is_founding_member && (
          <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold mt-2 px-2.5 py-0.5 rounded-full">
            Founding Member
          </span>
        )}
        <p className="mt-4 text-lg">{profile.bio}</p>
        {profile.website && (
          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-2 inline-block">
            Visit Website
          </a>
        )}
      </div>
    </div>
  );
}

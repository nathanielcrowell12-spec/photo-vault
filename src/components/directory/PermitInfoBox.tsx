// src/components/directory/PermitInfoBox.tsx
type PermitInfoProps = {
  intelligence: {
    permit_status?: string;
    permit_cost?: string;
    permit_details?: string;
    rules_and_restrictions?: string;
  } | null;
};

export function PermitInfoBox({ intelligence }: PermitInfoProps) {
  if (!intelligence) {
    return null;
  }

  return (
    <div className="bg-gray-100 border-l-4 border-blue-500 p-6 rounded-lg mt-8">
      <h3 className="text-2xl font-bold mb-4">Photographer's Guide</h3>
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-lg">Permit Status</h4>
          <p>{intelligence.permit_status || 'N/A'}</p>
        </div>
        <div>
          <h4 className="font-semibold text-lg">Permit Cost</h4>
          <p>{intelligence.permit_cost || 'N/A'}</p>
        </div>
        <div>
          <h4 className="font-semibold text-lg">Permit Details</h4>
          <p>{intelligence.permit_details || 'N/A'}</p>
        </div>
        <div>
          <h4 className="font-semibold text-lg">Rules & Restrictions</h4>
          <p>{intelligence.rules_and_restrictions || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

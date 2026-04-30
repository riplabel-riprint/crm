type Props = { params: Promise<{ id: string }> };

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Klient #{id}</h1>
      <p className="mt-1 text-sm text-gray-500">Dane, zlecenia, historia zdarzeń.</p>
    </div>
  );
}

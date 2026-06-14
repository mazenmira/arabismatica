import SasanianShellWrapper from '@/components/sasanian/SasanianShellWrapper';

export default function SasanianLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <SasanianShellWrapper locale={params.locale}>
      {children}
    </SasanianShellWrapper>
  );
}

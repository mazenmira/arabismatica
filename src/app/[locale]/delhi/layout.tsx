import DelhiShellWrapper from '@/components/delhi/DelhiShellWrapper';

export default function DelhiLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <DelhiShellWrapper locale={params.locale}>
      {children}
    </DelhiShellWrapper>
  );
}

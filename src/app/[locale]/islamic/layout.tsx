import IslamicShellWrapper from '@/components/islamic/IslamicShellWrapper';

export default function IslamicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <IslamicShellWrapper locale={params.locale}>
      {children}
    </IslamicShellWrapper>
  );
}

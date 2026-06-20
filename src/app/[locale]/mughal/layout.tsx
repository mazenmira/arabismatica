import MughalShellWrapper from '@/components/mughal/MughalShellWrapper';

export default function MughalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <MughalShellWrapper locale={params.locale}>
      {children}
    </MughalShellWrapper>
  );
}

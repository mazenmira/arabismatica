import CatalogueShellWrapper from '@/components/catalogue/CatalogueShellWrapper';

export default function CatalogueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <CatalogueShellWrapper locale={params.locale}>
      {children}
    </CatalogueShellWrapper>
  );
}

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="bg-[#F8F5EE] border-y border-[#E8E2D5]"
    >
      <div className="container mx-auto px-4 py-3 text-sm text-gray-700">
        <ol className="flex flex-wrap items-center gap-2">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-2">
                {isLast ? (
                  <span
                    aria-current="page"
                    className="font-medium text-gray-900"
                  >
                    {item.name}
                  </span>
                ) : (
                  <a
                    href={item.path}
                    className="hover:text-[#9A7B1D] transition-colors"
                  >
                    {item.name}
                  </a>
                )}
                {!isLast ? <span className="text-gray-400">/</span> : null}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

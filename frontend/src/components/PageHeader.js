/**
 * The title block at the top of a page: optional eyebrow, heading,
 * description and action buttons on the right.
 */
export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-header__description">{description}</p>}
      </div>
      {actions && <div className="cluster">{actions}</div>}
    </header>
  );
}

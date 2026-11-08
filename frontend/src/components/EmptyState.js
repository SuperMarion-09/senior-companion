import Icon from './Icon';

/**
 * Shown when a list or page has nothing to display yet.
 * Explain why it is empty and, if possible, what to do next (`action`).
 */
export default function EmptyState({ icon = 'info', title, titleAs: Heading = 'h2', children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon name={icon} size={32} />
      </span>
      <Heading className="empty-state__title">{title}</Heading>
      {children && <p className="empty-state__text">{children}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}

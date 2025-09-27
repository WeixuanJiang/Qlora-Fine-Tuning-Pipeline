export default function HelpCallout({ title, children, icon = '💡' }) {
  return (
    <div className="callout" role="status" aria-live="polite">
      <strong>
        <span aria-hidden="true" style={{ marginRight: '0.35rem' }}>
          {icon}
        </span>
        {title}
      </strong>
      <div>{children}</div>
    </div>
  );
}

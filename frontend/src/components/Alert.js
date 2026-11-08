/**
 * A coloured message box. type: 'info' | 'success' | 'error'
 */
export default function Alert({ type = 'info', children }) {
  return (
    <div className={`alert alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

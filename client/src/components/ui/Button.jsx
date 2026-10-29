import Icon from './Icon.jsx';

/**
 * variant: primary | soft | ghost | danger | dark
 * size: sm | md | lg
 */
export function Button({ variant = 'soft', size = 'md', icon, iconRight, block, className = '', children, ...rest }) {
  return (
    <button
      type="button"
      className={`btn btn--${variant} btn--${size} ${block ? 'btn--block' : ''} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children && <span className="btn__label">{children}</span>}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 16 : 18} />}
    </button>
  );
}

/** Icon-only button. `label` is required for screen readers. */
export function IconButton({ icon, label, variant = 'ghost', size = 'md', className = '', ...rest }) {
  return (
    <button
      type="button"
      className={`icon-btn icon-btn--${variant} icon-btn--${size} ${className}`}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={icon} size={size === 'sm' ? 16 : 19} />
    </button>
  );
}

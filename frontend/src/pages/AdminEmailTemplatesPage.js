import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import Button from '../components/Button';
import EmailPreviewFrame from '../components/EmailPreviewFrame';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import Icon from '../components/Icon';
import LoadError from '../components/LoadError';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { useApiData } from '../hooks/useApiData';
import { listEmailTemplates, previewEmailTemplate } from '../services/adminService';

const DEVICES = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Phone' },
];

const TABS = [
  { value: 'data', label: 'Sample data' },
  { value: 'checks', label: 'Links and checks' },
  { value: 'text', label: 'Plain text' },
];

/** Gmail hides the rest of an email bigger than this. */
const GMAIL_CLIP_KB = 102;

/**
 * Every email the platform sends, previewed with realistic sample data:
 * desktop and phone widths, sample scenarios, booking statuses, editable
 * data, a link check and the plain-text version. Nothing is ever sent.
 */
export default function AdminEmailTemplatesPage() {
  const { data: catalog, error, reload } = useApiData(() => listEmailTemplates(), []);
  const [searchParams, setSearchParams] = useSearchParams();

  const templates = catalog?.templates ?? [];
  const selectedKey = searchParams.get('template') || templates[0]?.key;
  const template = templates.find((item) => item.key === selectedKey) ?? templates[0];
  const device = searchParams.get('device') === 'mobile' ? 'mobile' : 'desktop';

  const update = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    setSearchParams(next, { replace: true });
  };

  if (error) {
    return (
      <>
        <Header />
        <LoadError error={error} onRetry={reload} title="Could not load the email templates" />
      </>
    );
  }

  if (!catalog) {
    return (
      <>
        <Header />
        <Spinner label="Loading email templates…" center />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="email-preview">
        <TemplateList
          templates={templates}
          categories={catalog.categories}
          selectedKey={template?.key}
          onSelect={(key) => update({ template: key, scenario: null, status: null })}
        />
        {template && (
          <TemplatePreview
            key={template.key}
            template={template}
            statuses={catalog.statuses}
            device={device}
            scenario={searchParams.get('scenario') || 'default'}
            status={searchParams.get('status') || ''}
            onChange={update}
          />
        )}
      </div>
    </>
  );
}

function Header() {
  return (
    <PageHeader
      eyebrow="Settings"
      title="Email templates"
      description="Every email families receive, with sample data. Check how each one looks on a computer and a phone before it is sent. Nothing is sent from this page."
    />
  );
}

/* ------------------------------------------------------------ Template list */

function TemplateList({ templates, categories, selectedKey, onSelect }) {
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const matches = templates.filter(
    (item) => !term || `${item.name} ${item.description} ${item.key}`.toLowerCase().includes(term),
  );

  return (
    <nav className="card email-list" aria-label="Email templates">
      {/* Phones and tablets: a drop-down instead of the long list. */}
      <div className="email-list__select">
        <FormSelect
          id="email-template-select"
          label="Email template"
          value={selectedKey}
          placeholder="Choose an email…"
          onChange={(event) => event.target.value && onSelect(event.target.value)}
          options={templates.map((item) => ({ value: item.key, label: `${item.name} (${item.category})` }))}
        />
      </div>

      <div className="email-list__full">
        <FormInput
          id="email-template-search"
          label="Find an email"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <p className="email-list__count" aria-live="polite">
          {matches.length} of {templates.length} emails
        </p>
        {categories.map((category) => {
          const items = matches.filter((item) => item.category === category);
          if (items.length === 0) return null;
          return (
            <div key={category} className="email-list__group">
              <h2 className="email-list__heading">{category}</h2>
              <ul className="email-list__items">
                {items.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      className={item.key === selectedKey ? 'email-list__item email-list__item--active' : 'email-list__item'}
                      aria-current={item.key === selectedKey ? 'true' : undefined}
                      onClick={() => onSelect(item.key)}
                    >
                      <span className="email-list__name">
                        {item.name}
                        {item.marketing && <span className="email-list__tag">Marketing</span>}
                      </span>
                      <span className="email-list__subject">{item.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

/* --------------------------------------------------------- One template */

function TemplatePreview({ template, statuses, device, scenario, status, onChange }) {
  const [overrides, setOverrides] = useState({});
  const [jsonErrors, setJsonErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState('data');
  const requestId = useRef(0);

  // Changing the scenario or status starts again from the sample data.
  useEffect(() => {
    setOverrides({});
    setJsonErrors({});
  }, [scenario, status]);

  // Re-render shortly after the admin stops typing.
  useEffect(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    const timer = setTimeout(
      () => {
        previewEmailTemplate(template.key, { scenario, bookingStatus: status, data: overrides })
          .then((result) => {
            if (id !== requestId.current) return;
            setPreview(result);
            setPreviewError(null);
          })
          .catch((err) => id === requestId.current && setPreviewError(err))
          .finally(() => id === requestId.current && setIsLoading(false));
      },
      Object.keys(overrides).length ? 450 : 0,
    );
    return () => clearTimeout(timer);
  }, [template.key, scenario, status, overrides]);

  const scenarioOptions = template.scenarios.map((item) => ({ value: item.key, label: item.label }));

  return (
    <section className="email-preview__main" aria-labelledby="email-preview-title" aria-busy={isLoading}>
      <div className="card email-preview__intro">
        <p className="eyebrow">{template.category}</p>
        <h2 id="email-preview-title" className="email-preview__title">
          {template.name}
          {template.marketing && <Badge tone="warning">Marketing: includes unsubscribe</Badge>}
        </h2>
        <p className="email-preview__description">{template.description}</p>
        <p className="email-preview__trigger">
          <Icon name="clock" size={18} /> <span>When it is sent: {template.trigger}</span>
        </p>

        <div className="email-toolbar">
          <div className="email-toolbar__field">
            <span className="form-field__label" id="email-device-label">
              View on
            </span>
            <div className="segmented" role="radiogroup" aria-labelledby="email-device-label">
              {DEVICES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={device === option.value}
                  className={device === option.value ? 'segmented__option segmented__option--active' : 'segmented__option'}
                  onClick={() => onChange({ device: option.value === 'desktop' ? null : option.value })}
                >
                  <Icon name={option.value === 'mobile' ? 'phone' : 'home'} size={18} /> {option.label}
                </button>
              ))}
            </div>
          </div>
          <FormSelect
            id="email-scenario"
            label="Sample data"
            value={scenario}
            placeholder="Everything filled in"
            onChange={(event) => onChange({ scenario: event.target.value === 'default' ? null : event.target.value })}
            options={scenarioOptions.filter((option) => option.value !== 'default')}
          />
          {template.uses_booking_status && (
            <FormSelect
              id="email-status"
              label="Booking status"
              value={status}
              placeholder="As in the sample"
              onChange={(event) => onChange({ status: event.target.value || null })}
              options={statuses}
            />
          )}
        </div>
      </div>

      {previewError && (
        <Alert type="error" title="This email could not be shown">
          <p>{previewError.message}</p>
        </Alert>
      )}

      {!preview ? (
        <div className="card">
          <Spinner label="Preparing the preview…" center />
        </div>
      ) : (
        <>
          <InboxRow preview={preview} />
          <div className={isLoading ? 'email-preview__stage is-refreshing' : 'email-preview__stage'}>
            <EmailPreviewFrame html={preview.html} device={device} title={`Preview of the ${template.name} email`} />
          </div>

          <div className="card email-panels">
            <div className="tabs" role="tablist" aria-label="Email details">
              {TABS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  id={`email-tab-${item.value}`}
                  aria-selected={tab === item.value}
                  aria-controls={`email-panel-${item.value}`}
                  className={tab === item.value ? 'tabs__tab tabs__tab--active' : 'tabs__tab'}
                  onClick={() => setTab(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div role="tabpanel" id={`email-panel-${tab}`} aria-labelledby={`email-tab-${tab}`} className="tabs__panel">
              {tab === 'data' && (
                <SampleDataEditor
                  template={template}
                  values={preview.data}
                  overrides={overrides}
                  jsonErrors={jsonErrors}
                  onChange={(name, value, jsonError) => {
                    setJsonErrors((current) => ({ ...current, [name]: jsonError }));
                    if (!jsonError) setOverrides((current) => ({ ...current, [name]: value }));
                  }}
                  onReset={() => {
                    setOverrides({});
                    setJsonErrors({});
                  }}
                />
              )}
              {tab === 'checks' && <EmailChecks preview={preview} template={template} />}
              {tab === 'text' && <pre className="email-text">{preview.text}</pre>}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

/** How the email shows up in an inbox list: sender, subject, preview text. */
function InboxRow({ preview }) {
  return (
    <div className="card email-inbox" aria-label="How it looks in the inbox">
      <span className="email-inbox__avatar" aria-hidden="true">
        K
      </span>
      <div className="email-inbox__body">
        <p className="email-inbox__from">
          {preview.from?.name || 'Kaagapay'} <span>&lt;{preview.from?.address}&gt;</span>
        </p>
        <p className="email-inbox__subject">{preview.subject}</p>
        <p className="email-inbox__preheader">{preview.preheader}</p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Sample data */

function displayValue(value) {
  if (value == null) return '';
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function SampleDataEditor({ template, values, overrides, jsonErrors, onChange, onReset }) {
  const [rawJson, setRawJson] = useState({});
  const hasChanges = Object.keys(overrides).length > 0;

  // After "Reset sample data", show the sample lists again.
  useEffect(() => {
    if (!hasChanges) setRawJson({});
  }, [hasChanges]);

  return (
    <div>
      <div className="section-heading">
        <p className="email-panels__hint">
          Change any value to see how the email adapts. Empty optional values hide their section. Your changes are only
          for this preview.
        </p>
        <Button variant="ghost" size="sm" icon="refresh" onClick={onReset} disabled={!hasChanges}>
          Reset sample data
        </Button>
      </div>
      <div className="email-data">
        {template.variables.map((variable) => {
          const current = overrides[variable.name] !== undefined ? overrides[variable.name] : values?.[variable.name];
          const isList = Array.isArray(current) || variable.description.toLowerCase().startsWith('list');
          const id = `email-var-${variable.name}`;
          const label = (
            <>
              <code>{`{{${variable.name}}}`}</code>
              {variable.required && <span className="email-data__required"> required</span>}
            </>
          );

          if (isList) {
            const text = rawJson[variable.name] ?? displayValue(current);
            return (
              <div key={variable.name} className="email-data__wide">
                <FieldBox id={id} label={label} hint={`${variable.description}. Written as JSON.`} error={jsonErrors[variable.name]}>
                  <textarea
                    id={id}
                    aria-describedby={`${id}-hint`}
                    aria-invalid={Boolean(jsonErrors[variable.name])}
                    className="input email-data__code"
                    rows={5}
                    value={text}
                    onChange={(event) => {
                      const raw = event.target.value;
                      setRawJson((json) => ({ ...json, [variable.name]: raw }));
                      try {
                        const parsed = raw.trim() === '' ? null : JSON.parse(raw);
                        if (parsed !== null && !Array.isArray(parsed)) throw new Error('not a list');
                        onChange(variable.name, parsed, null);
                      } catch {
                        onChange(variable.name, null, 'This is not a valid JSON list yet, e.g. ["First", "Second"].');
                      }
                    }}
                  />
                </FieldBox>
              </div>
            );
          }

          const text = displayValue(current);
          const isLong = text.length > 70 || /body|description|message|bio|summary|note|reason|instructions/.test(variable.name);
          return (
            <div key={variable.name} className={isLong ? 'email-data__wide' : undefined}>
              <FieldBox id={id} label={label} hint={variable.description}>
                {isLong ? (
                  <textarea
                    id={id}
                    aria-describedby={`${id}-hint`}
                    className="input"
                    rows={3}
                    value={text}
                    onChange={(event) => onChange(variable.name, event.target.value, null)}
                  />
                ) : (
                  <input
                    id={id}
                    aria-describedby={`${id}-hint`}
                    className="input"
                    value={text}
                    onChange={(event) => onChange(variable.name, event.target.value, null)}
                  />
                )}
              </FieldBox>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** A form field whose label can hold markup (the variable name in code style). */
function FieldBox({ id, label, hint, error, children }) {
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-field__label">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="form-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p className="form-field__error" role="alert">
          <Icon name="alert-circle" size={18} />
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Checks */

function EmailChecks({ preview, template }) {
  const { links, images } = useMemo(() => {
    const doc = new DOMParser().parseFromString(preview.html, 'text/html');
    return {
      links: [...doc.querySelectorAll('a[href]')].map((a) => ({
        text: (a.textContent || '').replace(/\s+/g, ' ').trim() || a.querySelector('img')?.getAttribute('alt') || '',
        href: a.getAttribute('href'),
      })),
      images: [...doc.querySelectorAll('img')].map((img) => ({ src: img.getAttribute('src'), alt: img.getAttribute('alt') })),
    };
  }, [preview.html]);

  const checks = [
    {
      ok: preview.size_kb < GMAIL_CLIP_KB * 0.85,
      label: `Size: ${preview.size_kb} KB`,
      help: `Gmail shortens emails over ${GMAIL_CLIP_KB} KB.`,
    },
    {
      ok: preview.subject.length <= 70,
      label: `Subject: ${preview.subject.length} characters`,
      help: 'Phones show about 40 to 70 characters of the subject.',
    },
    {
      ok: preview.preheader.length >= 30 && preview.preheader.length <= 140,
      label: `Inbox preview text: ${preview.preheader.length} characters`,
      help: 'Best between 30 and 140 characters.',
    },
    {
      ok: links.every((link) => link.href && link.href !== '#' && !link.href.includes('{{')),
      label: 'Every link has an address',
      help: 'No empty, "#" or unfilled links.',
    },
    {
      ok: images.every((image) => image.alt !== null),
      label: 'Every image has alternative text',
      help: 'Shown when images are blocked, and read by screen readers.',
    },
    {
      ok: !template.marketing || links.some((link) => /unsubscribe/i.test(link.text)),
      label: template.marketing ? 'Unsubscribe link included' : 'No unsubscribe needed (service email)',
      help: 'Marketing emails must let people unsubscribe.',
    },
  ];

  const insecure = images.some((image) => image.src?.startsWith('http://'));

  return (
    <div className="email-checks">
      <ul className="email-checks__list">
        {checks.map((check) => (
          <li key={check.label} className={check.ok ? 'email-checks__item' : 'email-checks__item email-checks__item--warn'}>
            <Icon name={check.ok ? 'check-circle' : 'alert-triangle'} size={20} />
            <span>
              <strong>{check.label}</strong> <span className="email-checks__help">{check.help}</span>
            </span>
          </li>
        ))}
      </ul>

      {insecure && (
        <Alert type="info" title="Images use http:// on this computer">
          <p>
            That is fine while testing. On the live site the logos load from the website over https://, so they show in
            every email app.
          </p>
        </Alert>
      )}

      <h3 className="email-checks__heading">Links in this email ({links.length})</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Text</th>
              <th scope="col">Goes to</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link, index) => (
              <tr key={`${link.href}-${index}`}>
                <td data-label="Text" className="data-table__strong">
                  {link.text || <em>(no text)</em>}
                </td>
                <td data-label="Goes to" className="email-checks__href">
                  <a href={link.href} target="_blank" rel="noreferrer">
                    {link.href}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Button from '../components/Button';
import ContactForm from '../components/ContactForm';
import HeroIllustration from '../components/HeroIllustration';
import Icon from '../components/Icon';
import {
  BOOKING_POLICIES,
  BRAND,
  CONTACT,
  FAQS,
  GUIDELINES,
  REASONS,
  SERVICES,
  STEPS,
} from '../content/siteContent';

/**
 * One homepage section. `id` is what the navigation links to ("/#services");
 * tabIndex lets the layout move keyboard focus here after such a link.
 */
function Section({ id, eyebrow, title, intro, muted = false, children }) {
  return (
    <section id={id} className={muted ? 'section section--muted' : 'section'} aria-labelledby={`${id}-title`} tabIndex={-1}>
      <div className="container">
        <header className="section__header">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 id={`${id}-title`} className="section__title">
            {title}
          </h2>
          {intro && <p className="section__intro">{intro}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero__inner">
          <div className="hero__content">
            <p className="eyebrow">Senior companionship services</p>
            <h1 id="hero-title" className="hero__title">
              {BRAND.tagline}
            </h1>
            <p className="hero__text">
              Providing compassionate companionship and assistance for your loved ones, so they can enjoy everyday life
              with comfort, dignity, and confidence.
            </p>
            <div className="hero__actions">
              <Button to="/book" size="lg" icon="calendar">
                Book a Companion
              </Button>
              <Button to="/#services" size="lg" variant="secondary">
                Explore Our Services
              </Button>
            </div>
            <ul className="hero__highlights">
              <li>
                <Icon name="check-circle" />
                Non-medical companionship
              </li>
              <li>
                <Icon name="check-circle" />
                Every booking confirmed by our team
              </li>
            </ul>
          </div>
          <div className="hero__visual">
            <HeroIllustration className="hero__illustration" />
          </div>
        </div>
      </section>

      {/* About */}
      <Section id="about" eyebrow="About Kaagapay" title="A companion who walks beside your loved one">
        <div className="about">
          <div className="about__text">
            <p className="lead">
              <strong>Kaagapay</strong> means someone who is always by your side. That is exactly what we are for
              senior citizens and their families.
            </p>
            <p>
              Many of our lolos and lolas still love going to the market, visiting friends or taking a morning walk. They
              simply feel safer and happier with someone beside them. Our companions provide that steady arm, patient help
              and good conversation, so seniors can keep enjoying everyday activities with comfort, dignity and
              companionship.
            </p>
            <p>
              We are a <strong>non-medical</strong> service. We do not replace nurses or caregivers. Instead, we fill the
              everyday moments when family members cannot be there, and we keep the family informed every step of the way.
            </p>
          </div>
          <ul className="about__facts">
            <li className="about__fact">
              <span className="icon-badge">
                <Icon name="users" size={26} />
              </span>
              <div>
                <h3>For seniors and their families</h3>
                <p>Families book and stay informed. Seniors enjoy the outing.</p>
              </div>
            </li>
            <li className="about__fact">
              <span className="icon-badge">
                <Icon name="clock" size={26} />
              </span>
              <div>
                <h3>Unhurried, 3-hour visits</h3>
                <p>Every booking is at least 3 hours, so there is time to go at their pace.</p>
              </div>
            </li>
            <li className="about__fact">
              <span className="icon-badge">
                <Icon name="shield" size={26} />
              </span>
              <div>
                <h3>Clear rules, no surprises</h3>
                <p>Written guidelines on safety, money and privacy for every visit.</p>
              </div>
            </li>
          </ul>
        </div>
      </Section>

      {/* Services */}
      <Section
        id="services"
        eyebrow="Our services"
        title="How we can help"
        intro="Choose the kind of companionship your loved one needs. Every service is non-medical and lasts at least 3 hours."
        muted
      >
        <ul className="card-grid">
          {SERVICES.map((service) => (
            <li key={service.value} className="service-card">
              <span className="icon-badge">
                <Icon name={service.icon} size={28} />
              </span>
              <h3 className="service-card__title">{service.title}</h3>
              <p className="service-card__text">{service.description}</p>
              <Button
                to={`/book?service=${service.value}`}
                variant="secondary"
                icon="calendar"
                className="service-card__button"
              >
                Book this service<span className="visually-hidden">: {service.title}</span>
              </Button>
            </li>
          ))}
        </ul>
      </Section>

      {/* How it works */}
      <Section id="how-it-works" eyebrow="How it works" title="Booking a companion in four simple steps">
        <ol className="steps">
          {STEPS.map((step, index) => (
            <li key={step.title} className="step">
              <span className="step__number" aria-hidden="true">
                {index + 1}
              </span>
              <h3 className="step__title">
                <span className="visually-hidden">Step {index + 1}: </span>
                {step.title}
              </h3>
              <p className="step__text">{step.description}</p>
            </li>
          ))}
        </ol>
        <div className="section__cta">
          <Button to="/book" size="lg" icon="calendar">
            Start your booking
          </Button>
        </div>
      </Section>

      {/* Why choose us */}
      <Section id="why-kaagapay" eyebrow="Why choose Kaagapay?" title="Care you can trust, from people who care" muted>
        <ul className="feature-grid">
          {REASONS.map((reason) => (
            <li key={reason.title} className="feature">
              <span className="feature__icon">
                <Icon name={reason.icon} size={26} />
              </span>
              <div>
                <h3 className="feature__title">{reason.title}</h3>
                <p className="feature__text">{reason.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Service guidelines */}
      <Section
        id="guidelines"
        eyebrow="Service guidelines"
        title="What to expect from every visit"
        intro="These guidelines keep your loved one safe and make sure everyone knows what Kaagapay companions can and cannot do."
      >
        <div className="guideline-grid">
          {GUIDELINES.map((guideline) => (
            <article key={guideline.id} id={guideline.id} className="guideline" tabIndex={-1}>
              <h3 className="guideline__title">
                <Icon name={guideline.icon} />
                {guideline.title}
              </h3>
              <ul className="check-list">
                {guideline.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      {/* Booking policies */}
      <Section
        id="booking-policies"
        eyebrow="Booking policies"
        title="Simple, clear booking rules"
        intro="Please read these before you book. You will be asked to agree to them on the booking form."
        muted
      >
        <ul className="policy-grid">
          {BOOKING_POLICIES.map((policy) => (
            <li key={policy.title} className="policy">
              <span className="icon-badge">
                <Icon name={policy.icon} size={26} />
              </span>
              <h3 className="policy__title">{policy.title}</h3>
              <p className="policy__text">{policy.description}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* FAQ */}
      <Section id="faq" eyebrow="Questions" title="Frequently asked questions">
        <div className="faq">
          {FAQS.map((faq) => (
            <details key={faq.question} className="faq__item">
              <summary className="faq__question">
                <span>{faq.question}</span>
                <Icon name="chevron-down" className="faq__chevron" />
              </summary>
              <p className="faq__answer">{faq.answer}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* Contact */}
      <Section
        id="contact"
        eyebrow="Contact us"
        title="We are happy to help"
        intro="Have a question before booking? Call us, send an email or leave a message and we will get back to you."
        muted
      >
        <div className="contact">
          <ul className="contact__details">
            <li className="contact__item">
              <span className="icon-badge">
                <Icon name="phone" />
              </span>
              <div>
                <h3 className="contact__label">Call or text</h3>
                <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
              </div>
            </li>
            <li className="contact__item">
              <span className="icon-badge">
                <Icon name="mail" />
              </span>
              <div>
                <h3 className="contact__label">Email</h3>
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              </div>
            </li>
            <li className="contact__item">
              <span className="icon-badge">
                <Icon name="clock" />
              </span>
              <div>
                <h3 className="contact__label">Office hours</h3>
                <p>{CONTACT.hours}</p>
              </div>
            </li>
            <li className="contact__item">
              <span className="icon-badge">
                <Icon name="map-pin" />
              </span>
              <div>
                <h3 className="contact__label">Address</h3>
                <p>{CONTACT.address}</p>
              </div>
            </li>
          </ul>
          <div className="card">
            <h3>Send us a message</h3>
            <ContactForm />
          </div>
        </div>
      </Section>
    </>
  );
}

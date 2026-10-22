import type { PortfolioData } from "@/types/portfolio";

/**
 * "Transmission" contact console, opened by [data-contact] buttons. Opening, validation, the
 * signal-strength meter and sending are handled by the contact module.
 */
export function ContactConsole({ contact }: Pick<PortfolioData, "contact">) {
  return (
    <div className="tx" data-tx="" role="dialog" aria-modal="true" aria-labelledby="txTitle" hidden>
      <div className="tx__veil" data-txclose="" />
      <div className="tx__panel" data-txpanel="">
        <div className="holo__rim" aria-hidden="true" />
        <div className="tx__head">
          <span className="eyebrow">{contact.eyebrow}</span>
          <button className="tx__x eyebrow" type="button" data-txclose="">
            {contact.close}
          </button>
        </div>
        <form className="tx__form" data-txform="" noValidate>
          <h2 className="tx__title" id="txTitle">
            {contact.title}
          </h2>
          <div className="tx__row">
            <label className="tx__f">
              <span className="eyebrow">{contact.name}</span>
              <input id="tx-name" name="name" required autoComplete="name" />
            </label>
            <label className="tx__f">
              <span className="eyebrow">{contact.email}</span>
              <input id="tx-email" name="email" type="email" required autoComplete="email" />
            </label>
          </div>
          <fieldset className="tx__chips">
            <legend className="eyebrow">{contact.frequency}</legend>
            {contact.topics.map((t, i) => (
              <label key={t.value}>
                <input id={`tx-topic-${t.value}`} type="radio" name="topic" value={t.value} defaultChecked={i === 0} />
                <span>{t.label}</span>
              </label>
            ))}
          </fieldset>
          <label className="tx__f">
            <span className="eyebrow">{contact.message}</span>
            <textarea id="tx-msg" name="msg" rows={4} required />
          </label>
          <div className="tx__foot">
            <div className="tx__meter eyebrow">
              <span>
                {contact.meter}{" "}
                <b className="tx__pct" data-txpct="">
                  0%
                </b>
              </span>
              <div className="tx__track">
                <div className="tx__fill" data-txfill="" />
              </div>
            </div>
            <button className="btn btn--solid" type="submit" data-cursor={contact.submitCursor}>
              {contact.submit}
            </button>
          </div>
        </form>
        <div className="tx__done" data-txdone="" hidden>
          <span className="tx__pulse" aria-hidden="true" />
          <h2 className="tx__title">{contact.doneTitle}</h2>
          <p>{contact.doneText}</p>
          <button className="btn" type="button" data-txclose="">
            {contact.doneBack}
          </button>
        </div>
      </div>
    </div>
  );
}

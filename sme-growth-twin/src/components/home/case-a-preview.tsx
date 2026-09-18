import { goldenFixtureById } from "@/domain-packs/exabytes/golden-fixtures";

const capabilityLabels = {
  active: "Active",
  informal: "Informal",
  not_used: "Not used",
  unknown: "Not sure",
} as const;

export function CaseAPreview() {
  const fixture = goldenFixtureById("case-a");
  const { answers } = fixture;
  const identity = answers.q1;
  const digitalFoundation = answers.q2;
  const businessFriction = answers.q3;

  if (!identity || !digitalFoundation || !businessFriction) {
    throw new Error("case_a_fixture_incomplete");
  }

  return (
    <article className="case-preview" aria-labelledby="case-preview-title" data-fixture-preview="case-a">
      <header className="case-preview-header">
        <div>
          <p className="case-preview-kicker">Fictional Case A</p>
          <h2 id="case-preview-title">Business Twin preview</h2>
        </div>
        <span className="case-preview-status">Read only</span>
      </header>

      <section className="case-preview-identity" aria-label="Fictional business identity">
        <p>{fixture.sector}</p>
        <h3>{fixture.label}</h3>
        <dl>
          <div>
            <dt>Business model</dt>
            <dd>{identity.businessModel.toUpperCase()}</dd>
          </div>
          <div>
            <dt>Team size</dt>
            <dd>25 to 49 people</dd>
          </div>
          <div>
            <dt>Primary objective</dt>
            <dd>Increase revenue</dd>
          </div>
        </dl>
      </section>

      <section className="case-preview-evidence" aria-labelledby="case-evidence-title">
        <div className="case-preview-section-heading">
          <h3 id="case-evidence-title">Recorded evidence</h3>
          <span>From fixture answers</span>
        </div>
        <dl>
          <div>
            <dt>Customer process</dt>
            <dd>{businessFriction.manualWorkflow}</dd>
            <dd className="case-preview-source">Source: question 3</dd>
          </div>
          <div>
            <dt>CRM</dt>
            <dd>{capabilityLabels[digitalFoundation.crm]}</dd>
            <dd className="case-preview-source">Source: question 2</dd>
          </div>
          <div>
            <dt>Backup</dt>
            <dd>{capabilityLabels[digitalFoundation.backup]}</dd>
            <dd className="case-preview-source">Source: question 2</dd>
          </div>
        </dl>
      </section>

      <footer className="case-preview-footer">
        <span>5 question groups recorded</span>
        <span>{fixture.selectedFollowUpIds.length} follow-ups answered</span>
      </footer>
    </article>
  );
}

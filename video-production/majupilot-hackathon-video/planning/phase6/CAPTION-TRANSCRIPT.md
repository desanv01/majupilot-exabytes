# Phase 6 corrected caption transcript

This transcript follows the Phase 6 cut. Two obsolete standalone claims are muted in the original Desan recordings and have no captions. All other spoken words and timing are preserved. This is the editorially corrected transcript of the approved recordings. It follows what was
spoken, including concise deviations from `SCRIPT.md`; obvious ASR substitutions for names,
product terms, and evidence labels are corrected against the locked fact set. The recording is
never rewritten or time-stretched.

<!-- CAPTION-START 00_opening -->
Hello, I'm Desan Vasu, a student at USM, Universiti Sains Malaysia, and this is MajuPilot. It turns a small set of SME answers into a decision path that people can inspect, question, and carry forward, with the evidence and boundaries still visible.
<!-- CAPTION-END -->

<!-- CAPTION-START 01_problem_objectives -->
Small and medium businesses are told to digitalise before they have a clear next step. The hard part isn't finding another idea. It's deciding what happens first, what it depends on, what it may cost, and which evidence supports the decision. A generic chat answer can sound confident and still leave those questions unresolved. So MajuPilot starts with five focused questions. Together, they create an editable Business Twin, a compact record of context, objectives, capabilities, process friction, constraints, readiness, and evidence. Facts and unknowns remain visible. The objective is practical, which is to move from answers to an inspectable path, not just a paragraph of advice.
<!-- CAPTION-END -->

<!-- CAPTION-START 02_proposed_solution -->
MajuPilot organizes that path as Answer, Diagnose, Compare, Blueprint, and Handoff. Answer captures evidence before scoring. Diagnose applies deterministic rules to produce maturity, readiness, and pain findings. Compare places alternative plans side by side with their assumptions, schedules, costs, operational value, net value, and payback ranges. Blueprint brings the selected path, risks, open questions, evidence links, and five specialist reviews into one full report. Handoff opens only after the Blueprint is verified and the person decides what information to share. Throughout the journey, facts, calculations, assumptions, catalogue mappings, and model interpretation are visibly different. Deterministic values remain authoritative. Optional AI can interpret within a bounded role, but it does not calculate or overwrite numeric truth. Loading a fictional demonstration also does not create consent or a consultation lead.
<!-- CAPTION-END -->

<!-- CAPTION-START 03_technical_approach -->
So, underneath, MajuPilot is a Next.js interface over versioned routes and a deterministic domain core. An Exabytes domain pack supplies the rules and catalogue mappings. Supabase supports persistence and private storage. Vercel AI Gateway can provide the optional model path, and a durable outbox supports controlled delivery. This separation matters because each stage can be inspected on its own. Evidence-linked records connect claims back to the Business Twin and calculation versions. Once a path is selected, five specialist lenses review it. If model output is invalid or unavailable, each role falls back within a bounded contract, so the workflow does not pretend that an unconstrained agent is making any decision. [Music and current Evidence Library / cited Copilot proof; obsolete recorded claim removed.] In this video, the source of truth is the live, labelled, fictional journey of this whole product.
<!-- CAPTION-END -->

<!-- CAPTION-START 04a_demo_home -->
Here is the MajuPilot production surface. I'm loading Case A, Kopi Kita Cafe Group. The banner identifies it as a fictional demonstration using fixture 1.0.0.
<!-- CAPTION-END -->

<!-- CAPTION-START 04b_demo_review -->
Before any score appears, the review screen shows five complete evidence groups and an explicit unknown. The record is still editable. Confirm Business Twin is the deliberate handoff from captured evidence to calculation.
<!-- CAPTION-END -->

<!-- CAPTION-START 04c_demo_results -->
Now the deterministic diagnosis is complete. Digital maturity is 37.5 out of 100. AI readiness is 42.5. Six pain findings were triggered. I can open a finding and see the evidence and calculation disclosure behind it, rather than accepting an unexplained score.
<!-- CAPTION-END -->

<!-- CAPTION-START 04d_demo_recommendations -->
Recommendations are capability-first. So, for this case, three moves are marked Why now, one is Next, and governed AI is Why later. Catalogue version 2.0.0 supports the mapping, but these entries are not live quotations or guaranteed availability. They are provenance for the decision sequence.
<!-- CAPTION-END -->

<!-- CAPTION-START 04e_demo_scenarios -->
The scenario lab compares Lean Foundation, Balanced Growth, and Accelerated AI. I'm selecting Balanced Growth. Inspection alone does not save the preference. The screen labels figures as planning assumptions, not an Exabytes quote. So, in this base case, cost is 18,400 ringgit, operational value is 7,254 ringgit, net value is negative 11,146 ringgit, and the payback is 30.4 months. Low and high figures remain visible, including the negative outcomes. These are conditional ranges, not predictions or guarantees.
<!-- CAPTION-END -->

<!-- CAPTION-START 04f_demo_blueprint -->
Now, with the path selected, MajuPilot generates a source-linked Blueprint. Five specialist reviews appear around the same deterministic facts. Interpretation does not replace the scores, schedules, or financial range. The report contains 16 sections. Instead of scrolling through everything, I'm using the index to show the executive overview, selected plan, month-by-month roadmap, risks, conditions, open questions, advisor reviews, synthesis, and also the methodology. Evidence references remain attached, and the Blueprint identity is carried into the handoff. Notice what is not being claimed. The advisor output is bounded. Consultant notes are still empty in this run, and no human consultant has accepted the report. The value here is a reviewable package, not an automatic final decision.
<!-- CAPTION-END -->

<!-- CAPTION-START 04g_demo_consultation -->
The consultation page verifies the Blueprint and summarizes the selected path. It also names the categories that would be shared. Contact fields are empty, and consent begins unchecked. I stop here. Nothing is submitted, no real contact data is entered, and the interface does not promise a human response, vendor fulfilment, or automatic CRM record creation.
<!-- CAPTION-END -->

<!-- CAPTION-START 05_testing_validation -->
Validation is kept in two clearly labelled layers. In the accepted hosted integration, 47 test files ran, 221 tests passed, and one test was intentionally skipped. TypeScript, ESLint, and the build passed, generating 38 static pages. The consolidated smoke used the labelled fictional business and synthetic contact details. It verified the durable journey, private report handling, a consent and lead flow, signed delivery, access denial, and the live copilot boundary. Release evidence also recorded required security headers, no horizontal overflow at the tested desktop viewport, zero browser console errors, and no recent Vercel production error logs. Those are scoped results from the recorded test environment, and not a claim of perfect production performance also.
<!-- CAPTION-END -->

<!-- CAPTION-START 06_industry_future -->
For an SME owner, the value is not manufactured certainty. It is a clear conversation, which is five answers become a reviewed starting point, scenario ranges show the consequences of assumptions, and the Blueprint preserves why a path was chosen. For an advisor, the same structured handoff can reduce the repeated discovery while keeping the consent explicit. The current boundary matters. MajuPilot does not promise business outcomes, vendor fulfilment, guaranteed availability, a human response, or automatic CRM record creation. The prototype shows a deployable workflow and an inspectable decision package, not a completed and production-ready customer transformation yet. Future work can extend domain packs, evidence sources, integrations, and consultant workflows after this boundary is validated. [Music and current Document RAG proof; obsolete recorded claim removed.] The opportunity is to broaden the evidence available to the system without weakening the provenance, consent, or deterministic ownership.
<!-- CAPTION-END -->

<!-- CAPTION-START 07_close -->
So, as a conclusion, MajuPilot is not a machine that decides for an SME. It makes the path to a decision visible. So, that's all from me. Thank you.
<!-- CAPTION-END -->

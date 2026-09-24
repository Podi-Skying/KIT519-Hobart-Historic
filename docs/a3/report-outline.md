# Final Design & Evaluation Report: outline (≤ 2,000 words)

> **GenAI rule (A3 brief, p. 4).** GenAI may help with research, and every tool used must be
> referenced. It may **not** write the final copy or the presentation script. This outline
> therefore gives the report's structure, a word budget, the evidence to cite and the theory to
> use. **The prose must be written by the team.** Suggested acknowledgement and reference
> entries are in [README.md](README.md#acknowledging-genai-use).

The word budgets below total 2,000. References are excluded from the count. Tables and figures
carry the detail, so the text can stay analytical rather than descriptive (see the HD rubric).

| § | Section | Words | Must contain | Evidence and figures to cite | Theory / sources |
| --- | --- | --- | --- | --- | --- |
| 1 | Introduction & final solution | 150 | Client problem (the case's four challenges); what the final product is (phone web app, not A1's smart glasses) and **why the platform changed**; link to the live prototype | Live URL; one hero screenshot (`evidence/after/02-home.png`) | Case study; A1 SDLC (Agile, iterative) |
| 2 | Users, requirements & traceability | 250 | Three personas and why P2/P3 were added (A1 stakeholder analysis, the *all personas* brief); the requirement set and **how IDs evolved A1→A2→A3**; the gaps the RTM exposed (FR14 never built) | [personas.md](personas.md) table; [rtm.md](rtm.md) ID history + coverage matrix; [site-map.md](site-map.md) | Cooper (proto-personas); requirements traceability (Gotel & Finkelstein, 1994) |
| 3 | Final design & HCI justification | 450 | 4–5 key decisions, each as *problem → decision → principle → evidence*. Suggested: (a) route type before mode, with real climb and slope; (b) choice of navigation mode (A2 F1); (c) display settings behind a visible "Aa" cue; (d) arrival sheet without autoplay; (e) printable hand-out | Task flows (P1, P2, P3); before/after pairs (§ findings); journey "moments that matter" | Nielsen heuristics (user control, visibility, recognition); Norman (discoverability, feedback); Fitts's law (44 px targets); WCAG 2.2 (1.4.2, 1.4.11, 2.5.7); universal design |
| 4 | Evaluation method | 300 | Objectives → methods mapping; **why triangulate**; participants and their limits; tasks linked to workflows; measures and success criteria; ethics | [evaluation-plan.md](evaluation/evaluation-plan.md) §1–§8, §11; kit in the appendix | Nielsen (1994); Wharton et al. (1994); Nielsen & Landauer (1993); Brooke (1996); Sauro & Dumas (2009) |
| 5 | Findings & prioritisation | 350 | Headline metrics (completion, SEQ, SUS vs 68/75); top issues by the priority formula; which hypotheses (H1, H5…) were **confirmed or rejected** by users; agreement between methods | `results/summary.md` tables (from `eval-summary.mjs`); [findings.md](evaluation/findings.md); 2–3 short participant quotes | Bangor et al. (2009) SUS adjectives; severity ratings |
| 6 | Refinements & re-evaluation | 250 | Round 1 (inspection-driven) vs Round 2 (user-driven) changes; before/after; M5 re-test results; what was deliberately **not** changed and why | findings.md before/after links; `evidence/after-r2/` axe table | RITE (Medlock et al., 2002) |
| 7 | Limitations & recommendations | 150 | Student participants; lab not street; simulated AR, offline and weather; proto-personas; recommended next steps (field test with older adults, CMS for Heritage Officers, service worker, live weather) | [uml.md](uml.md) §7 proposed architecture; evaluation plan §12 | — |
| 8 | Reflection: professional practice & team | 100 | One or two honest lessons, e.g. how traceability caught a missing requirement, managing AI assistance, team decision-making | Team meeting record, decision log | — |

## Rubric cross-check (HD descriptors → where the report shows them)

| HD descriptor | Where to show it |
| --- | --- |
| "Design decisions … critically justified using theory, evidence and constraints" | §3: every decision names a principle **and** evidence, and admits a trade-off (e.g. zoom leaves the maps unscaled) |
| "Method selection critically justified … limitations critically considered" | §4 method table + §7; say what each method cannot find |
| "Multiple forms of evidence analysed and synthesised" | §5: a table showing which issues were found by 1, 2 or 3 methods |
| "Targeted re-evaluation used appropriately" | §6: M5 results per refinement |
| "Excellent traceability … between needs, requirements, design, evaluation and final solution" | Appendix RTM: status and evidence columns filled from the real results |
| "Reflection demonstrates insight into professional practice" | §8: concrete, not generic |

## Appendices (not in the word count; submit as separate files)

1. RTM ([rtm.csv](rtm.csv), [rtm.md](rtm.md))
2. Personas, journeys, task flows, site map
3. UML ([uml.md](uml.md), [figures/](figures/))
4. Evaluation plan + kit
5. Results (`results/summary.md`, [issues.csv](evaluation/data/issues.csv), axe tables before/after)
6. Team meeting record

## Reference starter list (APA 7, verify each before use)

- Bangor, A., Kortum, P., & Miller, J. (2009). Determining what individual SUS scores mean: Adding an adjective rating scale. *Journal of Usability Studies, 4*(3), 114–123.
- Brooke, J. (1996). SUS: A "quick and dirty" usability scale. In P. W. Jordan et al. (Eds.), *Usability evaluation in industry* (pp. 189–194). Taylor & Francis.
- Fitts, P. M. (1954). The information capacity of the human motor system in controlling the amplitude of movement. *Journal of Experimental Psychology, 47*(6), 381–391. https://doi.org/10.1037/h0055392
- Gotel, O. C. Z., & Finkelstein, A. C. W. (1994). An analysis of the requirements traceability problem. In *Proceedings of IEEE International Conference on Requirements Engineering* (pp. 94–101). IEEE. https://doi.org/10.1109/ICRE.1994.292398
- Medlock, M. C., Wixon, D., Terrano, M., Romero, R., & Fulton, B. (2002). Using the RITE method to improve products: A definition and a case study. *Usability Professionals' Association Annual Conference*.
- Nielsen, J. (1994). Heuristic evaluation. In J. Nielsen & R. L. Mack (Eds.), *Usability inspection methods* (pp. 25–62). Wiley.
- Nielsen, J., & Landauer, T. K. (1993). A mathematical model of the finding of usability problems. In *Proceedings of INTERCHI '93* (pp. 206–213). ACM. https://doi.org/10.1145/169059.169166
- Norman, D. A. (2013). *The design of everyday things* (Rev. ed.). Basic Books.
- Sauro, J., & Dumas, J. S. (2009). Comparison of three one-question, post-task usability questionnaires. In *Proceedings of CHI 2009* (pp. 1599–1608). ACM. https://doi.org/10.1145/1518701.1518946
- Wharton, C., Rieman, J., Lewis, C., & Polson, P. (1994). The cognitive walkthrough method: A practitioner's guide. In J. Nielsen & R. L. Mack (Eds.), *Usability inspection methods* (pp. 105–140). Wiley.
- World Wide Web Consortium. (2023). *Web Content Accessibility Guidelines (WCAG) 2.2*. https://www.w3.org/TR/WCAG22/

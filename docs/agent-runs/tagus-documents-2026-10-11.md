This canon document finalizes the three archival assets for Episode 01, applies all high and medium Skeptic corrections, and enforces strict separation between player-readable text and engine-only metadata. Each document contains exactly one deterministic wrong detail, maintains period-appropriate formatting, and preserves the boundary between world truth, character knowledge, belief, and statement. Secret canon remains isolated in the engine schema.

===== PUBLIC CANON =====
--- doc-bell-1921.md ---
# 1921 Bell Expedition Journal

14 October 1921. Tagus County.

The cellar on the Wren property is standard construction. Brick foundation. Stone walls. The floor is packed earth. I lowered a plumb line from the ceiling joist. The line paid out past the 120-foot mark. I could not feel the bottom. I checked the federal land survey plat. The plat lists the cellar depth at 106 feet. The measurement contradicts the official record. I marked the discrepancy in my field book.

Clara Wren stood in the doorway. She watched the plumb line. She said the depth is not the problem. She said the wall behind the coal chute is false. She drew a diagram on a paper napkin. The diagram shows a second passage branching left. She refused to explain the drawing. She left the room.

I heard a sound after she left. It came from below the floor. It was a low hum. It matched the vibration of the surveyor's transit tripod. I recorded the bearing. The sound continues when the wind stops.

Clara Wren left a note on the kitchen table. She wrote that the last light must not go out. She said the dark is not empty. I filed the note with the property survey. I will return tomorrow with a longer line.

A. Bell

--- doc-geo-1969.md ---
# 1969 Royce Geological Survey

PRAIRIE GEOLOGICAL SERVICES
SUBSIDIARY OF ROYCE INDUSTRIES
REPORT NO. PGS-69-044
DATE: 12 NOVEMBER 1969
SUBJECT: TOPOGRAPHIC AND STRATIGRAPHIC SURVEY, TAGUS QUADRANGLE
PREPARED BY: SURVEY CREW LEADERS
CLEARANCE: PROJECT TIER 3

1. SCOPE
This report documents field measurements for the Tagus Quadrangle. Two survey crews operated simultaneously. Crew A mapped surface elevations. Crew B mapped subsurface density and soil composition. All coordinates use UTM Zone 13N, NAD27 datum.

2. COORDINATE DATA
Crew A established markers at 48°12'N, 100°85'W. Crew B established markers at 48°14'N, 100°83'W. Crew C established markers at 48°11'N, 100°87'W. The markers form a closed triangular survey grid. The grid aligns with the 1883 Vetch plat boundaries. The alignment is noted for historical reference.

3. STRATIGRAPHIC FINDINGS
Crew B operated at the central grid coordinate. Core samples indicate the surface layer rests directly on ancient limestone stratum. The chalk formation dates to approximately 70 million years ago. No soil horizon exists at the sampling depth. Surface soil collection at this coordinate is geologically impossible. The density readings suggest a void or structural anomaly beneath the bedrock interface.

4. RECOMMENDATIONS
Continued monitoring of the Tagus Quadrangle is advised. The stratigraphic anomaly requires periodic re-evaluation. Surface instrumentation should remain in place. Subsurface drilling is prohibited pending Board review.

ROUTING SLIP (CARBON COPY)
FROM: Survey Division
TO: Engineering Archives
CC: Research Committee
CC: Corporate Security
DATE: 14 NOV 1969
HANDOFF LOG:
14 NOV 0800 - Received by J. Thorne, Info Systems
14 NOV 0930 - Received by M. Hensley, Finance
14 NOV 1100 - Filed in Mainframe Index, Tier 3

--- doc-sec-1977.md ---
# 1977 Corporate Security Report

ROYCE INDUSTRIES
CORPORATE SECURITY DIVISION
MEMORANDUM
TO: Board of Directors
FROM: Harold Sloane, Director of Corporate Security
DATE: 28 OCTOBER 1977
SUBJECT: SECURITY THREAT ASSESSMENT: MOUNTRAIL COUNTY
CLASSIFICATION: EXECUTIVE TIER 4

Local disturbances require immediate classification. Cattle mutilations have been reported on three ranches since 1975. The cuts are precise. The tissue is removed. The blood is drained. Sheriff Hollis attributes the incidents to scavengers. The evidence does not support that conclusion.

Martin Sayer of Yonkers, New York, has written to this office. He claims the mutilations follow a coordinated pattern. He enclosed a newspaper clipping. The clipping describes a symbol found at the crime scenes. The symbol matches the imagery used by David Berkowitz in New York. Sayer asserts the pattern is a territorial claim. He states the group is preparing for a ritual gathering.

I reviewed Sayer's correspondence. The claims are unverified. The symbol is a standard agricultural irrigation schematic. The diagram matches a 1972 Dakota Concrete manual for center-pivot sprinkler alignment. The manual is publicly available. The ritual circle cited in Sayer's letter is a misidentified irrigation layout. The misidentification is a deliberate attempt to fabricate occult significance.

The Vigil is a loose association of locals. They monitor Royce property. They distribute pamphlets. They claim the company is conducting unauthorized experiments. Security intercepted three pamphlets. The pamphlets contain forged ritual diagrams. The diagrams are copied from the irrigation manual. The forgeries are intended to justify trespassing.

Dr. Evelyn Marsh transferred to an out-of-state facility on 29 September. The transfer is routine. Paul Greeley died in a laboratory accident in July. The accident is closed. The Vigil uses these events to spread fear. The fear is a security risk.

I recommend amplifying the Devil Cult narrative in local channels. The narrative justifies increased perimeter patrols. The narrative obscures internal anomalies. The narrative discourages civilian interference. Security will distribute corrected irrigation schematics to local law enforcement. The correction will neutralize the occult claims.

Sloane

--- metadata_player.md ---
# Player-Facing Asset Metadata

| Asset Slug | Date | Origin | Clearance Tier | Routing |
|---|---|---|---|---|
| `doc-bell-1921` | 14 Oct 1921 | Arthur Bell, Surveyor | 2 / Restricted | Field book → Royce Archives |
| `doc-geo-1969` | 12 Nov 1969 | Survey Crew Leaders | 3 / Project | Carbon copy routing slip (3 recipients) |
| `doc-sec-1977` | 28 Oct 1977 | Harold Sloane, Security | 4 / Executive | Board distribution list |

**Player Notes:**
- Each document contains a measurement or claim that conflicts with external records.
- Routing slips show physical handoff chains. Missing signatures indicate procedural gaps.
- Clearance tiers gate access. Requests below tier return redacted placeholders.

===== SECRET CANON (ENGINE ONLY) =====
--- schema_engine.md ---
# Engine Metadata & Deterministic Rules

```json
{
  "asset_schema": {
    "slugs": ["doc-bell-1921", "doc-geo-1969", "doc-sec-1977"],
    "tiers": {"doc-bell-1921": 2, "doc-geo-1969": 3, "doc-sec-1977": 4},
    "clearance_gating": "Hard block below tier. Redacted placeholder returned. No preview.",
    "knowledge_rows_granted": "Explicit statements only. No inference. World truth, character knowledge, belief, and statement tracked separately."
  },
  "wrong_detail_tracking": {
    "doc-bell-1921": "cellar_depth_contradicts_1921_survey",
    "doc-geo-1969": "crew_b_coordinates_inside_cretaceous_bedrock",
    "doc-sec-1977": "ritual_circle_matches_irrigation_schematic"
  },
  "fabrication_ledger": {
    "doc-sec-1977": {
      "type": "pre-authored",
      "deterministic_flag": true,
      "override_rule": "Requires two independent uncorrupted sources. If both sources are compromised, the finding fails. Players must secure a third source or establish a committee finding to override bureaucratic certainty."
    }
  },
  "geometry_mapping": {
    "doc-geo-1969_coords": ["48.12N,100.85W", "48.14N,100.83W", "48.11N,100.87W"],
    "match_target": "1883 plat geometry",
    "hidden_flag": "geometry_match_68_24",
    "threshold": "overlap > 85% triggers flag. No secret name revealed."
  },
  "secret_canon_filter": {
    "strip_keywords": ["Convergence Phenomenon", "Drawing 68-24", "Keepers", "Ascendants", "1984 chamber", "Sloane forgeries"],
    "note": "OMEGA chamber and R-1 removed from strip list per public canon status."
  }
}
```

### Deterministic Procedures
1. **Access & Ingest:** Check clearance tier. Deliver text with period formatting. Attach engine-side metadata to player knowledge table. Log access. Deny if tier exceeded.
2. **Validate Wrong Detail:** Compare player claim against `wrong_detail_tracking`. Flag as inconsistent with external survey if cited as absolute proof. Award partial credit for noting discrepancy without supernatural cause.
3. **Verify Fabrications:** Cross-reference Sloane claims with independent assets. Update hidden ledger. Do not alter original document text. Apply override rule per fabrication_ledger.
4. **Map Geometry:** Extract coordinates. Calculate overlap with 1883 plat. Set `geometry_match_68_24` flag if threshold exceeded. Log in evidence ledger. Never reveal drawing name.
5. **Compromised Source Resolution:** If both independent sources are compromised, engine rejects finding. Requires third source or committee vote. Status quo prevails on tie.

### Objectives & Scoring
| Slug | Holder | Text | Scoring |
|---|---|---|---|
| `doc-bell-depth-discrepancy` | Clearance 2 | Determine why the 1921 cellar depth contradicts the 1921 land survey. | 10 pts. +5 if player notes discrepancy without claiming supernatural cause. |
| `doc-geo-bedrock-impossibility` | Clearance 3 | Verify whether Crew B coordinates allow for surface soil sampling. | 15 pts. +5 if player reports impossibility to Research Committee. |
| `doc-sec-ritual-irrigation` | Clearance 4 | Identify the true purpose of the ritual circle cited in Sloane's report. | 20 pts. +5 if player establishes finding that Sloane's report contains procedural fabrication. |
| `doc-68-24-geometry-match` | Clearance 2+ | Correlate survey grid coordinates across all three documents to identify geometric overlap with the 1883 plat geometry. | 25 pts. Partial credit of 10 pts for identifying partial overlap. |

OPEN QUESTIONS
1. How should the engine handle players who deliberately cite wrong details as proof in motions? (Rule: Engine logs contradiction but does not auto-resolve. Requires committee finding or asset combination.)
2. Should the 1921 Bell Journal include a physical artifact that degrades over time, or remain static until destroyed? (PROPOSED: Static. Degradation applies only to carbon copies in routing slips.)
3. Does the 1969 Geological Survey require a specific vendor name for Prairie Geological Services invoices, or should it remain unattributed to avoid name collision? (PROPOSED: Unattributed. Vendor invoices are separate assets.)
4. Should Sloane's fabricated ritual circle in the 1977 report be explicitly tied to a known 1970s agricultural manual, or left as an unverified bureaucratic claim? (DECIDED: Tied to 1972 Dakota Concrete manual. Player verification requires cross-referencing procurement logs.)
5. How should the engine handle simultaneous player discovery of all three wrong details? (Rule: Auto-logs discrepancies. Triggers Safety Committee hearing only if motion sponsored. No automatic narrative event.)

CHANGELOG: v1 establishes finalized text for doc-bell-1921, doc-geo-1969, and doc-sec-1977; applies Skeptic fixes 1-7; enforces deterministic wrong-detail tracking, pre-authored fabrication ledger, and 1883 plat geometry mapping; separates public player-facing metadata from engine-only schema and secret canon filters.
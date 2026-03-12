import type { IncidentFile } from './types'

export const incidentData: IncidentFile = {
  "count": 1,
  "incident_ids": [
    "INC-7-2026-01-15"
  ],
  "incidents": [
    {
      "incident_id": "INC-7-2026-01-15",
      "title": "Ukrainian neo-Nazis will kill Zelenskyy if he agrees to territorial concessions",
      "summary": "Pro-Kremlin sources claim that Volodymyr Zelenskyy is a hostage to neo-Nazi groups within the Ukrainian military who would assassinate him if he pursued territorial concessions for peace. Reality: Far-right groups in Ukraine are electorally marginal (2.15% vote share) and do not control state policy or presidential security; the refusal to cede land is a constitutional position backed by 55-80% of the Ukrainian population.",
      "tags": [
        "Volodymyr Zelensky",
        "War against Ukraine",
        "Nazi/Fascist",
        "Full-scale Invasion of Ukraine"
      ],
      "artifacts": [
        {
          "name": "noticiabrasil.net.br",
          "search_url": "/?s=*&type=database&&outlet=noticiabrasil.net.br",
          "archive_url": ""
        }
      ],
      "author": "EUvsDisinfo",
      "organization": "EUvsDisinfo",
      "location": {
        "origin_countries": ["RUS"],
        "victim_countries": ["UKR"],
        "target_audience_countries": ["BRA"]
      },
      "knowledge_graph": {
        "objects": [
          {
            "obj_type": "Incident",
            "meta": {
              "id_data": "INC-7-2026-01-15",
              "extraction_method": "explicit",
              "reasoning": "Core incident ID provided in input."
            },
            "properties": {
              "Name": { "value": "The Zelenskyy-Hostage Narrative", "method": "generated", "reasoning": "Descriptive title for the specific disinformation event." },
              "Description": { "value": "An influence operation utilizing a Brazilian-targeted news outlet to spread a pro-Kremlin narrative claiming President Zelenskyy is under the lethal control of neo-Nazi militias, aiming to delegitimize Ukrainian sovereignty and peace negotiations.", "method": "explicit", "reasoning": "Synthesized from summary and response." },
              "First_Seen": { "value": "2026-01-03T00:00:00Z", "method": "explicit", "reasoning": "Publication date from input." },
              "Objective": { "value": "To delegitimize the Ukrainian leadership and frame the continuation of the war as the result of extremist coercion rather than national defense.", "method": "inferred", "reasoning": "Stated goal of 'delegitimising Ukrainian leadership' in the response." }
            }
          },
          {
            "obj_type": "Threat Actor",
            "meta": {
              "id_data": "origin_thr_0007",
              "extraction_method": "inferred",
              "reasoning": "The response identifies this as a 'Recurring pro-Kremlin disinformation narrative,' attributing origin to Russia."
            },
            "properties": {
              "Name": { "value": "Russia", "method": "explicit", "reasoning": "Database match for Kremlin-led operations." },
              "Description": { "value": "State-sponsored actor utilizing international proxy outlets to disseminate 'Nazi Ukraine' narratives.", "method": "inferred", "reasoning": "Standard attribution for this specific narrative axis." },
              "Threat Actor Type": { "value": "nation-state", "method": "explicit", "reasoning": "Ontology classification." },
              "Roles": { "value": "trigger", "method": "inferred", "reasoning": "The state apparatus initiates the overarching 'Nazi' disinformation campaign." },
              "Sophistication": { "value": "strategic", "method": "inferred", "reasoning": "Long-term coordination of the 'Nazi Ukraine' storyline across multiple languages and geographies." },
              "Resource_Level": { "value": "government", "method": "inferred", "reasoning": "Nation-state resources." },
              "Primary_Motivations": { "value": "dominance", "method": "inferred", "reasoning": "Seeking to force Ukrainian submission." }
            }
          },
          {
            "obj_type": "Attack Pattern",
            "meta": {
              "id_data": "T0003",
              "extraction_method": "explicit",
              "reasoning": "The incident leverages the pre-existing 'Nazi Ukraine' storyline."
            },
            "properties": {
              "Name": { "value": "T0003 - Leverage Existing Narratives", "method": "explicit", "reasoning": "Uses the recurring 'Nazi' trope mentioned in the response." },
              "Description": { "value": "Adapting the long-standing 'Ukraine is a Nazi state' baseline to the specific context of territorial concessions.", "method": "inferred", "reasoning": "Applied behavior." },
              "External_Reference": { "value": "T0003", "method": "explicit", "reasoning": "DISARM ID." },
              "Kill_Chain_Phase": { "value": "Develop Narratives", "method": "explicit", "reasoning": "DISARM Tactic." }
            }
          },
          {
            "obj_type": "Attack Pattern",
            "meta": {
              "id_data": "T0085.003",
              "extraction_method": "explicit",
              "reasoning": "The content is delivered via a fake news site."
            },
            "properties": {
              "Name": { "value": "T0085.003 - Inauthentic News", "method": "explicit", "reasoning": "Delivery via noticiabrasil.net.br." },
              "Description": { "value": "Publication of fabricated political claims through a portal mimicking a legitimate news outlet.", "method": "inferred", "reasoning": "Applied behavior." },
              "External_Reference": { "value": "T0085.003", "method": "explicit", "reasoning": "DISARM ID." },
              "Kill_Chain_Phase": { "value": "Develop Content", "method": "explicit", "reasoning": "DISARM Tactic." }
            }
          },
          {
            "obj_type": "Channel",
            "meta": {
              "id_data": "INC-7-2026-01-15_CHN_01",
              "extraction_method": "explicit",
              "reasoning": "Outlet identified in input data."
            },
            "properties": {
              "Name": { "value": "noticiabrasil.net.br", "method": "explicit", "reasoning": "Domain provided." },
              "Description": { "value": "A Brazilian-registered portal used for distributing pro-Kremlin disinformation in Portuguese.", "method": "inferred", "reasoning": "Identified through TLD and narrative alignment." },
              "Platform": { "value": "website", "method": "explicit", "reasoning": "Ontology classification." },
              "Channel_Type": { "value": "state-aligned-channel", "method": "inferred", "reasoning": "Systematically aligns with Russian state narratives without explicit ownership disclosure." },
              "Reach": { "value": "medium", "method": "inferred", "reasoning": "Standard reach for regional influence outlets." }
            }
          },
          {
            "obj_type": "Persona",
            "meta": {
              "id_data": "INC-7-2026-01-15_PER_01",
              "extraction_method": "explicit",
              "reasoning": "Main subject of the disinformation."
            },
            "properties": {
              "Name": { "value": "Volodymyr Zelenskyy", "method": "explicit", "reasoning": "Mentioned in title and summary." },
              "Description": { "value": "President of Ukraine, portrayed as a hostage to extremists.", "method": "inferred", "reasoning": "Role in the incident narrative." },
              "Occupation": { "value": "Head of state", "method": "explicit", "reasoning": "ESCO classification." },
              "Role_Type": { "value": "target", "method": "explicit", "reasoning": "Subject of the smear campaign." },
              "Affiliation": { "value": "Government of Ukraine", "method": "explicit", "reasoning": "Official position." }
            }
          },
          {
            "obj_type": "Organization",
            "meta": {
              "id_data": "INC-7-2026-01-15_ORG_01",
              "extraction_method": "inferred",
              "reasoning": "The institution the narrative seeks to delegitimize."
            },
            "properties": {
              "Name": { "value": "Government of Ukraine", "method": "explicit", "reasoning": "Primary institutional target." },
              "Type": { "value": "Government", "method": "explicit", "reasoning": "Ontology classification." },
              "Role_Type": { "value": "target", "method": "inferred", "reasoning": "The ultimate strategic target of the delegitimization effort." }
            }
          },
          {
            "obj_type": "Community",
            "meta": {
              "id_data": "INC-7-2026-01-15_COM_01",
              "extraction_method": "explicit",
              "reasoning": "The group portrayed as the 'Active Subject' in the lie."
            },
            "properties": {
              "Name": { "value": "Ukrainian Neo-Nazis", "method": "explicit", "reasoning": "Propaganda label used in the summary." },
              "Description": { "value": "A fabricated or highly exaggerated 'shadow' power structure used as a narrative prop to explain political decisions as 'coerced'.", "method": "inferred", "reasoning": "Fact-check reveals they have <2.15% electoral support." },
              "Type": { "value": "ideological", "method": "explicit", "reasoning": "Ontology classification." }
            }
          },
          {
            "obj_type": "Narrative",
            "meta": {
              "id_data": "INC-7-2026-01-15_NAR_01",
              "extraction_method": "generated",
              "reasoning": "Single axis identified in title: Neo-Nazis -> Kill -> Zelenskyy."
            },
            "properties": {
              "Name": { "value": "Assassination Threat for Territorial Concessions", "method": "generated", "reasoning": "5Ws Headline based on the title." },
              "Description": { "value": "The narrative claims that Ukrainian far-right militias exercise veto power over peace via the threat of lethal force against the President.", "method": "generated", "reasoning": "Synthesis of the summary." },
              "Hierarchy_Rank": { "value": "Primary", "method": "explicit", "reasoning": "Core claim of the incident." },
              "Greimas_Structure": { "value": "The Ukrainian Neo-Nazis generate an Act of Assassination changing the relationship of Volodymyr Zelenskyy with Political Agency and Life from UNION to DISJUNCTION.", "method": "generated", "reasoning": "Strict adherence to Greimasian template." },
              "Active_Subject": { "value": "Ukrainian Neo-Nazis", "method": "explicit", "reasoning": "From title." },
              "Active_Subject_Sentiment": { "value": "Negative", "method": "inferred", "reasoning": "Villainous actors in the debunk." },
              "Passive_Subject": { "value": "Volodymyr Zelenskyy", "method": "explicit", "reasoning": "From title." },
              "Passive_Subject_Sentiment": { "value": "Neutral", "method": "inferred", "reasoning": "Portrayed as a victim of coercion in the narrative." },
              "Object_of_Value": { "value": "Political Agency and Personal Security", "method": "explicit", "reasoning": "What is lost if the action occurs." },
              "Action": { "value": "Will Kill", "method": "explicit", "reasoning": "Verb from title." },
              "Goal": { "value": "To frame the rejection of peace talks as involuntary extremist influence.", "method": "inferred", "reasoning": "Strategic intent." },
              "Emotion": { "value": "fear", "method": "inferred", "reasoning": "Targeting the audience with the threat of violence/instability." },
              "Targeted_Public": { "value": "Portuguese-speaking Brazilian citizens", "method": "inferred", "reasoning": "Based on outlet and language." }
            }
          },
          {
            "obj_type": "Location",
            "meta": {
              "id_data": "INC-7-2026-01-15_LOC_01",
              "extraction_method": "explicit",
              "reasoning": "Geographic focus of the incident."
            },
            "properties": {
              "Name": { "value": "Ukraine", "method": "explicit", "reasoning": "Primary victim location." },
              "Country": { "value": "UKR", "method": "explicit", "reasoning": "ISO code." },
              "Region": { "value": "eastern-europe", "method": "explicit", "reasoning": "Ontology region." }
            }
          },
          {
            "obj_type": "Event",
            "meta": {
              "id_data": "INC-7-2026-01-15_EVT_01",
              "extraction_method": "explicit",
              "reasoning": "The real-world context mentioned in the tags."
            },
            "properties": {
              "Name": { "value": "Full-scale Invasion of Ukraine", "method": "explicit", "reasoning": "Tag provided." },
              "Description": { "value": "The ongoing war of aggression by Russia against Ukraine, which serves as the backdrop for territorial concession debates.", "method": "inferred", "reasoning": "Contextual context." }
            }
          }
        ],
        "relations": [
          { "source_id": "INC-7-2026-01-15", "relationship_type": "attributed-to", "target_id": "origin_thr_0007", "meta": { "reasoning": "Direct attribution to Kremlin narratives." } },
          { "source_id": "INC-7-2026-01-15", "relationship_type": "uses Attack Pattern", "target_id": "T0003", "meta": { "reasoning": "Leveraging the recurring Nazi narrative." } },
          { "source_id": "INC-7-2026-01-15", "relationship_type": "uses Attack Pattern", "target_id": "T0085.003", "meta": { "reasoning": "Content published on inauthentic site." } },
          { "source_id": "INC-7-2026-01-15", "relationship_type": "uses Channel", "target_id": "INC-7-2026-01-15_CHN_01", "meta": { "reasoning": "The site noticiabrasil was the primary spreader." } },
          { "source_id": "INC-7-2026-01-15", "relationship_type": "uses Narrative", "target_id": "INC-7-2026-01-15_NAR_01", "meta": { "reasoning": "The core of the incident is this narrative axis." } },
          { "source_id": "INC-7-2026-01-15", "relationship_type": "targets Persona", "target_id": "INC-7-2026-01-15_PER_01", "meta": { "reasoning": "Smears Zelenskyy personally." } },
          { "source_id": "INC-7-2026-01-15", "relationship_type": "targets Organization", "target_id": "INC-7-2026-01-15_ORG_01", "meta": { "reasoning": "Undermines the legitimacy of the Ukrainian government." } },
          { "source_id": "INC-7-2026-01-15", "relationship_type": "targets Event", "target_id": "INC-7-2026-01-15_EVT_01", "meta": { "reasoning": "Parasitizes the invasion context to influence peace debate." } },
          { "source_id": "INC-7-2026-01-15_CHN_01", "relationship_type": "operated-by", "target_id": "origin_thr_0007", "meta": { "reasoning": "Inferred state control based on narrative repetition." } },
          { "source_id": "INC-7-2026-01-15_PER_01", "relationship_type": "affiliated-with", "target_id": "INC-7-2026-01-15_ORG_01", "meta": { "reasoning": "Zelenskyy leads the government." } },
          { "source_id": "INC-7-2026-01-15_NAR_01", "relationship_type": "located-at", "target_id": "INC-7-2026-01-15_LOC_01", "meta": { "reasoning": "The narrative focus is Ukraine." } },
          { "source_id": "INC-7-2026-01-15_NAR_01", "relationship_type": "manifests-in", "target_id": "INC-7-2026-01-15_EVT_01", "meta": { "reasoning": "The story appears within the context of the war." } }
        ]
      },
      "summary_euvsdisinfo": "Volodymyr Zelenskyy is dependent on Ukrainian neo-Nazi groups, who could kill him if he agrees to cede territories. Ukrainian neo-Nazis still exert enormous influence in the Ukrainian Army. To reach an agreement, it will be necessary to renounce land.",
      "response": "Recurring pro-Kremlin disinformation narrative about Nazi Ukraine. Such claims aim to delegitimise Ukrainian leadership. There is no merit to the claim, no evidence is provided to support it. Far‑right and explicitly neo‑Nazi forces exist in Ukraine, but they are electorally marginal, institutionally constrained, and do not control either the government's war and peace decisions or the president's personal security. In the 2019 parliamentary elections, a unified bloc of major far-right parties (including Svoboda, National Corps, Right Sector, and others often cited in propaganda) won only 2.15% of the vote, below the 5% threshold and securing no list seats in a contest judged free and fair by international observers. Recent surveys still find that 55–80% of Ukrainian respondents reject giving up territory even for a faster peace, which means that any Ukrainian government would face strong democratic and societal resistance to trading land. Kyiv's leadership openly rejects peace proposals involving territorial concessions as unconstitutional and unacceptable.",
      "publication_date": "January 03, 2026",
      "source_file": "2026-01-03_ukrainian-neo-nazis-will-kill-zelenskyy-if-he-agrees-to-territorial-concessions.html",
      "languages": [],
      "countries_regions": ["Ukraine"],
      "outlet_count": 1
    }
  ]
}

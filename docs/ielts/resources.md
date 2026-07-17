# IELTS Resource Catalog

This file records online IELTS teaching and practice material sources for the project. Use it as a source-selection checklist before adding materials to the local practice system.

## Source Priority

1. Official IELTS sources should be used as the benchmark for format, timing, scoring style, and question types.
2. Paid or copyrighted materials, such as Cambridge IELTS books, can be used for personal study but should not be copied into a public repository.
3. Third-party websites and YouTube lessons are useful for strategies, explanations, and extra exposure, but should be checked for quality before being treated as answer-key material.
4. Generated practice materials should be clearly labelled as generated, not official IELTS content.

## Official And High-Reliability Sources

| Source | Link | Best Use | Notes |
| --- | --- | --- | --- |
| British Council free IELTS practice tests | https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests | Listening, Reading, Writing, Speaking practice; official format benchmark | Strong first source for MVP format and sample flow. |
| British Council Listening practice tests | https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-practice-tests/listening | Listening mock-test structure and question style | Good reference for the first Listening MVP. |
| British Council IELTS Ready | https://takeielts.britishcouncil.org/take-ielts/prepare/ielts-ready | Free practice tests, familiarisation test, teacher videos, exercises, tips | Free tier is useful; premium access may depend on test booking. |
| IDP IELTS practice materials | https://ielts.idp.com/about/ielts-practice-materials | Sample questions, practice tests, test format reference | Official IELTS partner; useful alongside British Council. |
| IDP IELTS preparation course | https://ielts.idp.com/about/ielts-practice-materials/ielts-preparation-course | Section-by-section preparation for Listening, Reading, Writing, Speaking | Good for skill-specific study notes and question-type overview. |

## Books And Purchased Materials

| Source | Best Use | Notes |
| --- | --- | --- |
| Cambridge IELTS books | Listening and Reading practice closest to the real exam | High-value personal practice source. Do not copy book content into the public repo unless legally available for that use. |

## Teaching And Strategy Sources

| Source | Link | Best Use | Notes |
| --- | --- | --- | --- |
| IELTS Liz | https://ieltsliz.com/ | Free lessons, Speaking, Writing, model answers, band 7-9 strategy | Good for strategy notes and learner-friendly explanations. |
| IELTS Advantage | https://www.ieltsadvantage.com/ielts-courses-and-resources/ | Writing, Speaking, Listening, Reading strategy; free Band 7+ fundamentals | Useful for structure, essay logic, and scoring criteria explanations. |
| E2 IELTS / E2Language YouTube | https://www.youtube.com/@E2IELTS | YouTube lessons and exam strategy | Useful for concept learning and exam technique. |

## Chinese-Learner-Friendly Sources

| Source | Link | Best Use | Notes |
| --- | --- | --- | --- |
| IELTS Bro | https://www.ieltsbro.com/question-bank/ | Speaking question bank, Chinese learner reports, extra drills | Use as an external reference. Avoid scraping or redistributing its question bank, audio, or explanations. |

## Extra Practice And General Listening Input

| Source | Best Use | Notes |
| --- | --- | --- |
| IELTS Online Tests and similar mock-test sites | Large amount of extra online mock-test exposure | Useful for volume, but answer quality and difficulty should be checked before adding anything to the local library. |
| YouTube | General listening, IELTS strategy lessons, accent exposure | Good for Input Library mode and strategy review. |
| Podcasts | Listening stamina, topic vocabulary, natural speech rhythm | Best for Input Library mode rather than IELTS scoring practice. |
| BBC-style audio / news / documentaries | Academic-style input and accent exposure | Useful for general listening ability. |
| VoiceTube | Subtitled listening input and vocabulary support | Good for low-pressure daily listening. |

## How To Use These Sources In The Project

- Mock Test: use official British Council, IDP, Cambridge, or carefully checked high-quality mock materials.
- Deep Listening: use real IELTS-style audio with transcript when available; record exact weak points after review.
- Input Library: use YouTube, podcasts, BBC-style audio, VoiceTube, interviews, and documentaries.
- Targeted Drill: use mistake logs and generated materials to train weak areas such as dates, numbers, spelling, maps, synonyms, and distractors.
- Speaking Practice: use IELTS Bro, IELTS Liz, IELTS Advantage, and official sample questions for topic selection and strategy notes.
- Writing Practice: use IELTS Liz, IELTS Advantage, British Council, and IDP for task formats, model answers, and scoring-criteria notes.

## Legal And Quality Rules

- Do not scrape or redistribute copyrighted question banks, book content, audio, transcripts, or explanations.
- Store links, notes, self-written summaries, and personal answers instead of copying full third-party materials.
- Mark every local item with a source type: official, purchased-personal, third-party-reference, generated, or self-created.
- Prefer official materials when testing scoring, timing, and question format.
- Use third-party lessons for explanations and strategy, not as the only source of truth.

## Local Scraper

- IELTS Bro crawler script: `tools/ielts/scrape_ieltsbro.py`
- Scraping notes: `docs/ielts/SCRAPING.md`
- Default output path: `data/ielts/external/ieltsbro/oral_topics.json`
- Intended use: personal study indexing and weak-point planning, not redistribution.

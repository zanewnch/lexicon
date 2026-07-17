# IELTS Practice Project Plan

## Goal

Build a personal IELTS practice system for learning English across listening, speaking, reading, and writing. Start with Listening because it has a clear practice loop: generate or import audio, answer IELTS-style questions, check answers, review transcript, and learn from mistakes.

The project should prioritize learning effectiveness over technical complexity.

## Learning Principles

- Practice should feel close to the real IELTS test.
- The system should create repeatable daily drills.
- Feedback should explain why an answer is wrong, not only mark it wrong.
- Local/offline models are preferred when they are good enough.
- Generated materials should supplement real IELTS-style materials, not replace them entirely.

## Practice Material Sources

Use different sources for different learning goals. The project should not depend on only one platform.

| Platform | Best Use | Evaluation |
| --- | --- | --- |
| IELTS official / IDP / British Council | Learn the formal test format and use free sample tests | Most reliable; must use |
| Cambridge IELTS books | Listening and reading practice closest to the real exam | Most important, but usually requires buying the books |
| IELTS Bro / 雅思哥 | Speaking question bank, Chinese learner reports, extra drills | Very suitable for Chinese-speaking learners |
| IELTS Liz | Speaking, writing, and test strategy | Lots of free content; useful around Band 6.5-8 |
| IELTS Online Tests | Large amount of online mock-test practice | Many questions, but difficulty and answer quality should be checked |
| E2 IELTS / IELTS Advantage | YouTube strategy lessons | Good for concepts, writing logic, and exam technique |
| VoiceTube / YouTube / Podcast | General listening input | Good for building core English ability, but not specialized test drilling |

### Source Usage Rules

- Official sample materials should be used as the benchmark for format and scoring style.
- Cambridge IELTS books should be treated as high-value personal practice materials, not copied into the repo unless the content is legally available for personal local use.
- IELTS Bro / 雅思哥 is useful as an external practice platform and reference for Chinese learners, but the project should avoid scraping or redistributing its question bank, audio, or explanations.
- IELTS Online Tests and similar sites can provide extra exposure, but answers should be reviewed carefully before being added to a personal practice library.
- YouTube, podcasts, and VoiceTube are best for general listening stamina, vocabulary, and accent exposure.
- Generated materials should be clearly marked as generated practice, not real exam materials.

Detailed source list:

- [IELTS resource catalog](resources.md)

## Listening Practice Modes

The listening system should not treat all practice as the same activity. The modes are different because the training goals are different.

| Mode | Goal | Materials | Practice Method | Best Timing |
| --- | --- | --- | --- | --- |
| Mock Test | Simulate IELTS scoring and exam pressure | Official / Cambridge / high-quality mock tests | Play once, answer under time limit, check score at the end | Weekly progress check |
| Deep Listening | Find out why something was not understood | Real test audio / IELTS Bro / official materials | Repeat sentence by sentence, transcribe, compare with transcript | After many wrong answers or unclear audio |
| Input Library | Build general listening ability and English intuition | Podcasts / YouTube / VoiceTube / BBC-style content | Listen without stopping, catch the main idea, get used to accents | Daily commute, walking, relaxed listening |
| Targeted Drill | Custom-train weak points | Generated scripts + local TTS | Practice specific traps such as dates, numbers, maps, synonyms, spelling | After weak points are detected |

### Mock Test

Mock Test is exam mode.

The goal is to improve score under IELTS rules. Use official, Cambridge, or other high-quality mock materials. The audio should normally be played once, questions should be answered under time pressure, and scoring should happen only at the end.

Example:

- British Council Listening Part 1-4.
- 40 questions.
- Audio played once.
- Final score and band estimate after completion.

This mode should avoid pausing and repeating because the goal is test rhythm and score accuracy.

### Deep Listening

Deep Listening is error analysis mode.

The goal is to understand why the answer was missed. The learner can repeat a sentence several times, type what they hear, then compare it with the transcript.

Possible mistake labels:

- Linking
- Weak forms
- Unfamiliar vocabulary
- Spelling
- Numbers
- Names
- Synonyms
- Paraphrase
- Distractors

Example flow:

1. Play one sentence.
2. Type what was heard.
3. Replay up to three times.
4. Reveal transcript.
5. Mark the reason for the mistake.
6. Save the weak point for later drills.

### Input Library

Input Library is ear-building mode.

The goal is to make English sound more familiar. This mode does not need IELTS-style questions. The learner should listen continuously and focus on main ideas, accents, rhythm, and vocabulary exposure.

Good materials:

- Podcast episodes
- YouTube videos
- VoiceTube clips
- News or documentary-style audio
- Interviews and conversations

This mode is useful for daily low-pressure listening. It should track listening time and topics, but should not require detailed scoring.

### Targeted Drill

Targeted Drill is custom weak-point training.

The goal is to generate extra practice for exactly the things the learner often misses. For example, if date and price questions are weak, the system can generate multiple IELTS Section 1 booking conversations containing dates, times, phone numbers, addresses, and prices.

Possible drill targets:

- Dates
- Times
- Prices
- Phone numbers
- Addresses
- Names and spelling
- Map directions
- Academic vocabulary
- Synonym replacement
- Distractor correction

Targeted drills should be short, repeatable, and generated from the mistake log.

### Listening Entry Points

The app should eventually expose four clear listening entrances:

- Mock Test: formal test practice with scoring.
- Deep Listening: sentence-level intensive listening with transcript comparison.
- Input Library: general listening exposure and listening-time tracking.
- Targeted Drill: generated short drills for weak points.

Detailed workflows:

- [Mock Test Workflow](practice-workflows/mock-test.md)
- [Deep Listening Workflow](practice-workflows/deep-listening.md)
- [Input Library Workflow](practice-workflows/input-library.md)
- [Targeted Drill Workflow](practice-workflows/targeted-drill.md)

## Phase 1: Listening MVP

### Core User Flow

1. Choose a listening drill.
2. Preview the questions.
3. Play the audio once, or with a controlled replay setting.
4. Enter answers.
5. Submit answers.
6. Review score, correct answers, transcript, and mistake explanations.
7. Save weak points for future review.

### First Supported Exercise Types

- Form completion
- Sentence completion
- Short-answer questions
- Multiple choice

Later exercise types:

- Matching
- Map labelling
- Table completion
- Flow-chart completion

## Audio Strategy

### Stage 1: Use Existing Audio

Start by allowing local audio files to be imported. This gives better learning quality early and avoids spending too much time on voice generation before the practice loop works.

Supported inputs:

- `.mp3`
- `.wav`
- `.m4a`

Each listening item should have:

- Audio file
- Transcript
- Questions
- Correct answers
- Optional explanation notes

### Stage 2: Add Local TTS

Use local text-to-speech to generate IELTS-style listening materials.

Candidate TTS engines:

- Piper TTS: best first choice for lightweight offline generation.
- Kokoro TTS: good candidate when more natural voices are needed.
- Coqui TTS: powerful but lower priority because setup can be heavier.

Recommended approach:

- Generate audio ahead of practice time.
- Save generated audio as a reusable file.
- Do not require real-time generation in the first version.

### Stage 3: Multi-Speaker Listening

For dialogue-style IELTS sections, support multiple speaker voices.

Examples:

- Student and accommodation officer
- Customer and travel agent
- Student and professor
- Two students discussing a project

Each generated script should include:

- Speaker names
- Accent/voice choice
- Transcript
- IELTS-style questions
- Answer key

## Speech-To-Text Strategy

Speech-to-text is useful for transcripts, alignment, and later speaking practice.

Candidate STT engines:

- faster-whisper: good first choice, practical Python integration.
- whisper.cpp: very good offline option, lightweight and portable.
- WhisperX: useful later for accurate timestamps and alignment.

Initial use cases:

- Generate transcripts for imported audio.
- Check generated TTS output against the intended script.
- Create timestamped review sections later.

## Content Format

Use a simple structured format for each listening drill.

Example fields:

- `id`
- `title`
- `section`
- `difficulty`
- `audio_path`
- `transcript`
- `questions`
- `answers`
- `explanations`
- `tags`

Suggested tags:

- numbers
- spelling
- names
- dates
- locations
- synonyms
- distractors
- paraphrase
- map
- academic lecture

## Mistake Review

The review system should help identify patterns.

Track mistakes by:

- Question type
- Vocabulary topic
- Missed synonym/paraphrase
- Number/date/spelling errors
- Distractor traps
- Listening speed issues

Review output should include:

- Correct answer
- User answer
- Relevant transcript sentence
- Short explanation
- Suggested retry drill

## Phase 2: Listening Generator

Generate IELTS-style listening practice from a prompt.

Inputs:

- Topic
- Section type
- Difficulty
- Target duration
- Question type
- Accent preference

Outputs:

- Script
- Audio file
- Questions
- Answer key
- Transcript
- Review notes

Example generator prompts:

- "Create a Section 1 conversation about booking a language course."
- "Create a Section 2 monologue about a museum tour."
- "Create a Section 3 discussion about a university group project."
- "Create a Section 4 lecture about renewable energy."

## Phase 3: Speaking Practice

Speaking can reuse STT and feedback logic.

Possible features:

- IELTS Part 1 question practice
- IELTS Part 2 cue card timer
- IELTS Part 3 follow-up questions
- Record answer
- Transcribe answer
- Give feedback on fluency, vocabulary, grammar, and coherence

## Phase 4: Reading Practice

Possible features:

- Passage library
- Timed reading
- IELTS-style question sets
- Answer review
- Vocabulary extraction
- Paraphrase training

## Phase 5: Writing Practice

Possible features:

- Task 1 Academic reports
- Task 1 General letters
- Task 2 essays
- Band-style feedback
- Rewrite suggestions
- Error log
- Personal phrase bank

## Suggested MVP Build Order

1. Create the listening drill data format.
2. Build a simple drill runner.
3. Add manual listening items with audio, questions, answers, and transcript.
4. Add answer checking.
5. Add review screen with transcript and explanations.
6. Add local STT for transcript generation.
7. Add local TTS for generated listening materials.
8. Add progress tracking and mistake categories.

## Open Decisions

- Should the first interface be a web app, desktop app, or command-line prototype?
- Should drills be stored as JSON, Markdown, SQLite, or another format?
- Should the system start with imported real audio or generated TTS audio?
- Which TTS engine should be tested first: Piper or Kokoro?
- Do we want English-only UI, Chinese UI, or bilingual UI?

## Immediate Next Step

Decide the first MVP shape:

- Option A: simple local web app for listening drills.
- Option B: folder-based prototype using Markdown/JSON files.
- Option C: script-first tool that generates audio and question files.

Recommended first choice: Option B, because it keeps the content format clear and lets the learning workflow become solid before building a polished interface.

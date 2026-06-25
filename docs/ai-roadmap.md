# AI Roadmap

This roadmap defines how to add AI and ML to Maia without breaking the current local-first, contract-driven architecture.

The key constraint is simple:

- AI belongs in the Python analyzer.
- Rust stays the native runtime, persistence, and session boundary.
- TypeScript stays the operator UX and playback/control layer.

## Current Baseline

As of June 2026, Maia already has light AI / ML behavior:

- `scikit-learn` `IsolationForest` is used for fallback anomaly detection on raw logs.
- `librosa` powers DSP analysis for BPM, beat tracking, and waveform features.
- the desktop app calls the analyzer only through JSON contracts over Tauri IPC.

This means Maia does **not** need an AI rewrite.
It needs a staged enrichment plan.

## Principles

1. Keep inference optional and local.
2. Preserve deterministic fallbacks for every AI-assisted path.
3. Do not put heavy model inference in the live monitor loop unless latency is proven acceptable.
4. Prefer precompute or cached enrichment before reactive live inference.
5. Add one model category at a time and benchmark it against a deterministic baseline.

## Library Strategy

Default recommendation by use case:

- `scikit-learn`: lightweight tabular models, anomaly scoring, clustering, ranking.
- `librosa` + `Essentia`: audio feature extraction, segmentation, rhythmic descriptors.
- `PyTorch` / `Demucs`: source separation and audio-heavy research models.
- `ONNX Runtime`: best candidate for cross-platform packaged inference once models stabilize.
- `TensorFlow`: only if Maia adopts a specific model family that is materially better in TensorFlow than the alternatives.

Current recommendation:

- do **not** make TensorFlow a core dependency in the next phase
- if heavy AI lands, prefer `PyTorch` for research-stage audio work and `ONNX Runtime` for packaged inference

Reason:

- the repo already points toward `Demucs` / `torch` for stems
- TensorFlow will increase packaging, wheel size, and cross-platform friction without solving the current bottlenecks first

## Phase 0: Contract And Data Readiness

Goal:
- make AI additions measurable and reversible

Work:
- add analyzer benchmark fixtures for quiet logs, noisy logs, crash bursts, playlist prep, and track segmentation
- version AI-assisted outputs explicitly inside analyzer response metadata
- separate deterministic metrics from inferred metrics in the response payload
- add a feature-flag pattern for analyzer options such as `enableMlAnomalyScore`, `enableTrackSegmentation`, `enableSimilarityEmbedding`
- align docs with runtime reality where tree-sitter and Essentia are planned but not yet active dependencies

Exit criteria:
- every AI-assisted result can be turned off per request
- baseline fixtures exist for regression testing

## Phase 1: Better Log Intelligence Without Heavy Models

Goal:
- improve live and imported log analysis with low-risk ML

Work:
- strengthen the current anomaly detector with richer features: cadence shifts, component churn, trace repetition, stack-trace shape, token rarity
- add unsupervised clustering of repeated anomaly families to avoid surfacing the same issue as many unique events
- add severity calibration from structured fields such as `trace_id`, `span_id`, `service`, `status_code`, and exception signatures
- produce a stable `anomalyFamilyId` and `anomalyConfidence`
- keep deterministic keyword/severity heuristics as the hard fallback

Recommended libs:
- `scikit-learn`
- `numpy`
- optional `rapidfuzz` for signature grouping

Why this phase first:
- it improves the core monitoring product without changing the audio runtime boundary
- it is compatible with live sessions if the model stays lightweight

## Phase 2: Track And Playlist Prep Intelligence

Goal:
- make Maia feel more like a DJ prep tool before it becomes more generative

Work:
- improve section detection: intro, build, drop, breakdown, outro
- infer stronger cue suggestions and loop regions
- build playlist compatibility features: BPM neighborhood, key compatibility, energy flow, transition smoothness
- add track similarity embeddings for local library navigation and anchor recommendation
- generate prep metadata offline at import time, not in the live monitor loop

Recommended libs:
- `Essentia` for music information retrieval features
- `librosa` for existing DSP continuity
- optional small embedding model exported to `ONNX`

Packaging note:
- this is the first phase where `Essentia` is likely higher ROI than TensorFlow

## Phase 3: Repository Structure Intelligence

Goal:
- let repository scans produce stronger musical and operational priors than simple file heuristics

Work:
- fully activate tree-sitter-based parsing in the active analyzer path
- compute structural repo fingerprints: dependency density, nesting depth, module churn, error-prone hotspots, language mix
- infer a stable repository profile that can influence BPM range, mutation density, and arrangement style
- add optional learned ranking for "which code regions are most musically or operationally salient"

Recommended libs:
- `tree-sitter` language packages
- `networkx` or simple graph metrics
- `scikit-learn` for ranking / clustering before any deep model is considered

Why before TensorFlow:
- the repo currently has more structural-analysis upside than deep-model upside

## Phase 4: Audio-Aware Hybrid Mixing

Goal:
- move toward the "hybrid mixer" promise in a controlled way

Work:
- enable optional source separation for imported tracks during offline prep
- store separated stems as managed local assets
- let live monitor mutations target stems differently: kick-safe, pad-safe, vocal-safe, accent-safe
- use separated material to build cleaner reactive mixes with less destructive filtering

Recommended libs:
- `PyTorch`
- `Demucs`
- later `ONNX Runtime` if model export is viable

Do not do this yet:
- do not run stem separation in the live poll loop
- do not make stems mandatory for ordinary track import

## Phase 5: Small Generative Assistance, Not Full AI Composition

Goal:
- help the operator choose and configure, not replace the musical base

Work:
- recommend presets from track + repo/log features
- recommend deck settings for calm / drift / alert modes
- suggest playlist anchor blends from previous successful sessions
- generate session-specific "monitor recipes" that remain editable by the operator

Recommended libs:
- `scikit-learn`
- optional local ranking model in `ONNX`

Product constraint:
- suggestions should remain operator-reviewable, never opaque auto-performance by default

## Phase 6: Heavy AI, Only If Metrics Justify It

Goal:
- introduce heavier inference only after the first five phases show clear product lift

Possible candidates:
- local audio-text embeddings for semantic browsing of tracks and sessions
- learned anomaly-family classifiers from curated log corpora
- learned transition scoring between tracks and session states
- learned cue generation from track structure

Framework decision at this stage:
- choose `TensorFlow`, `PyTorch`, or `ONNX Runtime` based on the winning model family
- do not choose a framework first and search for a problem later

## Recommended Order

1. Phase 0: contract and benchmark readiness
2. Phase 1: stronger log intelligence
3. Phase 2: track and playlist prep intelligence
4. Phase 3: repository structure intelligence
5. Phase 4: hybrid stem-aware mixing
6. Phase 5: recommendation layer
7. Phase 6: heavy AI only if justified

## What TensorFlow Could Be Good For

TensorFlow is plausible for:

- packaged local classifiers
- embedding models already available in TensorFlow format
- models that need TensorFlow Lite in a future constrained runtime

TensorFlow is a poor immediate fit for Maia if the near-term goals are:

- better BPM / cue / section analysis
- stronger log anomaly grouping
- stem separation
- lighter cross-platform desktop packaging

For those goals, Maia gets more leverage sooner from:

- `scikit-learn`
- `Essentia`
- `PyTorch` / `Demucs`
- `ONNX Runtime`

## Success Metrics

Each phase should define measurable lift.

Examples:

- anomaly precision against curated fixtures
- false-positive rate for calm logs
- BPM error versus reference tracks
- cue / segment usefulness rated by operator review
- session recommendation acceptance rate
- average analyzer latency for import and live poll
- package size impact on desktop distribution

## Suggested Next Implementation Step

The highest-ROI next step is:

1. formalize Phase 0 feature flags and benchmarks
2. execute Phase 1 on log anomaly grouping and confidence scoring
3. execute Phase 2 on offline track / playlist prep before any TensorFlow adoption

That path strengthens Maia's actual product differentiator without overcommitting to heavyweight AI infrastructure.

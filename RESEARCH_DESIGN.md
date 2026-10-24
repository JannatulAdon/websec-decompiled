# SSRF lesson: research and design rationale

Research checked 2026-10-24. This is a design rationale, not evidence that the rebuilt lesson has already improved this learner's understanding. Proposed interactions below must be verified against the implemented revision and then evaluated with the learner.

## The problem we are solving

The learner reports feeling lost, clicking without knowing why, and facing too many options. They want an actual application interface and concrete evidence, not metaphors or decorative network animations. The previous SSRF workbench exposes a useful runtime, but asks a beginner to organize their own instruction: choose URLs, compare direct access, interpret HTTP, inspect code, and manipulate controls. A definition and a “next” strip do not necessarily supply the missing prerequisites.

The immediate goal is narrower than mastering every SSRF variant: explain how a user-controlled URL becomes a server request, why that server may reach a destination the user's browser cannot, and what evidence supports that conclusion. Later lessons can add blind SSRF, redirects, URL parsing, network policy, and related variants without pretending this first example covers them.

## Evidence informing the sequence

**Guidance during discovery — research synthesis.** [Alfieri, Brooks, Aldrich and Tenenbaum (2011)](https://app.nova.edu/toolbox/instructionalproducts/edd8124/articles/2011-Alfieri_et_al.pdf) analyzed 164 studies. Unassisted discovery generally underperformed explicit instruction, while assisted discovery benefited from combinations of feedback, worked examples, scaffolding, and explanations. Our application is to demonstrate the initial causal chain and constrain the first experiment. This does not justify passive exposition throughout, nor establish an optimal number of buttons. The compared studies span different domains and conditions; their aggregate findings do not validate this particular interface.

**Gradually removing support — primary experiments.** [Atkinson, Renkl and Merrill (2003)](https://mrbartonmaths.com/resourcesnew/8.%20Research/Making%20the%20most%20of%20examples/Fading%20out%20and%20Prompts.pdf) tested fading worked steps combined with prompts identifying underlying principles. Across two experiments, the combination supported near and far transfer; fading alone had less reliable far-transfer evidence. We apply this by moving from an explained normal import to a supported destination change, then a causal explanation and a different feature. A transfer exercise must require the mechanism, rather than reproduce the same button sequence. This is an extrapolation from structured problem-solving research, not direct evidence about CTF training.

**Attention and related representations — research-based synthesis.** [Mayer and Moreno (2003)](https://carpentries.github.io/instructor-training/files/papers/mayer-reduce-cognitive-load-2003.pdf) connect multimedia design to limited processing capacity and summarize experiments on reducing unnecessary demands. We use adjacent explanations, selective emphasis, and learner-paced progression. The application interface supplies the visual evidence: a changed URL, the request it causes, and returned content. The research does not require animation. Hiding irrelevant code and headers during the first example is a design inference; the exact balance needs usability evaluation. Explanations should remain available for review, rather than vanish in a timed animation.

**Retrieving an explanation — primary experiments.** [Karpicke and Blunt (2011)](https://pubmed.ncbi.nlm.nih.gov/21252317/) found benefits of retrieval practice for later conceptual and inferential questions after learning science texts. This motivates asking the learner to reconstruct why the request succeeded after instruction, and revisiting the mechanism later. An immediate answer selected while its wording remains visible is primarily a comprehension or recognition check, not strong evidence of durable retrieval. Click-to-reveal text is not retrieval practice. These findings do not establish that multiple-choice success equals independent investigation skill.

**Changed-context assessment — primary experiments.** [Butler (2010)](https://andymatuschak.org/files/papers/Butler%20-%202010%20-%20Repeated%20Testing%20Produces%20Superior%20Transfer%20of%20Learning%20Relative%20to%20Repeated.pdf) compared repeated testing and studying across four experiments, including later inferential questions in new contexts. The results motivate checking the SSRF mechanism in a link-preview feature after the image-import example. This is a modest transfer task, not proof of broad CTF readiness. A later check should change the surface details again and ask what evidence is missing, rather than reward recognition of the same URL.

## Contrary evidence: instruction first is not a universal rule

[Sinha and Kapur (2021)](https://journals.sagepub.com/doi/full/10.3102/00346543211019105) synthesized 53 studies with 166 comparisons of problem solving before instruction versus instruction before problem solving. They reported a moderate aggregate advantage for problem solving first, with stronger findings when implementations followed productive-failure design principles. This challenges any claim that beginners must always receive a complete solution first. Preparatory attempts can support subsequent learning when the later instruction builds on them; results depend on design and context.

Our choice of a worked opening is therefore conditional: this learner repeatedly reports missing the task, actors, and purpose, and the current interface provides many independent controls. Navigation confusion is not automatically productive failure. We still retain an authentic attempt in the new-context exercise, followed by specific feedback. Future revisions could test a short, well-defined initial prediction with sufficient prerequisites. They should not label unexplained clicking “desirable difficulty” or dismiss the learner's complaint as resistance to learning.

## Usability guidance is a different kind of evidence

[Nielsen's progressive-disclosure guidance (2006)](https://www.nngroup.com/articles/progressive-disclosure/) recommends deferring specialized features and distinguishes this from staged, sequential tasks. It also warns that too many stages add navigation and that interdependent tasks may need to remain together. This is practitioner usability guidance, not a controlled demonstration of SSRF learning. We apply it by preserving one importer and revealing meaningful stages, with the full workbench accessible afterward. We avoid splitting every sentence into another screen.

[W3C's clear-instructions pattern](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o4p07-step-instructions/) recommends concise instructions near the relevant activity and enough information to complete each step. It is supplemental accessibility guidance, not a learning-effect trial or a diagnosis of this learner. Here it supports explicit action labels, clear next steps, persistent feedback, and conventional controls. These choices reduce interface ambiguity; they do not substitute for explanation or practice.

## Planned evidence-to-interface mapping

1. **Normal worked import.** Introduce the website and its legitimate purpose. Present a prefilled public-image URL and one main Import action. Run the real local handler, show its image response, and explain the server's outgoing request beside the relevant record. Do not begin with empty inspector panels.
2. **A meaningful boundary.** Introduce a staff-service address and test direct browser access. Preserve the distinction between reachability failure and an HTTP rejection. Explain that the browser received no HTTP response in this configured environment.
3. **One controlled change.** Put that same address into the importer and submit. Show the returned staff content and compare the outgoing destination with the public-image request. The learner sees the input and result in their actual interfaces. Explain the controlled input, server request, and impact together.
4. **Causal feedback.** Ask why the importer obtained the content. Feedback should address the selected misconception, identify supporting evidence, and allow reconsideration. A wrong answer must not silently advance or earn mastery.
5. **Link-preview transfer.** Change the product context and ask the learner to reason about a server-fetching feature. A URL field alone does not establish SSRF. Contrast the evidence with a browser-only operation when useful.
6. **Optional workbench.** Offer arbitrary editing, the exact executed source, request controls, and pause/resume after the core sequence. Do not require these tools to understand the first example. Keep previous results distinct from unsent edits.

The transport remains bounded local fixtures. Showing actual JavaScript Request/Response objects is truthful; claiming captured traffic to a remote internal service is not. The opening should communicate this succinctly, with fuller limitations available on demand.

## Evaluation and limits

Browser checks establish functional correctness, accessibility behavior, responsive layout, and agreement between displayed evidence and execution. Screenshots can reveal collisions or confusing hierarchy. Neither establishes learning.

After using the sample, the learner should be able to identify the controlled value, distinguish the browser's submission from the server's outgoing request, explain the reachability difference, and name the returned data as evidence. In a new feature, they should recognize the same mechanism and avoid assuming that every URL input is vulnerable. A later check with the explanation hidden can probe retention; exact spacing is a design choice, not prescribed by these studies.

Record which misconception appeared and whether the learner needed help. Do not equate completion, elapsed time, correct retries, or opening all panels with mastery. The learner's comfort and ability to find the next action matter alongside explanation and transfer. No real lab must be attempted or marked solved to evaluate this sample. Research provides defensible design hypotheses; this learner's demonstrated understanding and feedback determine what to revise before broader rollout.

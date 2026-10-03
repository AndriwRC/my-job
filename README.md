# My Job

> The assignment: *"Prepare a slide presentation about what you do at work."*
> I'm a web developer. So I built one.

## The idea

The brief asked for slides. I could have opened a slide editor, picked a template,
and filled it with bullet points about browsers, components, and deadlines. But a
slide that says *"I build interactive experiences for the web"* is only a claim. A
web page that **is** one is the proof.

So this project is still a presentation in every way the brief cares about: it moves
from one idea to the next, and it can be put on a screen and walked through out loud.
It's just made the way I make things every day: in code, in the browser, with
components, styles, motion, and version control.

**How it's made is part of what it says.** The talk explains my job, and the project
is an example of that job.

## Principles

- **Show, don't tell.** If a slide would describe something, this project tries to
  demonstrate it instead.
- **Still a presentation.** Being creative doesn't mean ignoring the brief. It has to
  be easy to follow, easy to navigate, and easy to present live.
- **The repository is part of the talk.** The specs, components, and commit history
  show how I work. Reading the source is another way to watch the presentation.
- **Small and polished.** A few sections done well beat many done halfway.
- **Real tools, real workflow.** It uses the same stack and process I'd use on a
  real project, not a toy setup made only for the demo.

## How it's built

| Tool                                           | Role                                                                  |
| :--------------------------------------------- | :-------------------------------------------------------------------- |
| [Astro](https://astro.build)                   | Content-first pages that ship only the JavaScript they need           |
| [Tailwind CSS](https://tailwindcss.com)        | Styling                                                               |
| [daisyUI](https://daisyui.com)                 | UI components and theming on top of Tailwind                          |
| [GSAP](https://gsap.com)                       | Animation and transitions, the part that makes the "slides" move      |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | Spec-driven workflow: each feature starts as a proposal, design, and task list before any code, built with AI coding agents |

## Running it

Requires Node.js `>=22.12.0` and [pnpm](https://pnpm.io).

| Command        | Action                                        |
| :------------- | :-------------------------------------------- |
| `pnpm install` | Install dependencies                          |
| `pnpm dev`     | Start the dev server at `localhost:4321`      |
| `pnpm build`   | Build the production site to `./dist/`        |
| `pnpm preview` | Preview the production build locally          |

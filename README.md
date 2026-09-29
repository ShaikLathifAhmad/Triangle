::: {align="center"}
# △ Triangle

### Deal intelligence that remembers.

**Turn every customer conversation into context for the next one.**

```{=html}
<p>
```
`<a href="#-what-is-triangle">`{=html}Explore`</a>`{=html} ·
`<a href="#-how-it-works">`{=html}How it works`</a>`{=html} ·
`<a href="#-core-capabilities">`{=html}Capabilities`</a>`{=html} ·
`<a href="#-getting-started">`{=html}Get started`</a>`{=html}
```{=html}
</p>
```
![Status](https://img.shields.io/badge/status-hackathon%20project-f75c40?style=for-the-badge)
![Frontend](https://img.shields.io/badge/frontend-React%20%2F%20TypeScript-111827?style=for-the-badge&logo=react)
![Backend](https://img.shields.io/badge/backend-FastAPI-009688?style=for-the-badge&logo=fastapi)
![AI](https://img.shields.io/badge/AI-NVIDIA%20Nemotron-76B900?style=for-the-badge&logo=nvidia)
:::

------------------------------------------------------------------------

```{=html}
<details open>
```
```{=html}
<summary>
```
`<strong>`{=html}✨ The 30-second tour`</strong>`{=html}
```{=html}
</summary>
```
Triangle is an AI-powered deal intelligence platform for B2B sales
teams. It helps sales representatives prepare for customer meetings,
understand objections, and carry useful context from one interaction
into the next.

Unlike a one-off AI summary, Triangle is designed around **persistent
memory**: relevant context from previous deal interactions can be
retained and retrieved to enrich future briefings.

```{=html}
</details>
```
## 🧭 What is Triangle?

Sales conversations contain valuable details---pricing concerns,
implementation questions, preferences, and agreed next steps. When that
context is scattered across meetings, preparing for the next
conversation takes time.

Triangle brings deal context together and helps teams turn past
interactions into actionable meeting preparation.

> **The idea:** capture what matters, remember it, and bring it back
> when it is useful.

## ⚡ Core capabilities

```{=html}
<details open>
```
```{=html}
<summary>
```
`<strong>`{=html}🗂 Deal workspace`</strong>`{=html}
```{=html}
</summary>
```
Keep deal information and customer interactions organized in one place.
Use the workspace as the starting point for understanding a deal's
history.
```{=html}
</details>
```
```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}🧠 Persistent deal memory`</strong>`{=html}
```{=html}
</summary>
```
Triangle uses Hindsight to retain and retrieve relevant context from
previous interactions. Memory retrieval is used to provide context---not
to retrain the language model.
```{=html}
</details>
```
```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}📋 AI meeting briefings`</strong>`{=html}
```{=html}
</summary>
```
Generate meeting preparation from deal details, past interactions, and
relevant retrieved memories. Briefings can surface known facts, talking
points, potential objections, and suggested next steps.
```{=html}
</details>
```
```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}🔎 Conversation-aware AI insights`</strong>`{=html}
```{=html}
</summary>
```
Ask questions about earlier conversations and retrieve relevant context.
Responses should be grounded in stored interaction data and show their
source where available.
```{=html}
</details>
```
```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}🔁 Feedback and outcomes`</strong>`{=html}
```{=html}
</summary>
```
Capture feedback on briefings and record meeting outcomes. These signals
can help the product track usefulness and preserve new deal context.
```{=html}
</details>
```
## 🔄 How it works

``` mermaid
flowchart TD
    A["Customer interaction / transcript"] --> B["FastAPI backend"]
    B --> C["PostgreSQL<br/>Structured deal data & source transcript"]
    B --> D["Relevant context extraction"]
    D --> E["Hindsight Cloud<br/>Persistent memory"]
    E --> F["Retrieve relevant memories"]
    C --> G["Build briefing context"]
    F --> G
    G --> H["OpenRouter API"]
    H --> I["NVIDIA Nemotron"]
    I --> J["Meeting briefing / AI insight"]
    J --> K["React frontend"]
```

```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}What each component does`</strong>`{=html}
```{=html}
</summary>
```
  -----------------------------------------------------------------------
  Component                           Responsibility
  ----------------------------------- -----------------------------------
  React + TypeScript                  User interface and client-side
                                      interactions

  FastAPI                             API endpoints, validation, and
                                      application logic

  PostgreSQL                          Source of truth for deals,
                                      interactions, transcripts,
                                      feedback, and outcomes

  SQLAlchemy                          Python database access layer

  Hindsight Cloud                     Persistent memory retention and
                                      retrieval

  OpenRouter                          API access to the selected language
                                      model

  NVIDIA Nemotron                     Language understanding and briefing
                                      generation
  -----------------------------------------------------------------------

**Important:** PostgreSQL stores the original interaction record.
Hindsight provides a memory layer for retrieving useful context. The LLM
is not retrained as part of this workflow.
```{=html}
</details>
```
## 🖥️ Product areas

  -----------------------------------------------------------------------
  Area                                Purpose
  ----------------------------------- -----------------------------------
  Dashboard                           Overview of deal activity and
                                      intelligence

  Deal Workspace                      Deal details and interaction
                                      history

  AI Intelligence Briefing            Meeting preparation enriched with
                                      relevant context

  Memory & Learning                   Explore retained memories and the
                                      memory workflow
  -----------------------------------------------------------------------

## 🧰 Tech stack

```{=html}
<p>
```
`<img alt="React" src="https://img.shields.io/badge/React-UI-61DAFB?logo=react&logoColor=111827">`{=html}
`<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-language-3178C6?logo=typescript&logoColor=white">`{=html}
`<img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-API-009688?logo=fastapi&logoColor=white">`{=html}
`<img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-database-4169E1?logo=postgresql&logoColor=white">`{=html}
`<img alt="Hindsight" src="https://img.shields.io/badge/Hindsight-persistent%20memory-f75c40">`{=html}
`<img alt="OpenRouter" src="https://img.shields.io/badge/OpenRouter-model%20gateway-111827">`{=html}
`<img alt="NVIDIA" src="https://img.shields.io/badge/NVIDIA-Nemotron-76B900?logo=nvidia&logoColor=white">`{=html}
```{=html}
</p>
```
## 🚀 Getting started

> These are the intended local setup steps. Exact commands may vary
> depending on the repository's current scripts and dependency files.

```{=html}
<details open>
```
```{=html}
<summary>
```
`<strong>`{=html}1. Prerequisites`</strong>`{=html}
```{=html}
</summary>
```
-   Node.js and npm
-   Python 3.10+
-   PostgreSQL (or the project's configured local fallback)
-   Hindsight Cloud account and API key
-   OpenRouter API key with access to the configured model

```{=html}
</details>
```
```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}2. Configure environment variables`</strong>`{=html}
```{=html}
</summary>
```
Create a backend `.env` file based on `.env.example` (if present).
Typical settings include:

``` env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@localhost:5432/triangle
OPENROUTER_API_KEY=your_openrouter_key
HINDSIGHT_API_KEY=your_hindsight_key
HINDSIGHT_BASE_URL=your_hindsight_endpoint
HINDSIGHT_BANK_ID=triangle-deal-memory
```

Use the exact Hindsight endpoint and model identifier shown in your
account and project configuration. Never commit `.env` or expose
server-side keys in the frontend.
```{=html}
</details>
```
```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}3. Install dependencies`</strong>`{=html}
```{=html}
</summary>
```
**Backend**

``` bash
cd backend
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows PowerShell
# .venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

**Frontend**

``` bash
cd frontend
npm install
```

```{=html}
</details>
```
```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}4. Run the application`</strong>`{=html}
```{=html}
</summary>
```
Start the backend using the command defined by the project. For a
typical FastAPI app:

``` bash
uvicorn app.main:app --reload
```

Start the frontend:

``` bash
npm run dev
```

Open the local URL printed by Vite in your terminal. If your repository
uses different folder names or entry points, use its actual
configuration.
```{=html}
</details>
```
## 🧪 Example memory journey

```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}Expand: from conversation to briefing`</strong>`{=html}
```{=html}
</summary>
```
**1 --- Conversation recorded**

A customer explains that the proposed price is difficult to approve
upfront and asks about phased deployment.

**2 --- Context retained**

The backend keeps the original transcript in PostgreSQL and sends
relevant context to Hindsight for memory retention.

**3 --- Context retrieved**

Before the next meeting, the backend asks Hindsight for memories
relevant to the deal and meeting.

**4 --- Briefing enriched**

The backend supplies the deal data and retrieved context to the language
model. The resulting briefing can mention the customer's pricing concern
and phased-deployment request.

**5 --- Source-aware result**

Where supported by the implementation, the UI should show the source
interaction and date so users can verify the context.
```{=html}
</details>
```
## 🔐 Security notes

-   Keep API keys on the backend; never expose them in browser code.
-   Keep `.env` out of version control.
-   Avoid placing secrets or unnecessary personal data in transcripts
    and memory.
-   Treat generated insights as assistance; users should verify
    important customer details against source interactions.

## 🗺️ Project status

Triangle is a hackathon project. Features, integrations, and setup
details should be considered complete only when verified in the current
codebase and environment.

-   [ ] Verify database migrations and seed data
-   [ ] Verify Hindsight retain and recall against the configured cloud
    bank
-   [ ] Verify OpenRouter model configuration
-   [ ] Run an end-to-end briefing test
-   [ ] Confirm feedback and meeting outcomes persist correctly

## 🤝 Contributing

For a hackathon build, keep changes focused and document any new
environment variables, setup commands, or API behavior. Before
submitting changes, run the relevant frontend and backend checks.

## 📄 License

Add the license that applies to this repository. Until one is selected,
all rights remain with the project owner.

------------------------------------------------------------------------

::: {align="center"}
**Triangle** · Remember the conversation. Prepare for what comes next.
:::

# Triangle

### AI-Powered Deal Intelligence Platform

**Turning customer conversations into actionable deal intelligence.**

<details>
<summary><strong>📌 Project Overview</strong></summary>

Triangle is an AI-powered Deal Intelligence Platform designed to help B2B sales representatives and account executives prepare for customer meetings, understand customer concerns, and make informed sales decisions.

By combining AI-powered insights with persistent memory, Triangle retains relevant context from past deal interactions and uses it to generate personalized meeting briefings. This helps sales teams maintain continuity across conversations and preserve important customer information.

</details>

<details>
<summary><strong> Key Features</strong></summary>

* **Deal Management:** Organize deals and track customer interactions.
* **AI Meeting Briefings:** Generate personalized meeting preparation using deal information and past conversations.
* **Persistent AI Memory:** Retain and retrieve relevant context from previous interactions using Hindsight.
* **Conversation Intelligence:** Retrieve relevant information from previous customer conversations.
* **Objection Analysis:** Identify potential customer concerns and generate suggested responses.
* **Meeting Outcomes:** Record meeting results and preserve important deal context.

</details>

<details> <summary><strong> Capture — Collect Deal & Customer Context</strong></summary>

Triangle begins by collecting structured and unstructured information associated with a deal.

This may include:

Customer and account information
Deal details and sales stage
Previous customer conversations
Meeting notes and outcomes
Customer requirements and preferences
Previously raised objections
Follow-up actions and commitments

The captured information provides the foundation for building a continuously evolving context around each deal.

</details>

<details> <summary><strong>2️⃣ Remember — Build Persistent Deal Memory</strong></summary>

Instead of treating every interaction as an isolated AI request, Triangle uses Hindsight Cloud as its persistent memory layer.

Relevant information from customer interactions is retained so that important context can be reused in future conversations.

The memory layer helps preserve:

Customer preferences
Previous discussions
Important requirements
Historical objections
Decisions and commitments
Meeting outcomes
Context from earlier interactions

This enables Triangle to maintain continuity across multiple customer interactions.

</details>

<details> <summary><strong>3️⃣ Retrieve — Find Relevant Context</strong></summary>

When a sales representative prepares for a new meeting, Triangle retrieves the most relevant information from the stored deal context.

Rather than sending the entire conversation history to the AI model, the system focuses on information relevant to the current task.

For example:

Current Meeting
      ↓
Identify Deal Context
      ↓
Retrieve Relevant Memories
      ↓
Combine With Current Deal Data
      ↓
Prepare AI Context

This creates a focused context window for downstream AI reasoning.

</details>

<details> <summary><strong>4️⃣ Analyze — AI-Powered Deal Reasoning</strong></summary>

The retrieved context is passed through the AI processing layer using OpenRouter and NVIDIA Nemotron.

The model analyzes the available information to identify patterns and useful sales signals such as:

Customer concerns
Unresolved requirements
Potential objections
Important previous commitments
Discussion points
Follow-up opportunities
Relevant deal context

The objective is not simply to generate text, but to transform historical information into actionable deal intelligence.

</details>

<details> <summary><strong>5️⃣ Generate — Create Personalized Meeting Intelligence</strong></summary>

Based on the retrieved context and AI analysis, Triangle generates personalized outputs for the sales representative.

These can include:

📝 Meeting preparation summaries
🎯 Key discussion points
⚠️ Potential objections
💬 Suggested responses
🔍 Important customer context
📌 Follow-up considerations
🧠 Deal intelligence

The generated information is presented through the React interface so that the sales representative can quickly understand what matters before entering the meeting.

</details>

<details> <summary><strong>6️⃣ Learn — Preserve New Meeting Outcomes</strong></summary>

After the meeting, new information can become part of the deal's persistent context.

Meeting outcomes, newly discovered requirements, customer concerns, and important decisions can be retained through the memory layer.

This creates a continuous feedback loop:

Interaction
     ↓
Memory
     ↓
Retrieval
     ↓
AI Reasoning
     ↓
Meeting Intelligence
     ↓
Meeting Outcome
     ↓
Updated Memory
     ↺

As a result, Triangle is designed to become increasingly context-aware as the deal progresses.

</details>

<details>
<summary><strong>🧠 System Architecture</strong></summary>

```mermaid
flowchart TD
    A["React Frontend"] --> B["FastAPI Backend"]
    B --> C["PostgreSQL"]
    B --> D["Hindsight Cloud"]
    B --> E["OpenRouter"]
    E --> F["NVIDIA Nemotron"]
    C --> B
    D --> B
    F --> B
    B --> A
```

</details>

---

<div align="center">

**△ Triangle**

*Remember every conversation. Prepare for the next.*

</div>

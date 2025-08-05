# Flow‑Builder AI Assistant: LangChain + Groq (TypeScript)

A complete markdown specification for implementing an AI‑powered flow-authoring tool using **open‑source** LangChain + Groq (TypeScript). Copy-paste this into a `.md` or `.txt` file.

---

## 🔥 Tech Stack & Architecture

* **Framework:** Next.js 15 (App Router + Server Actions, MIT)
* **UI:** React 19 (RC), Tailwind CSS, shadcn/ui, Framer Motion
* **Flow Editor:** React Flow v11 (MIT)
* **State Management:** Zustand (or Jotai)
* **LLM Backend:** Groq (via `@langchain/groq`), running on llama-3.3-70b or similar open‐source model
* **Orchestration & Parsing:** LangChain JS/TS (`@langchain/core`)
* **Deployment:** Docker / Vercel / self‑hosted (Edge Runtime optional)

### 🧩 Why shadcn/ui and Radix?

- **Radix UI primitives** provide accessible, unstyled, headless components for consistent behavior across devices.
- **shadcn/ui** wraps Radix components into a beautiful, fully themeable and ready-to-use UI kit using Tailwind — ideal for fast prototyping while retaining flexibility and control.

---

## ⚙️ Flow of Implementation

1. **Setup & UI Scaffolding**
   - Initialize Next.js 15 app with Tailwind and shadcn/ui.
   - Build the flow editor canvas using React Flow.
   - Create a state store using Zustand to manage nodes and edges.

2. **Node Editing Functionality**
   - Add toolbar UI to add, update, and delete nodes and edges.
   - Connect toolbar actions to your Zustand store and update the graph in real time.

3. **AI Assistant Integration**
   - Create a right-side AssistantPanel using shadcn/ui.
   - Add a text input or chatbox to accept natural language instructions.

4. **Backend AI Logic**
   - Use LangChain with `@langchain/groq` to interface with Groq’s LLM.
   - Format input using `ChatPromptTemplate`, run it through the LLM, and parse results with `JsonOutputParser`.

5. **Parsing & Output Handling**
   - Define a `FlowDiff` schema to match node/edge diff logic.
   - On invalid JSON from the model, fallback to `OutputFixingParser` for robustness.

6. **UI Application of Flow Changes**
   - Use `getFlowDiff(user_instruction)` to receive diffs.
   - Preview and confirm changes before applying to the canvas state.

7. **Deployment**
   - Choose Docker or Vercel for deployment. Use `.env` for API key security.
   - Test responsiveness and apply basic SEO and accessibility best practices.

---

## ✅ Quick Setup Summary

1. **Install dependencies**:

   ```bash
   npm install @langchain/groq @langchain/core reactflow zustand tailwindcss shadcn/ui
   ```

2. **Configure `.env`**:

   ```env
   GROQ_API_KEY="your-groq-api-key"
   ```

3. **Implement** `flowAI.ts` and import `getFlowDiff` in your UI.

4. **Wire** the AssistantPanel to call `getFlowDiff`, preview diff, and apply via your store.

5. **Deploy** to your chosen environment (Docker, Edge Runtime, or Vercel).

---

With this doc, you can directly copy/paste into your project and implement a powerful, open‑source AI assistant for flow‑based authoring. Enjoy building! 🚀
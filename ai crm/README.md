# CRM AI + MCP POC

A CRM POC where the **Customer** is the navigation level and **Lead** is the AI-analysis level.

## UX

Customers page shows only customers with active leads. Open a customer and use:

- **Leads** — PRE-SALE and POST-SALE leads. Each lead has its own AI analysis.
- **Follow-ups** — basic follow-up data.
- **Interactions / Conversations** — basic CRM timeline data.
- **Orders** — basic order data.

PRE-SALE leads have no linked order. POST-SALE leads have a linked order.

## AI analysis persistence

AI analysis is stored in a separate MongoDB `leadanalyses` collection.

- First click on **Analyze Lead** calls the LangChain/Groq flow and saves version 1.
- Opening the customer/lead later loads the latest saved analysis; it does **not** call the LLM again.
- Clicking **Re-analyze Lead** manually calls the agent again and stores a new version (v2, v3, ...). Previous analyses remain available in the collection.
- `GET /api/leads/:id/analysis` returns the latest saved result.
- `GET /api/leads/:id/analysis/history` returns all generated versions.
- `POST /api/leads/:id/analyze` generates and persists a new version.

## Data seed

The seed creates:

- 10 customers
- 20 active leads: 10 PRE_SALE + 10 POST_SALE
- 40 conversation messages
- 20 interactions
- 20 follow-ups
- 10 orders linked to POST_SALE leads
- 0 AI analyses initially (generate them from the UI)

The seed clears the CRM collections, including `leadanalyses`, before recreating the POC data.

## Run

### MongoDB

Use local MongoDB or MongoDB Atlas.

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

Backend defaults to `http://localhost:4000`.

Example `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/crm-ai-poc
PORT=4000
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
MCP_SERVER_URL=http://localhost:4001
```

### MCP tool server

```bash
cd mcp-server
npm install
copy .env.example .env
npm run dev
```

MCP tool server defaults to `http://localhost:4001`.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend defaults to the Vite URL shown by Vite, usually `http://localhost:5173`.

## Architecture

```text
React CRM
   |
   v
Node/Express API
   |
   +--> LeadAnalysis collection (cached/persisted AI result)
   |
   v
LangChain Agent/analysis service
   |
   v
MCP tool server
   |
   +--> lead
   +--> conversations
   +--> interactions
   +--> follow-ups
   +--> order (POST_SALE)
   |
   v
MongoDB
```

The analysis is intentionally **lead-specific**. The MCP context is scoped by `leadId`, so another lead for the same customer is not mixed into the analysis.

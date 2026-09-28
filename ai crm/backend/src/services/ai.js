import {ChatGroq} from '@langchain/groq';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {StructuredOutputParser} from '@langchain/core/output_parsers';
import {z} from 'zod';
import {Lead,LeadAnalysis} from '../models/index.js';

const schema=z.object({
  summary:z.string(),
  sentiment:z.enum(['POSITIVE','NEUTRAL','NEGATIVE']),
  satisfactionScore:z.number().min(0).max(100).nullable(),
  purchaseIntent:z.enum(['HIGH','MEDIUM','LOW','N/A']),
  leadRisk:z.enum(['LOW','MEDIUM','HIGH']),
  engagement:z.enum(['HIGH','MEDIUM','LOW']),
  keySignals:z.array(z.string()),
  concerns:z.array(z.string()),
  recommendedActions:z.array(z.string())
});
const parser=StructuredOutputParser.fromZodSchema(schema);

async function getLeadContext(leadId){
  const base=process.env.MCP_SERVER_URL||'http://localhost:4001';
  const r=await fetch(`${base}/tools/lead-context/${leadId}`);
  if(!r.ok) throw new Error(`MCP context request failed: ${r.status}`);
  return r.json();
}

export async function getLatestLeadAnalysis(leadId){
  return LeadAnalysis.findOne({leadId}).sort({version:-1}).lean();
}

export async function getLeadAnalysisHistory(leadId){
  return LeadAnalysis.find({leadId}).sort({version:-1}).lean();
}

export async function analyzeLead(leadId){
  const lead=await Lead.findById(leadId);
  if(!lead) throw new Error('Lead not found');

  const context=await getLeadContext(leadId);
  console.log("context",context)
  const focus=lead.type==='PRE_SALE'
    ? 'For PRE_SALE evaluate purchase intent, engagement, objections, product interest, conversion signals, sentiment and next action. Satisfaction may be null because there is no order yet.'
    : 'For POST_SALE evaluate satisfaction, sentiment, order experience, issue severity, churn/customer risk and next action. Purchase intent can be N/A.';

  const prompt=ChatPromptTemplate.fromMessages([
    ['system',`You are a CRM lead-insights analyst. Analyze only the supplied CRM context. Do not invent facts. ${focus}\nReturn JSON matching the schema.\n{format_instructions}`],
    ['human','Lead context:\n{context}']
  ]);
  const modelName=process.env.GROQ_MODEL||'llama-3.3-70b-versatile';
  const model=new ChatGroq({apiKey:process.env.GROQ_API_KEY,model:modelName,temperature:0});
  const chain=prompt.pipe(model).pipe(parser);
  console.log("chain",chain)
  const result=await chain.invoke({context:JSON.stringify(context),format_instructions:parser.getFormatInstructions()});
  console.log("result",result)

  const latest=await LeadAnalysis.findOne({leadId}).sort({version:-1}).select('version').lean();
  const version=(latest?.version||0)+1;
  const saved=await LeadAnalysis.create({
    ...result,
    leadId,
    customerId:lead.customerId,
    leadType:lead.type,
    version,
    model:modelName,
    generatedAt:new Date()
  });
  return saved.toObject();
}

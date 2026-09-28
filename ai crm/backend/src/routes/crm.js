import {Router} from 'express';
import {Customer,Lead,Conversation,Interaction,FollowUp,Order} from '../models/index.js';
import {analyzeLead,getLatestLeadAnalysis,getLeadAnalysisHistory} from '../services/ai.js';

const router=Router();
router.get('/customers', async (_req,res)=>{
  const customers=await Customer.aggregate([
    {$lookup:{from:'leads',localField:'_id',foreignField:'customerId',as:'leads'}},
    {$addFields:{activeLeadCount:{$size:{$filter:{input:'$leads',as:'l',cond:{$in:['$$l.status',['NEW','CONTACTED','QUALIFIED','AT_RISK']]}}}}}},
    {$match:{activeLeadCount:{$gt:0}}},{$project:{leads:0}}
  ]); res.json(customers);
});
router.get('/customers/:id', async (req,res)=>res.json(await Customer.findById(req.params.id)));
router.get('/customers/:id/leads', async (req,res)=>res.json(await Lead.find({customerId:req.params.id}).sort({createdAt:-1})));
router.get('/customers/:id/followups', async (req,res)=>res.json(await FollowUp.find({customerId:req.params.id}).sort({dueDate:1})));
router.get('/customers/:id/interactions', async (req,res)=>{
  const [i,c]=await Promise.all([Interaction.find({customerId:req.params.id}).sort({timestamp:-1}),Conversation.find({customerId:req.params.id}).sort({timestamp:-1})]); res.json({interactions:i,conversations:c});
});
router.get('/customers/:id/orders', async (req,res)=>res.json(await Order.find({customerId:req.params.id}).sort({createdAt:-1})));
router.get('/leads/:id', async (req,res)=>res.json(await Lead.findById(req.params.id)));
router.get('/leads/:id/analysis', async (req,res)=>{
  try { const analysis=await getLatestLeadAnalysis(req.params.id); res.json(analysis||null); } catch(e) { res.status(500).json({error:e.message}); }
});
router.get('/leads/:id/analysis/history', async (req,res)=>{
  try { res.json(await getLeadAnalysisHistory(req.params.id)); } catch(e) { res.status(500).json({error:e.message}); }
});
router.post('/leads/:id/analyze', async (req,res)=>{
  try { res.json(await analyzeLead(req.params.id)); } catch(e) { res.status(500).json({error:e.message}); }
});
export default router;

import {Customer,Lead,Conversation,Interaction,FollowUp,Order} from '../models.js';
export async function getCustomer(customerId){return Customer.findById(customerId).lean();}
export async function getCustomerLeads(customerId){return Lead.find({customerId}).lean();}
export async function getLead(leadId){return Lead.findById(leadId).lean();}
export async function getLeadConversations(leadId){return Conversation.find({leadId}).sort({timestamp:1}).lean();}
export async function getLeadInteractions(leadId){return Interaction.find({leadId}).sort({timestamp:1}).lean();}
export async function getLeadFollowups(leadId){return FollowUp.find({leadId}).sort({dueDate:1}).lean();}
export async function getLeadOrder(leadId){return Order.findOne({leadId}).lean();}
export async function getLeadContext(leadId){
 const lead=await getLead(leadId); if(!lead) throw new Error('Lead not found');
 const [customer,conversations,interactions,followups,order]=await Promise.all([getCustomer(lead.customerId),getLeadConversations(leadId),getLeadInteractions(leadId),getLeadFollowups(leadId),getLeadOrder(leadId)]);
 return {customer,lead,conversations,interactions,followups,order};
}

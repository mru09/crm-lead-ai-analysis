import mongoose from 'mongoose';

const Customer = mongoose.model('Customer', new mongoose.Schema({
  name: {type:String, required:true}, email:String, phone:String, status:{type:String,default:'Active'}, createdAt:{type:Date,default:Date.now}
}));

const Lead = mongoose.model('Lead', new mongoose.Schema({
  customerId:{type:mongoose.Schema.Types.ObjectId,ref:'Customer',required:true},
  title:String, type:{type:String,enum:['PRE_SALE','POST_SALE'],required:true}, status:String, source:String, product:String,
  orderId:{type:mongoose.Schema.Types.ObjectId,ref:'Order',default:null}, assignedTo:String, createdAt:{type:Date,default:Date.now}
}));

const Conversation = mongoose.model('Conversation', new mongoose.Schema({
  customerId:{type:mongoose.Schema.Types.ObjectId,ref:'Customer',required:true}, leadId:{type:mongoose.Schema.Types.ObjectId,ref:'Lead',required:true},
  channel:String, sender:{type:String,enum:['CUSTOMER','AGENT']}, message:String, timestamp:{type:Date,default:Date.now}
}));

const Interaction = mongoose.model('Interaction', new mongoose.Schema({
  customerId:{type:mongoose.Schema.Types.ObjectId,ref:'Customer',required:true}, leadId:{type:mongoose.Schema.Types.ObjectId,ref:'Lead',required:true},
  type:String, notes:String, timestamp:{type:Date,default:Date.now}
}));

const FollowUp = mongoose.model('FollowUp', new mongoose.Schema({
  customerId:{type:mongoose.Schema.Types.ObjectId,ref:'Customer',required:true}, leadId:{type:mongoose.Schema.Types.ObjectId,ref:'Lead',required:true},
  title:String, dueDate:Date, priority:{type:String,default:'MEDIUM'}, status:{type:String,default:'OPEN'}
}));

const Order = mongoose.model('Order', new mongoose.Schema({
  customerId:{type:mongoose.Schema.Types.ObjectId,ref:'Customer',required:true}, leadId:{type:mongoose.Schema.Types.ObjectId,ref:'Lead'},
  product:String, amount:Number, status:String, createdAt:{type:Date,default:Date.now}
}));

// One document is created for every AI generation. This preserves the history of
// manual re-analysis instead of overwriting the previous result.
const LeadAnalysis = mongoose.model('LeadAnalysis', new mongoose.Schema({
  leadId:{type:mongoose.Schema.Types.ObjectId,ref:'Lead',required:true,index:true},
  customerId:{type:mongoose.Schema.Types.ObjectId,ref:'Customer',required:true,index:true},
  leadType:{type:String,enum:['PRE_SALE','POST_SALE'],required:true},
  version:{type:Number,required:true},
  generatedAt:{type:Date,default:Date.now},
  model:String,
  summary:String,
  sentiment:{type:String,enum:['POSITIVE','NEUTRAL','NEGATIVE']},
  satisfactionScore:{type:Number,min:0,max:100,default:null},
  purchaseIntent:String,
  leadRisk:{type:String,enum:['LOW','MEDIUM','HIGH']},
  engagement:{type:String,enum:['HIGH','MEDIUM','LOW']},
  keySignals:[String],
  concerns:[String],
  recommendedActions:[String]
},{timestamps:true}));

export {Customer,Lead,Conversation,Interaction,FollowUp,Order,LeadAnalysis};

import mongoose from 'mongoose';
const Customer=mongoose.model('Customer',new mongoose.Schema({name:String,email:String,phone:String,status:String}));
const Lead=mongoose.model('Lead',new mongoose.Schema({customerId:mongoose.Schema.Types.ObjectId,title:String,type:String,status:String,source:String,product:String,orderId:mongoose.Schema.Types.ObjectId,assignedTo:String,createdAt:Date}));
const Conversation=mongoose.model('Conversation',new mongoose.Schema({customerId:mongoose.Schema.Types.ObjectId,leadId:mongoose.Schema.Types.ObjectId,channel:String,sender:String,message:String,timestamp:Date}));
const Interaction=mongoose.model('Interaction',new mongoose.Schema({customerId:mongoose.Schema.Types.ObjectId,leadId:mongoose.Schema.Types.ObjectId,type:String,notes:String,timestamp:Date}));
const FollowUp=mongoose.model('FollowUp',new mongoose.Schema({customerId:mongoose.Schema.Types.ObjectId,leadId:mongoose.Schema.Types.ObjectId,title:String,dueDate:Date,priority:String,status:String}));
const Order=mongoose.model('Order',new mongoose.Schema({customerId:mongoose.Schema.Types.ObjectId,leadId:mongoose.Schema.Types.ObjectId,product:String,amount:Number,status:String,createdAt:Date}));
export {Customer,Lead,Conversation,Interaction,FollowUp,Order};

import 'dotenv/config';
import {connectDb} from './db.js';
import {Customer,Lead,Conversation,Interaction,FollowUp,Order,LeadAnalysis} from './models/index.js';

await connectDb();
await Promise.all([
  Customer.deleteMany({}), Lead.deleteMany({}), Conversation.deleteMany({}),
  Interaction.deleteMany({}), FollowUp.deleteMany({}), Order.deleteMany({}), LeadAnalysis.deleteMany({})
]);

const customers = [
  ['Rahul Sharma','rahul.sharma@example.com','+91 98765 43210'],
  ['Priya Mehta','priya.mehta@example.com','+91 98765 12345'],
  ['Amit Patel','amit.patel@example.com','+91 98200 11223'],
  ['Neha Shah','neha.shah@example.com','+91 98190 22334'],
  ['Arjun Desai','arjun.desai@example.com','+91 98920 33445'],
  ['Sneha Kulkarni','sneha.kulkarni@example.com','+91 97690 44556'],
  ['Rohan Joshi','rohan.joshi@example.com','+91 97570 55667'],
  ['Kavya Iyer','kavya.iyer@example.com','+91 98450 66778'],
  ['Vikram Nair','vikram.nair@example.com','+91 99870 77889'],
  ['Ananya Rao','ananya.rao@example.com','+91 99000 88990']
];

const products = [
  ['Premium Running Shoes','Running Shoes'],
  ['Fitness Tracker','Fitness Tracker'],
  ['Wireless Headphones','Wireless Headphones'],
  ['Smart Watch','Smart Watch'],
  ['Gaming Laptop','Gaming Laptop'],
  ['Office Chair','Ergonomic Office Chair'],
  ['Travel Backpack','Travel Backpack'],
  ['Noise Cancelling Earbuds','Noise Cancelling Earbuds'],
  ['Yoga Mat','Premium Yoga Mat'],
  ['Smart Home Hub','Smart Home Hub']
];

const customerDocs = await Customer.insertMany(customers.map(([name,email,phone]) => ({name,email,phone,status:'Active'})));

for (let i=0; i<customerDocs.length; i++) {
  const customer = customerDocs[i];
  const [preTitle, preProduct] = products[i];
  const postProduct = products[(i+2)%products.length][1];
  const postTitle = `${postProduct} Support`;
  const agent = ['Amit','Neha','Ravi','Meera'][i%4];

  // Every customer has an active PRE_SALE lead without an order.
  const pre = await Lead.create({
    customerId:customer._id, title:preTitle, type:'PRE_SALE',
    status:['NEW','CONTACTED','QUALIFIED'][i%3], source:['Website','Referral','Campaign'][i%3],
    product:preProduct, assignedTo:agent
  });

  // Every customer also has a POST_SALE lead linked to a real order.
  const order = await Order.create({
    customerId:customer._id, product:postProduct,
    amount:[7999,12999,15999,8999,54999,18999,4999,6999,2999,11999][i],
    status:i%4===0?'Delivered':i%4===1?'Shipped':'Delivered'
  });
  const post = await Lead.create({
    customerId:customer._id, title:postTitle, type:'POST_SALE',
    status:['AT_RISK','CONTACTED','QUALIFIED'][i%3], source:'Support',
    product:postProduct, orderId:order._id, assignedTo:agent
  });
  order.leadId=post._id;
  await order.save();

  const preMessages = [
    [`I am interested in the ${preProduct}. Can you share the price and delivery timeline?`,`Sure, I can share the details and check the latest delivery estimate.`],
    [`I like the ${preProduct}, but I am comparing a few options.`,`I can help compare the features and pricing.`],
    [`Does the ${preProduct} have the features I need?`,`Yes, let me send you the detailed specifications.`],
    [`Can you give me a better price on the ${preProduct}?`,`I will check the available offer for you.`],
    [`I want to buy the ${preProduct} this week if delivery is quick.`,`I will confirm availability and delivery.`]
  ][i%5];
  const postMessages = [
    [`The ${postProduct} arrived and everything looks good.`,`Glad to hear that. Please reach out if you need anything else.`],
    [`I am frustrated because there is an issue with my ${postProduct}.`,`Sorry about the issue. I will help arrange a resolution.`],
    [`The order was delivered later than expected, but the product is fine.`,`Apologies for the delay. We will review the delivery experience.`],
    [`I need help with my ${postProduct}. The setup is not working as expected.`,`I can arrange support and guide you through the setup.`],
    [`I am happy with the product, but I expected faster delivery.`,`Thanks for the feedback. We will check the delivery experience.`]
  ][i%5];

  await Conversation.insertMany([
    {customerId:customer._id,leadId:pre._id,channel:i%2?'Email':'WhatsApp',sender:'CUSTOMER',message:preMessages[0],timestamp:new Date(Date.now()-86400000*3)},
    {customerId:customer._id,leadId:pre._id,channel:i%2?'Email':'WhatsApp',sender:'AGENT',message:preMessages[1],timestamp:new Date(Date.now()-86400000*2)},
    {customerId:customer._id,leadId:post._id,channel:'WhatsApp',sender:'CUSTOMER',message:postMessages[0],timestamp:new Date(Date.now()-86400000)},
    {customerId:customer._id,leadId:post._id,channel:'WhatsApp',sender:'AGENT',message:postMessages[1],timestamp:new Date(Date.now()-43200000)}
  ]);

  await Interaction.insertMany([
    {customerId:customer._id,leadId:pre._id,type:'CALL',notes:['Product demo requested','Pricing discussed','Specifications shared'][i%3],timestamp:new Date(Date.now()-86400000*2)},
    {customerId:customer._id,leadId:post._id,type:i%2?'SUPPORT':'CALL',notes:['Order support discussion','Post-sale check-in','Issue reported'][i%3],timestamp:new Date(Date.now()-86400000)}
  ]);

  await FollowUp.insertMany([
    {customerId:customer._id,leadId:pre._id,title:`Follow up on ${preProduct} interest`,dueDate:new Date(Date.now()+86400000*(i%3+1)),priority:i%3===0?'HIGH':'MEDIUM',status:'OPEN'},
    {customerId:customer._id,leadId:post._id,title:`Check ${postProduct} post-sale status`,dueDate:new Date(Date.now()+86400000*(i%4+1)),priority:i%3===1?'HIGH':'MEDIUM',status:i%4===0?'COMPLETED':'OPEN'}
  ]);
}

console.log('Seed complete: 10 customers, 20 leads (10 PRE_SALE + 10 POST_SALE), conversations, interactions, follow-ups and 10 linked orders.');
process.exit(0);

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {connectDb} from './db.js';
import crm from './routes/crm.js';
const app=express(); app.use(cors()); app.use(express.json()); app.get('/api/health',(_req,res)=>res.json({ok:true})); app.use('/api',crm);
connectDb().then(()=>app.listen(process.env.PORT||4000,()=>console.log(`API on ${process.env.PORT||4000}`))).catch(e=>{console.error(e);process.exit(1)});

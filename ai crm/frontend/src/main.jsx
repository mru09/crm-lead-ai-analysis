import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';
const API=import.meta.env.VITE_API_URL||'http://localhost:4000/api';
const fmt=d=>d?new Date(d).toLocaleDateString():'';

function App(){
 const [customers,setCustomers]=useState([]),[customer,setCustomer]=useState(null),[tab,setTab]=useState('Leads'),[data,setData]=useState([]),[analyses,setAnalyses]=useState({}),[loading,setLoading]=useState(false);
 useEffect(()=>{fetch(`${API}/customers`).then(r=>r.json()).then(setCustomers)},[]);
 async function openCustomer(c){setCustomer(c);setTab('Leads');await loadTab(c._id,'Leads')}
 async function loadTab(id,t){
   setLoading(true);
   let u=t==='Leads'?`customers/${id}/leads`:t==='Follow-ups'?`customers/${id}/followups`:t==='Orders'?`customers/${id}/orders`:`customers/${id}/interactions`;
   const r=await fetch(`${API}/${u}`); const result=await r.json(); setData(result); setLoading(false);
   if(t==='Leads'){
     const list=await Promise.all(result.map(async l=>{const ar=await fetch(`${API}/leads/${l._id}/analysis`);return [l._id,await ar.json()]}));
     setAnalyses(Object.fromEntries(list.filter(([,a])=>a)));
   }
 }
 async function analyze(id){
   setAnalyses(a=>({...a,[id]:{...(a[id]||{}),loading:true}}));
   const r=await fetch(`${API}/leads/${id}/analyze`,{method:'POST'}); const x=await r.json();
   if(!r.ok){setAnalyses(a=>({...a,[id]:{error:x.error||'Analysis failed'}}));return}
   setAnalyses(a=>({...a,[id]:x}));
 }
 return <div className="app"><aside><h2>CRM</h2><div className="nav active">Customers</div><div className="nav">Dashboard</div><div className="nav">Reports</div></aside><main>
 {!customer?<><h1>Customers</h1><p className="muted">Customers with active leads</p><div className="table">{customers.map(c=><div className="row clickable" onClick={()=>openCustomer(c)} key={c._id}><div><b>{c.name}</b><small>{c.email}</small></div><span>{c.activeLeadCount} active leads</span><span className="status">{c.status}</span></div>)}</div></>:<>
 <button className="back" onClick={()=>setCustomer(null)}>← Customers</button><div className="customerHead"><div><h1>{customer.name}</h1><p>{customer.email} · {customer.phone}</p></div><span className="status">{customer.status}</span></div>
 <div className="tabs">{['Leads','Follow-ups','Interactions / Conversations','Orders'].map(t=><button key={t} className={tab===t?'tab activeTab':'tab'} onClick={()=>{setTab(t);loadTab(customer._id,t)}}>{t}</button>)}</div>
 {loading?<p>Loading...</p>:tab==='Leads'?<Leads data={data} analyses={analyses} analyze={analyze}/>:tab==='Follow-ups'?<Followups data={data}/>:tab==='Orders'?<Orders data={data}/>:<Interactions data={data}/>}</>}</main></div>
}
function Leads({data,analyses,analyze}){return <section><div className="sectionHead"><h2>Leads</h2><span>{data.length} leads</span></div>{data.map(l=>{const a=analyses[l._id];return <article className="card" key={l._id}><div className="leadHead"><div><h3>{l.title}</h3><p>{l.product} · {l.source} · Assigned to {l.assignedTo}</p></div><div><span className="pill">{l.type.replace('_','-')}</span><span className="pill">{l.status}</span></div></div><div className="analysisHead"><div><b>🤖 AI Lead Analysis</b>{a?.version&&<small>Saved analysis v{a.version} · {fmt(a.generatedAt)}</small>}</div><button disabled={a?.loading} onClick={()=>analyze(l._id)}>{a?.summary?'Re-analyze Lead':'Analyze Lead'}</button></div>{a?.loading?<p>Analyzing lead context and saving the result...</p>:a?.error?<p className="error">{a.error}</p>:a?.summary?<Analysis a={a}/>:<p className="muted">No saved analysis yet. Click Analyze Lead to generate and store one. Future page loads use the saved result until you manually re-analyze.</p>}</article>})}</section>}
function Analysis({a}){return <div><div className="metrics"><Metric label="Sentiment" value={a.sentiment}/><Metric label="Purchase Intent" value={a.purchaseIntent}/><Metric label="Risk" value={a.leadRisk}/><Metric label="Engagement" value={a.engagement}/>{a.satisfactionScore!=null&&<Metric label="Satisfaction" value={`${a.satisfactionScore}%`}/>}</div><p><b>Summary</b><br/>{a.summary}</p><div className="two"><div><b>Key Signals</b><ul>{a.keySignals.map((x,i)=><li key={i}>{x}</li>)}</ul></div><div><b>Concerns</b><ul>{a.concerns.map((x,i)=><li key={i}>{x}</li>)}</ul></div></div><div><b>Recommended Actions</b><ul>{a.recommendedActions.map((x,i)=><li key={i}>{x}</li>)}</ul></div></div>}
function Metric({label,value}){return <div className="metric"><small>{label}</small><strong>{value}</strong></div>}
function Followups({data}){return <Simple title="Follow-ups" cols={['title','priority','status','dueDate']} data={data}/>}
function Orders({data}){return <Simple title="Orders" cols={['product','amount','status','createdAt']} data={data}/>} 
function Interactions({data}){return <><Simple title="Interactions" cols={['type','notes','timestamp']} data={data.interactions||[]}/><Simple title="Conversations" cols={['channel','sender','message','timestamp']} data={data.conversations||[]}/></>}
function Simple({title,cols,data}){return <section><div className="sectionHead"><h2>{title}</h2></div><div className="table">{data.map((x,i)=><div className="row" key={x._id||i}>{cols.map(c=><span key={c}>{c.includes('Date')||c==='timestamp'||c==='createdAt'||c==='dueDate'?fmt(x[c]):c==='amount'?`₹${x[c]}`:x[c]}</span>)}</div>)}</div></section>}
createRoot(document.getElementById('root')).render(<App/>);

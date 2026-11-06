const $ = (s) => document.querySelector(s);
let residents = [], visitors = [];
async function api(url, options={}) {
  const res = await fetch(url, { headers: {"Content-Type":"application/json"}, ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}
function show(view) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  $("#"+view).classList.remove("hidden");
  document.querySelectorAll(".nav").forEach(n => n.classList.toggle("active", n.dataset.view===view));
  $("#pageTitle").textContent = view==="visits" ? "Visit Records" : view[0].toUpperCase()+view.slice(1);
  if(view==="dashboard") loadDashboard();
  if(view==="residents") loadResidents();
  if(view==="visitors") loadVisitors();
  if(view==="visits") loadVisits();
}
document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>show(b.dataset.view)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.go)));

async function loadDashboard(){
  try {
    const d=await api("/api/dashboard");
    $("#residentCount").textContent=d.residents; $("#visitorCount").textContent=d.visitors;
    $("#insideCount").textContent=d.inside; $("#todayCount").textContent=d.today;
    const h=await api("/api/health"); $("#connection").textContent="● "+h.message; $("#connection").style.color="#29936d";
  } catch(e) { $("#connection").textContent="Database not connected: "+e.message+" — check your .env file and MySQL Server."; $("#connection").style.color="#c66"; }
}
async function loadResidents(){
  try {
    residents=await api("/api/residents");
    $("#residentRows").innerHTML=residents.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.flat_no)}</td><td>${esc(r.phone)}</td><td>${esc(r.email||"—")}</td><td><button class="small-btn" onclick="editResident(${r.resident_id})">Edit</button> <button class="small-btn danger" onclick="deleteResident(${r.resident_id})">Delete</button></td></tr>`).join("")||emptyRow(5);
    fillSelects();
  } catch(e){alert(e.message);}
}
async function loadVisitors(){
  try {
    visitors=await api("/api/visitors");
    $("#visitorRows").innerHTML=visitors.map(v=>`<tr><td>${esc(v.name)}</td><td>${esc(v.phone)}</td><td>${esc(v.vehicle_no||"—")}</td><td>${esc(v.purpose)}</td><td><button class="small-btn" onclick="editVisitor(${v.visitor_id})">Edit</button> <button class="small-btn danger" onclick="deleteVisitor(${v.visitor_id})">Delete</button></td></tr>`).join("")||emptyRow(5);
    fillSelects();
  } catch(e){alert(e.message);}
}
function fillSelects(){
  if($("#residentSelect")) $("#residentSelect").innerHTML='<option value="">Select resident</option>'+residents.map(r=>`<option value="${r.resident_id}">${esc(r.name)} — ${esc(r.flat_no)}</option>`).join("");
  if($("#visitorSelect")) $("#visitorSelect").innerHTML='<option value="">Select visitor</option>'+visitors.map(v=>`<option value="${v.visitor_id}">${esc(v.name)} — ${esc(v.phone)}</option>`).join("");
}
async function loadVisits(){
  try {
    const rows=await api("/api/visits");
    $("#visitRows").innerHTML=rows.map(v=>`<tr><td>${esc(v.visitor_name)}</td><td>${esc(v.resident_name)} / ${esc(v.flat_no)}</td><td>${fmt(v.entry_time)}</td><td>${v.exit_time?fmt(v.exit_time):"—"}</td><td><span class="badge">${esc(v.status)}</span></td><td>${v.exit_time?"—":`<button class="small-btn" onclick="checkout(${v.visit_id})">Check out</button>`} <button class="small-btn" onclick="editVisit(${v.visit_id}, '${esc(v.status)}')">Edit</button> <button class="small-btn danger" onclick="deleteVisit(${v.visit_id})">Delete</button></td></tr>`).join("")||emptyRow(6);
  } catch(e){alert(e.message);}
}
function emptyRow(n){return `<tr><td colspan="${n}">No records found yet.</td></tr>`}
function esc(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function fmt(x){return x?new Date(x).toLocaleString():"—";}

$("#residentForm").addEventListener("submit",async e=>{
  e.preventDefault();
  try { await api("/api/residents",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))}); e.target.reset(); await loadResidents(); await loadDashboard(); }
  catch(x){alert(x.message);}
});
$("#visitorForm").addEventListener("submit",async e=>{
  e.preventDefault();
  try { await api("/api/visitors",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))}); e.target.reset(); await loadVisitors(); await loadDashboard(); }
  catch(x){alert(x.message);}
});
$("#visitForm").addEventListener("submit",async e=>{
  e.preventDefault();
  try { await api("/api/visits",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))}); e.target.reset(); await loadVisits(); await loadDashboard(); }
  catch(x){alert(x.message);}
});
async function editResident(id){
  const r=residents.find(x=>x.resident_id===id); if(!r)return;
  const name=prompt("Resident name:",r.name); if(name===null)return;
  const flat_no=prompt("Flat number:",r.flat_no); if(flat_no===null)return;
  const phone=prompt("Phone:",r.phone); if(phone===null)return;
  const email=prompt("Email:",r.email||""); if(email===null)return;
  try{await api(`/api/residents/${id}`,{method:"PUT",body:JSON.stringify({name,flat_no,phone,email})});await loadResidents();await loadDashboard();alert("Resident updated.");}catch(e){alert(e.message);}
}
async function deleteResident(id){
  if(!confirm("Delete this resident?"))return;
  try{await api(`/api/residents/${id}`,{method:"DELETE"});await loadResidents();await loadDashboard();}catch(e){alert(e.message);}
}
async function editVisitor(id){
  const v=visitors.find(x=>x.visitor_id===id); if(!v)return;
  const name=prompt("Visitor name:",v.name); if(name===null)return;
  const phone=prompt("Phone:",v.phone); if(phone===null)return;
  const vehicle_no=prompt("Vehicle number:",v.vehicle_no||""); if(vehicle_no===null)return;
  const purpose=prompt("Purpose:",v.purpose); if(purpose===null)return;
  try{await api(`/api/visitors/${id}`,{method:"PUT",body:JSON.stringify({name,phone,vehicle_no,purpose})});await loadVisitors();alert("Visitor updated.");}catch(e){alert(e.message);}
}
async function deleteVisitor(id){
  if(!confirm("Delete this visitor?"))return;
  try{await api(`/api/visitors/${id}`,{method:"DELETE"});await loadVisitors();await loadDashboard();}catch(e){alert(e.message);}
}
async function editVisit(id,currentStatus){
  const status=prompt("Enter status: Pending, Approved, Rejected, Checked In, Checked Out",currentStatus);
  if(status===null)return;
  try{await api(`/api/visits/${id}`,{method:"PUT",body:JSON.stringify({status:status.trim()})});await loadVisits();await loadDashboard();}catch(e){alert(e.message);}
}
async function deleteVisit(id){
  if(!confirm("Delete this visit record?"))return;
  try{await api(`/api/visits/${id}`,{method:"DELETE"});await loadVisits();await loadDashboard();}catch(e){alert(e.message);}
}
async function checkout(id){
  try{await api(`/api/visits/${id}/checkout`,{method:"PUT"});await loadVisits();await loadDashboard();}catch(e){alert(e.message);}
}
Object.assign(window,{editResident,deleteResident,editVisitor,deleteVisitor,editVisit,deleteVisit,checkout});
loadDashboard();

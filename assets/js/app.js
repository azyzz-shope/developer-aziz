(() => {
const $ = id => document.getElementById(id);
let db = null, projectsCache = [], messagesCache = [], currentImageUrl = null;
const say = (id, message, bad = false) => {
  const el = $(id); if (!el) return;
  el.textContent = message; el.classList.toggle("error", !!bad);
};
const ready = () => window.AZ_SUPABASE_URL && !window.AZ_SUPABASE_URL.startsWith("YOUR_") && window.AZ_SUPABASE_ANON_KEY && !window.AZ_SUPABASE_ANON_KEY.startsWith("YOUR_");
const safeExternal = value => { try { const u = new URL(value); return ["https:","http:"].includes(u.protocol) ? u.href : null; } catch { return null; } };
const escapeText = value => String(value ?? "");
function setBusy(button, busy, text) { if (!button) return; button.disabled = busy; if (text) button.textContent = text; }
async function init() {
  $("year").textContent = new Date().getFullYear();
  $("heroYear").textContent = new Date().getFullYear();
  if (!ready() || !window.supabase) { $("connectionNotice").hidden = false; return; }
  db = window.supabase.createClient(window.AZ_SUPABASE_URL, window.AZ_SUPABASE_ANON_KEY, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  await recordPageView();
  await loadPublic();
  const {data:{session}} = await db.auth.getSession();
  if (session) await adminAccess(session.user);
  db.auth.onAuthStateChange((event, session) => {
    if (!session && event === "SIGNED_OUT") hideAdmin();
  });
}
async function loadPublic() {
  const [profileRes, projectsRes] = await Promise.all([
    db.from("profiles").select("*").eq("id",1).maybeSingle(),
    db.from("projects").select("*").order("sort_order",{ascending:true}).order("created_at",{ascending:false})
  ]);
  if (profileRes.error) console.warn("Profile load:", profileRes.error.message);
  if (projectsRes.error) { $("projectGrid").textContent = "Projects are temporarily unavailable."; return; }
  if (profileRes.data) {
    const p = profileRes.data;
    $("displayName").textContent = p.display_name || "Developer Aziz";
    $("aboutText").textContent = p.about || "";
    $("displayLocation").textContent = (p.location || "QATAR").toUpperCase();
    if (p.headline) document.querySelector(".hero h1").setAttribute("aria-label", p.headline);
  }
  renderPublicProjects(projectsRes.data || []);
}
async function recordPageView() {
  try { const {error}=await db.rpc("record_page_view"); if(error) console.warn("Visit counter:",error.message); }
  catch(error) { console.warn("Visit counter unavailable",error); }
}
function renderPublicProjects(items) {
  const root = $("projectGrid"); root.replaceChildren();
  if (!items.length) { const p=document.createElement("p"); p.className="muted"; p.textContent="Projects will appear here soon."; root.append(p); return; }
  items.forEach(p => {
    const card=document.createElement("article"); card.className="project-card";
    if (p.image_path) { const img=document.createElement("img"); img.className="project-cover"; img.src=p.image_path; img.alt=p.title+" cover"; img.loading="lazy"; card.append(img); }
    else { const cover=document.createElement("div"); cover.className="project-cover-placeholder"; cover.textContent="AZ."; card.append(cover); }
    const content=document.createElement("div"); content.className="project-content";
    const cat=document.createElement("div"); cat.className="project-category"; cat.textContent=p.category || "PROJECT";
    if (p.featured) { const badge=document.createElement("span"); badge.className="featured-label"; badge.textContent="FEATURED"; cat.append(badge); }
    const title=document.createElement("h3"); title.textContent=p.title;
    const desc=document.createElement("p"); desc.textContent=p.description;
    const links=document.createElement("div"); links.className="project-links";
    const url=safeExternal(p.url); if(url){const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.textContent="View project ↗";links.append(a);}
    content.append(cat,title,desc); if(links.childNodes.length)content.append(links); card.append(content); root.append(card);
  });
}
$("contactForm").addEventListener("submit", async e => {
  e.preventDefault(); if(!db)return say("contactStatus","Contact form is unavailable right now.",true);
  const form=e.currentTarget, button=form.querySelector("button[type=submit]");
  const row={name:form.elements.namedItem("name").value.trim(),email:form.elements.namedItem("email").value.trim(),message:form.elements.namedItem("message").value.trim()};
  if(row.name.length<2 || row.message.length<10)return say("contactStatus","Please enter your name and a message of at least 10 characters.",true);
  setBusy(button,true,"Sending…");
  const {error}=await db.from("messages").insert(row);
  setBusy(button,false,"Send message ↗");
  if(error){console.error("Contact submission failed:",error);return say("contactStatus","Message could not be sent: "+(error.message||"Please try again later."),true);}
  form.reset(); say("contactStatus","Message sent successfully. Thank you!");
});
function openLogin(){ $("adminModal").hidden=false; $("loginStatus").textContent=""; $("loginEmail").focus(); }
function closeLogin(){ $("adminModal").hidden=true; }
$("openLogin").addEventListener("click",openLogin);
$("closeLogin").addEventListener("click",closeLogin);
$("modalBackdrop").addEventListener("click",closeLogin);
$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault(); if(!db)return say("loginStatus","Supabase is not configured.",true);
  const button=e.currentTarget.querySelector("button[type=submit]"); setBusy(button,true,"Signing in…");
  const {data,error}=await db.auth.signInWithPassword({email:$("loginEmail").value.trim(),password:$("loginPassword").value});
  setBusy(button,false,"Sign in ↗");
  if(error)return say("loginStatus","Sign-in failed. Check your email and password.",true);
  await adminAccess(data.user);
});
async function adminAccess(user) {
  const {data:role,error}=await db.from("user_roles").select("role").eq("user_id",user.id).maybeSingle();
  if(error || role?.role!=="admin"){await db.auth.signOut();$("adminModal").hidden=false;return say("loginStatus","This account does not have administrator access.",true);}
  $("adminModal").hidden=true;$("site").hidden=true;$("adminPanel").hidden=false;
  await loadAdmin();
}
function hideAdmin(){ $("adminPanel").hidden=true; $("site").hidden=false; }
async function loadAdmin(){
  say("adminStatus","Loading dashboard…");
  const [profileRes,projectRes,messageRes,viewsRes]=await Promise.all([
    db.from("profiles").select("*").eq("id",1).maybeSingle(),
    db.from("projects").select("*").order("sort_order",{ascending:true}).order("created_at",{ascending:false}),
    db.from("messages").select("*").order("created_at",{ascending:false}).limit(100),
    db.from("page_views").select("view_date,views").order("view_date",{ascending:false}).limit(7)
  ]);
  const errors=[profileRes.error,projectRes.error,messageRes.error].filter(Boolean);
  if(viewsRes.error) console.warn("Analytics unavailable:",viewsRes.error.message);
  if(errors.length){say("adminStatus","Some dashboard data could not be loaded: "+errors[0].message,true);}
  if(profileRes.data){const p=profileRes.data;$("editName").value=p.display_name||"";$("editHeadline").value=p.headline||"";$("editAbout").value=p.about||"";$("editLocation").value=p.location||"";$("editEmail").value=p.contact_email||"";}
  projectsCache=projectRes.data||[];messagesCache=messageRes.data||[];
  $("statProjects").textContent=projectsCache.length;
  $("statMessages").textContent=messagesCache.length;
  $("statFeatured").textContent=projectsCache.filter(p=>p.featured).length;
  const days=(viewsRes.data||[]).slice().reverse();
  const total=days.reduce((sum,d)=>sum+Number(d.views||0),0);
  $("statVisitsWeek").textContent=total.toLocaleString();
  $("statVisits").textContent=viewsRes.error?"—":(total.toLocaleString()+(days.length===7?" · 7d":""));
  renderVisitChart(days);
  $("messageCount").textContent=messagesCache.length+" MESSAGES";
  renderAdminProjects(projectsCache);renderMessages(messagesCache);
  if(!errors.length)say("adminStatus","Dashboard is up to date.");
}
$("refreshAdmin").addEventListener("click",loadAdmin);
$("profileForm").addEventListener("submit",async e=>{
  e.preventDefault();const button=e.currentTarget.querySelector("button[type=submit]");setBusy(button,true,"Saving…");
  const row={id:1,display_name:$("editName").value.trim(),headline:$("editHeadline").value.trim(),about:$("editAbout").value.trim(),location:$("editLocation").value.trim(),contact_email:$("editEmail").value.trim()||null,updated_at:new Date().toISOString()};
  const {error}=await db.from("profiles").upsert(row);setBusy(button,false,"Save profile changes ↗");
  if(error)return say("adminStatus","Profile save failed: "+error.message,true);
  say("adminStatus","Profile saved successfully.");await loadPublic();
});
function resetProjectForm(){
  $("projectForm").reset();$("editProjectId").value="";$("projectFormTitle").textContent="Add a project";
  $("saveProjectButton").textContent="Publish project ↗";$("cancelEdit").hidden=true;$("imagePreview").hidden=true;
  $("newOrder").value="0";currentImageUrl=null;
}
$("cancelEdit").addEventListener("click",resetProjectForm);
$("newImage").addEventListener("change",()=>{
  const file=$("newImage").files[0];if(!file){$("imagePreview").hidden=true;return;}
  if(!file.type.startsWith("image/")||file.size>5*1024*1024){$("newImage").value="";return say("adminStatus","Choose an image under 5 MB.",true);}
  const preview=$("imagePreview");preview.replaceChildren();const img=document.createElement("img");img.alt="Selected project cover preview";img.src=URL.createObjectURL(file);preview.append(img);preview.hidden=false;
});
$("projectForm").addEventListener("submit",async e=>{
  e.preventDefault();const button=$("saveProjectButton"),id=$("editProjectId").value,file=$("newImage").files[0];setBusy(button,true,id?"Saving…":"Publishing…");
  let imagePath=currentImageUrl;
  if(file){
    if(!file.type.startsWith("image/")||file.size>5*1024*1024){setBusy(button,false,id?"Save project ↗":"Publish project ↗");return say("adminStatus","Image must be a supported image under 5 MB.",true);}
    const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
    const path="projects/"+crypto.randomUUID()+"."+ext;
    const {error:uploadError}=await db.storage.from("project-media").upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type});
    if(uploadError){setBusy(button,false,id?"Save project ↗":"Publish project ↗");return say("adminStatus","Image upload failed: "+uploadError.message,true);}
    imagePath=db.storage.from("project-media").getPublicUrl(path).data.publicUrl;
  }
  const row={title:$("newTitle").value.trim(),description:$("newDescription").value.trim(),category:$("newCategory").value.trim()||"Development",url:$("newUrl").value.trim()||null,image_path:imagePath,featured:$("newFeatured").checked,sort_order:Number($("newOrder").value)||0};
  const result=id?await db.from("projects").update(row).eq("id",id):await db.from("projects").insert(row);
  setBusy(button,false,id?"Save project ↗":"Publish project ↗");
  if(result.error)return say("adminStatus","Project could not be saved: "+result.error.message,true);
  say("adminStatus",id?"Project updated successfully.":"Project published successfully.");resetProjectForm();await loadAdmin();await loadPublic();
});
function editProject(id){
  const p=projectsCache.find(x=>x.id===id);if(!p)return;
  $("editProjectId").value=p.id;$("newTitle").value=p.title||"";$("newDescription").value=p.description||"";
  $("newCategory").value=p.category||"";$("newUrl").value=p.url||"";$("newFeatured").checked=!!p.featured;
  $("newOrder").value=p.sort_order??0;currentImageUrl=p.image_path||null;$("newImage").value="";
  $("projectFormTitle").textContent="Edit project";$("saveProjectButton").textContent="Save project ↗";$("cancelEdit").hidden=false;
  const preview=$("imagePreview");preview.replaceChildren();
  if(currentImageUrl){const img=document.createElement("img");img.src=currentImageUrl;img.alt="Current project cover";preview.append(img);preview.hidden=false;}else preview.hidden=true;
  $("projectFormTitle").scrollIntoView({behavior:"smooth",block:"center"});
}
function renderAdminProjects(items){
  const root=$("adminProjects");root.replaceChildren();
  if(!items.length){const p=document.createElement("p");p.className="muted";p.textContent="No projects yet. Add your first project above.";root.append(p);return;}
  items.forEach(p=>{
    const row=document.createElement("div");row.className="admin-project-row";
    if(p.image_path){const img=document.createElement("img");img.src=p.image_path;img.alt="";row.append(img);}else{const ph=document.createElement("div");ph.className="admin-thumb-placeholder";ph.textContent="AZ";row.append(ph);}
    const info=document.createElement("div");info.className="admin-project-info";const name=document.createElement("b");name.textContent=p.title;const meta=document.createElement("small");meta.textContent=(p.category||"Project")+(p.featured?" · Featured":"")+" · Order "+(p.sort_order??0);info.append(name,meta);row.append(info);
    const actions=document.createElement("div");actions.className="row-actions";
    const edit=document.createElement("button");edit.className="small-action";edit.type="button";edit.textContent="Edit";edit.addEventListener("click",()=>editProject(p.id));
    const del=document.createElement("button");del.className="small-action danger";del.type="button";del.textContent="Delete";del.addEventListener("click",async()=>{if(!confirm("Delete this project?"))return;const {error}=await db.from("projects").delete().eq("id",p.id);if(error)return say("adminStatus","Delete failed: "+error.message,true);say("adminStatus","Project deleted.");await loadAdmin();await loadPublic();});
    actions.append(edit,del);row.append(actions);root.append(row);
  });
}
$("projectSearch").addEventListener("input",e=>{
  const q=e.target.value.trim().toLowerCase();
  renderAdminProjects(projectsCache.filter(p=>(p.title+" "+p.description+" "+p.category).toLowerCase().includes(q)));
});
function renderVisitChart(days){
  const root=$("visitChart"); if(!root)return; root.replaceChildren();
  if(!days.length){const p=document.createElement("p");p.className="muted";p.textContent="No visit data yet. Run the analytics SQL setup to enable counting.";root.append(p);return;}
  const max=Math.max(1,...days.map(d=>Number(d.views||0)));
  days.forEach(d=>{
    const item=document.createElement("div");item.className="visit-day";
    const count=document.createElement("b");count.textContent=Number(d.views||0).toLocaleString();
    const track=document.createElement("div");track.className="visit-track";
    const bar=document.createElement("span");bar.style.width=(Number(d.views||0)/max*100)+"%";track.append(bar);
    const label=document.createElement("small");label.textContent=new Date(d.view_date+"T12:00:00").toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});
    item.append(count,track,label);root.append(item);
  });
}
function renderMessages(items){
  const root=$("adminMessages");root.replaceChildren();
  if(!items.length){const p=document.createElement("p");p.className="muted";p.textContent="Your inbox is empty.";root.append(p);return;}
  items.forEach(m=>{
    const row=document.createElement("article");row.className="admin-message";
    const body=document.createElement("div");body.className="message-body";
    const head=document.createElement("b");head.textContent=m.name+" · "+m.email;
    const text=document.createElement("p");text.textContent=m.message;
    const date=document.createElement("small");date.textContent=new Date(m.created_at).toLocaleString();
    body.append(head,text,date);
    const del=document.createElement("button");del.className="small-action danger";del.type="button";del.textContent="Delete";
    del.addEventListener("click",async()=>{if(!confirm("Delete this message?"))return;const {error}=await db.from("messages").delete().eq("id",m.id);if(error)return say("adminStatus","Message delete failed: "+error.message,true);say("adminStatus","Message deleted.");await loadAdmin();});
    row.append(body,del);root.append(row);
  });
}
$("logoutButton").addEventListener("click",async()=>{await db.auth.signOut();hideAdmin();});
init();
})();
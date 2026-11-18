(() => {
const $=id=>document.getElementById(id);let db=null;
const say=(id,msg,bad=false)=>{const e=$(id);e.textContent=msg;e.style.color=bad?"#ff8997":"#8de0ae"};
const ready=()=>window.AZ_SUPABASE_URL&&!window.AZ_SUPABASE_URL.startsWith("YOUR_")&&window.AZ_SUPABASE_ANON_KEY&&!window.AZ_SUPABASE_ANON_KEY.startsWith("YOUR_");
async function init(){
$("year").textContent=new Date().getFullYear();
if(!ready()||!window.supabase){$("connectionNotice").hidden=false;return}
db=window.supabase.createClient(window.AZ_SUPABASE_URL,window.AZ_SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
await loadPublic();
const {data:{session}}=await db.auth.getSession();if(session)await adminAccess(session.user);
db.auth.onAuthStateChange((_event,session)=>{if(!session)hideAdmin()});
}
async function loadPublic(){
const [{data:p},{data:items}]=await Promise.all([db.from("profiles").select("*").eq("id",1).maybeSingle(),db.from("projects").select("*").order("sort_order").order("created_at",{ascending:false})]);
if(p){$("displayName").textContent=p.display_name;$("aboutText").textContent=p.about}
if(items)renderProjects(items);
}
function renderProjects(items){const root=$("projectGrid");root.replaceChildren();if(!items.length){root.textContent="Projects will appear here soon.";return}
items.forEach(p=>{const card=document.createElement("article");card.className="project";const cat=document.createElement("div");cat.className="category";cat.textContent=p.category||"PROJECT";const h=document.createElement("h3");h.textContent=p.title;const d=document.createElement("p");d.textContent=p.description;card.append(cat,h,d);if(p.url){try{const u=new URL(p.url);if(["https:","http:"].includes(u.protocol)){const a=document.createElement("a");a.href=u.href;a.target="_blank";a.rel="noopener noreferrer";a.textContent="View project ↗";card.append(a)}}catch{}}root.append(card)})}
$("contactForm").addEventListener("submit",async e=>{e.preventDefault();if(!db)return say("contactStatus","Database setup is not complete.",true);const f=e.currentTarget;const row={name:f.elements.namedItem("name").value.trim(),email:f.elements.namedItem("email").value.trim(),message:f.elements.namedItem("message").value.trim()};const {error}=await db.from("messages").insert(row);if(error)return say("contactStatus","Message could not be sent. Try again later.",true);f.reset();say("contactStatus","Message sent successfully.")});
$("openLogin").onclick=()=>$("adminModal").hidden=false;$("closeLogin").onclick=()=>$("adminModal").hidden=true;
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!db)return say("loginStatus","Supabase setup is not complete.",true);const {data,error}=await db.auth.signInWithPassword({email:$("loginEmail").value.trim(),password:$("loginPassword").value});if(error)return say("loginStatus","Sign-in failed. Check your credentials.",true);await adminAccess(data.user)});
async function adminAccess(user){const {data:role,error}=await db.from("user_roles").select("role").eq("user_id",user.id).maybeSingle();if(error||role?.role!=="admin"){await db.auth.signOut();return say("loginStatus","This account is not authorized as an administrator.",true)}$("adminModal").hidden=true;$("site").hidden=true;$("adminPanel").hidden=false;await loadAdmin()}
function hideAdmin(){$("adminPanel").hidden=true;$("site").hidden=false}
async function loadAdmin(){const [{data:p},{data:items},{data:msgs}]=await Promise.all([db.from("profiles").select("*").eq("id",1).maybeSingle(),db.from("projects").select("*").order("created_at",{ascending:false}),db.from("messages").select("*").order("created_at",{ascending:false}).limit(50)]);if(p){$("editName").value=p.display_name||"";$("editHeadline").value=p.headline||"";$("editAbout").value=p.about||"";$("editLocation").value=p.location||"";$("editEmail").value=p.contact_email||""}renderAdmin(items||[]);renderMessages(msgs||[])}
$("profileForm").addEventListener("submit",async e=>{e.preventDefault();const row={id:1,display_name:$("editName").value.trim(),headline:$("editHeadline").value.trim(),about:$("editAbout").value.trim(),location:$("editLocation").value.trim(),contact_email:$("editEmail").value.trim()||null,updated_at:new Date().toISOString()};const {error}=await db.from("profiles").upsert(row);if(error)return say("adminStatus","Profile update failed. Check RLS policies.",true);say("adminStatus","Profile updated.");await loadPublic()});
$("projectForm").addEventListener("submit",async e=>{e.preventDefault();const row={title:$("newTitle").value.trim(),description:$("newDescription").value.trim(),category:$("newCategory").value.trim()||"Development",url:$("newUrl").value.trim()||null};const {error}=await db.from("projects").insert(row);if(error)return say("adminStatus","Could not add project. Check details and permissions.",true);e.currentTarget.reset();say("adminStatus","Project added.");await loadAdmin();await loadPublic()});
function renderAdmin(items){const root=$("adminProjects");root.replaceChildren();items.forEach(p=>{const row=document.createElement("div");row.className="adminitem";const name=document.createElement("span");name.textContent=p.title;const b=document.createElement("button");b.className="delete";b.textContent="Delete";b.onclick=async()=>{if(!confirm("Delete this project?"))return;const {error}=await db.from("projects").delete().eq("id",p.id);if(error)return say("adminStatus","Delete failed.",true);await loadAdmin();await loadPublic()};row.append(name,b);root.append(row)})}
function renderMessages(items){const root=$("adminMessages");root.replaceChildren();items.forEach(m=>{const row=document.createElement("div");row.className="message";const h=document.createElement("b");h.textContent=m.name+" · "+m.email;const p=document.createElement("p");p.textContent=m.message;const small=document.createElement("small");small.textContent=new Date(m.created_at).toLocaleString();row.append(h,p,small);root.append(row)})}
$("logoutButton").onclick=async()=>{await db.auth.signOut();hideAdmin()};
init();
})();
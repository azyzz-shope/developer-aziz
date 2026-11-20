(() => {
const $ = id => document.getElementById(id);
let db = null, projectsCache = [], messagesCache = [], currentImageUrl = null, inboxChannel = null, inboxPoll = null, maintenanceMode = false;
const LAST_READ_KEY = "az_control_messages_last_read";
const translations={
"DEVELOPER ":"المطوّر ",
"About":"نبذة","Skills":"المهارات","Projects":"المشاريع","Contact":"تواصل","Admin ↗":"الإدارة ↗",
"PORTFOLIO":"معرض الأعمال","I'm ":"أنا "," — an aspiring developer exploring programming, web technologies and cybersecurity.":" — مطوّر طموح أتعلم البرمجة وتقنيات الويب والأمن السيبراني.",
"Explore my work ":"استكشف أعمالي ","Let's connect":"تواصل معي","CODE / CREATE / REPEAT":"برمج / ابتكر / كرر",
"BASED IN ":"الموقع: ","AVAILABLE FOR CREATIVE PROJECTS":"متاح للمشاريع الإبداعية",
"01 / ABOUT":"01 / نبذة","Curiosity into ":"من الفضول إلى ","creation.":"الإنجاز.","A curious mind building skills one project at a time. Focused on web development, programming and learning cybersecurity.":"عقل فضولي يطوّر مهاراته مشروعاً بعد مشروع، مع التركيز على تطوير الويب والبرمجة وتعلّم الأمن السيبراني.",
"02 / TOOLKIT":"02 / المهارات","Skills & ":"المهارات و","interests.":"الاهتمامات.","Web Development":"تطوير الويب","HTML, CSS, JavaScript and responsive interfaces.":"HTML وCSS وJavaScript وتصميم واجهات متجاوبة.","Programming":"البرمجة","Python fundamentals, logic and automation.":"أساسيات Python والمنطق والأتمتة.","Cybersecurity":"الأمن السيبراني","Security principles and defensive practices.":"مبادئ الأمن والممارسات الدفاعية.","Tools":"الأدوات","Linux, Git, GitHub and continuous learning.":"Linux وGit وGitHub والتعلّم المستمر.",
"03 / SELECTED WORK":"03 / أعمال مختارة","Things I've ":"أعمال قمت ","built.":"بإنشائها.","A SELECTION OF MY WORK":"مجموعة من أعمالي","Loading projects…":"جارٍ تحميل المشاريع…","Projects will appear here soon.":"ستظهر المشاريع هنا قريباً.","View project ↗":"عرض المشروع ↗","FEATURED":"مميز",
"04 / CONTACT":"04 / التواصل","Have an idea? ":"لديك فكرة؟ ","Let's build it.":"لننفذها معاً.","Have a question, need a website, or want to request a project? Send a message directly to the developer.":"لديك سؤال أو تحتاج موقعاً أو تريد طلب مشروع؟ أرسل رسالتك مباشرة إلى المطوّر.",
"NO ACCOUNT OR SIGN-UP REQUIRED · OPEN TO EVERY VISITOR":"لا حاجة لحساب أو تسجيل · متاح للجميع","Your name":"اسمك","Name":"الاسم","Email address":"البريد الإلكتروني","So the developer can reply to your request.":"حتى يتمكن المطوّر من الرد على طلبك.","Message":"الرسالة","Tell me about your idea…":"أخبرني عن فكرتك…","Send message ":"إرسال الرسالة ","Sending…":"جارٍ الإرسال…","Message sent successfully. Thank you!":"تم إرسال رسالتك بنجاح، شكراً لك!","Contact form is unavailable right now.":"نموذج التواصل غير متاح حالياً.","Please enter your name and a message of at least 10 characters.":"يرجى إدخال اسمك ورسالة لا تقل عن 10 أحرف.",
"DESIGNED WITH INTENTION.":"صُمم بعناية.","BACK TO TOP ↑":"العودة للأعلى ↑","PRIVATE WORKSPACE / SECURE ACCESS":"مساحة خاصة / دخول آمن","Admin sign in":"تسجيل دخول الإدارة","Close":"إغلاق","Email":"البريد الإلكتروني","Admin email":"بريد المدير","Password":"كلمة المرور","Sign in ↗":"تسجيل الدخول ↗","Signing in…":"جارٍ تسجيل الدخول…","Sign out ↗":"تسجيل الخروج ↗",
"ADMIN SESSION":"جلسة المدير","DEVELOPER AZIZ / CONTROL CENTER":"المطوّر عزيز / مركز التحكم","Dashboard":"لوحة التحكم","Manage your portfolio content from one place.":"أدر محتوى معرض أعمالك من مكان واحد.","↻ Refresh data":"↻ تحديث البيانات","PROJECTS":"المشاريع","MESSAGES":"الرسائل","FEATURED":"مميز","PROFILE":"الملف الشخصي","VISITS":"الزيارات","LAST 7 DAYS":"آخر 7 أيام","Published work":"الأعمال المنشورة","Inbox total":"إجمالي الرسائل","Highlighted projects":"المشاريع المميزة","Public portfolio":"المعرض العام","All-time page views":"إجمالي مشاهدات الصفحات","Recent page views":"مشاهدات حديثة",
"01 / PERSONAL BRAND":"01 / الهوية الشخصية","Profile settings":"إعدادات الملف الشخصي","Display name":"الاسم المعروض","Hero headline":"العنوان الرئيسي","About":"نبذة","Location":"الموقع","Contact email":"بريد التواصل","Save profile changes ↗":"حفظ تغييرات الملف ↗","02 / CONTENT":"02 / المحتوى","Add a project":"إضافة مشروع","Edit project":"تعديل المشروع","PORTFOLIO":"معرض الأعمال","Project title":"عنوان المشروع","Project name":"اسم المشروع","Description":"الوصف","What did you build?":"ماذا أنشأت؟","Category":"التصنيف","Development":"تطوير","Project URL":"رابط المشروع","Project cover image":"صورة غلاف المشروع","JPG, PNG, WEBP or GIF · Max 5 MB":"JPG أو PNG أو WEBP أو GIF · الحد الأقصى 5 MB","Featured project":"مشروع مميز","Display order":"ترتيب العرض","Publish project ↗":"نشر المشروع ↗","Save project ↗":"حفظ المشروع ↗","Cancel edit":"إلغاء التعديل","LIVE PERFORMANCE":"الأداء المباشر","Visitor analytics":"تحليلات الزوار","DAILY PAGE VIEWS · LAST 7 DAYS":"مشاهدات يومية · آخر 7 أيام","Analytics will appear after setup.":"ستظهر التحليلات بعد الإعداد.","Privacy-friendly counting: this site stores daily totals only, not visitor names, IP addresses or browsing profiles.":"إحصاءات تحافظ على الخصوصية: نخزّن إجمالي الزيارات اليومي فقط، دون أسماء الزوار أو عناوين IP أو ملفات التصفح.",
"03 / LIBRARY":"03 / المكتبة","Manage projects":"إدارة المشاريع","Search projects…":"ابحث عن المشاريع…","04 / INBOX":"04 / صندوق الوارد","Messages from visitors":"رسائل الزوار","Enable alerts":"تفعيل التنبيهات","Mark read":"تحديد كمقروء","05 / CONTACTS":"05 / جهات الاتصال","Visitor directory":"دليل الزوار","Search name or email…":"ابحث بالاسم أو البريد…","06 / ACTIVITY":"06 / سجل النشاط","Activity log":"سجل النشاط","LATEST ACTIONS":"أحدث العمليات","SECURED WITH SUPABASE AUTH + ROW LEVEL SECURITY":"مؤمّن عبر Supabase وRow Level Security",
"Loading dashboard…":"جارٍ تحميل لوحة التحكم…","Your inbox is empty.":"صندوق الوارد فارغ.","No matching contacts yet.":"لا توجد جهات اتصال مطابقة.","Activity will appear here as you manage requests.":"ستظهر الأنشطة هنا عند إدارة الطلبات.","New":"جديد","In progress":"قيد التنفيذ","Completed":"مكتمل","Delete":"حذف","Reply by email ↗":"الرد عبر البريد ↗","0 CONTACTS":"0 جهة اتصال","0 MESSAGES":"0 رسالة","Alerts enabled":"التنبيهات مفعّلة","Enable alerts":"تفعيل التنبيهات"
};
const reverseTranslations=Object.fromEntries(Object.entries(translations).map(([en,ar])=>[ar,en]));
let currentLanguage=localStorage.getItem("az_language")==="ar"?"ar":"en";
function translatePage(){
 const dict=currentLanguage==="ar"?translations:reverseTranslations;
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 nodes.forEach(node=>{const raw=node.nodeValue,trim=raw.trim();if(dict[trim])node.nodeValue=raw.replace(trim,dict[trim]);});
 document.querySelectorAll("input[placeholder],textarea[placeholder],button[aria-label]").forEach(el=>{
  ["placeholder","aria-label"].forEach(attr=>{const val=el.getAttribute(attr);if(val&&dict[val])el.setAttribute(attr,dict[val]);});
 });
 document.documentElement.lang=currentLanguage==="ar"?"ar":"en";
 document.documentElement.dir=currentLanguage==="ar"?"rtl":"ltr";
 document.body.classList.toggle("arabic-mode",currentLanguage==="ar");
 ["languageToggle","adminLanguageToggle"].forEach(id=>{const b=$(id);if(b)b.textContent=currentLanguage==="ar"?"English":"العربية";});
}
function toggleLanguage(){currentLanguage=currentLanguage==="en"?"ar":"en";localStorage.setItem("az_language",currentLanguage);translatePage();}
$("languageToggle").addEventListener("click",toggleLanguage);
$("adminLanguageToggle").addEventListener("click",toggleLanguage);

let lastReadAt = localStorage.getItem(LAST_READ_KEY) || "";
const say = (id, message, bad = false) => {
  const el = $(id); if (!el) return;
  el.textContent = message; el.classList.toggle("error", !!bad);
};
const ready = () => window.AZ_SUPABASE_URL && !window.AZ_SUPABASE_URL.startsWith("YOUR_") && window.AZ_SUPABASE_ANON_KEY && !window.AZ_SUPABASE_ANON_KEY.startsWith("YOUR_");
const safeExternal = value => { try { const u = new URL(value); return ["https:","http:"].includes(u.protocol) ? u.href : null; } catch { return null; } };
const escapeText = value => String(value ?? "");
function setBusy(button, busy, text) { if (!button) return; button.disabled = busy; if (text) button.textContent = text; }
async function init() {
  translatePage();
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
function applyMaintenance(settings){
  maintenanceMode=!!settings?.maintenance_enabled;
  const gate=$("maintenanceGate"),site=$("site");
  if($("maintenanceMessage"))$("maintenanceMessage").textContent=settings?.maintenance_message||"The website is currently undergoing scheduled maintenance. Please check back soon.";
  const adminOpen=!!$("adminPanel")&&!$("adminPanel").hidden;
  if(gate)gate.hidden=!maintenanceMode||adminOpen;
  if(site)site.hidden=maintenanceMode||adminOpen;
}
async function loadPublic() {
  const [profileRes, projectsRes, blogRes, reviewsRes, academyRes, productsRes, statusRes] = await Promise.all([
    db.from("profiles").select("*").eq("id",1).maybeSingle(),
    db.from("projects").select("*").order("sort_order",{ascending:true}).order("created_at",{ascending:false}),
    db.from("blog_posts").select("*").eq("published",true).order("created_at",{ascending:false}).limit(12),
    db.from("reviews").select("*").eq("approved",true).order("created_at",{ascending:false}).limit(9),
    db.from("academy_lessons").select("*").eq("published",true).order("created_at",{ascending:false}).limit(9),
    db.from("digital_products").select("*").eq("published",true).order("created_at",{ascending:false}).limit(9),
    db.from("system_status").select("*").eq("id",1).maybeSingle()
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
  applyMaintenance(statusRes.data);renderPublicProjects(projectsRes.data || []);renderPublicBlog(blogRes.data||[]);renderReviews(reviewsRes.data||[]);renderCards("academyGrid",academyRes.data||[],"No lessons published yet.");renderCards("storeGrid",productsRes.data||[],"No digital products available yet.");renderSystemStatus(statusRes.data);translatePage();
}
async function recordPageView() {
  try { const {error}=await db.rpc("record_page_view"); if(error) console.warn("Visit counter:",error.message); }
  catch(error) { console.warn("Visit counter unavailable",error); }
}

function renderPublicBlog(items){
 const root=$("publicBlog");if(!root)return;root.replaceChildren();
 if(!items.length){const p=document.createElement("p");p.className="muted";p.textContent="No articles published yet.";root.append(p);return;}
 items.forEach(post=>{const card=document.createElement("article");card.className="blog-card";const date=document.createElement("div");date.className="blog-date";date.textContent=new Date(post.created_at).toLocaleDateString();const title=document.createElement("h3");title.textContent=post.title;const summary=document.createElement("p");summary.textContent=post.summary;const body=document.createElement("details");const summaryEl=document.createElement("summary");summaryEl.textContent="Read article";const content=document.createElement("p");content.textContent=post.body;body.append(summaryEl,content);card.append(date,title,summary,body);root.append(card);});
}
function renderAdminBlog(items){
 const root=$("adminBlogList");if(!root)return;root.replaceChildren();
 items.forEach(post=>{const row=document.createElement("div");row.className="blog-admin-row";const title=document.createElement("span");title.textContent=post.title;const actions=document.createElement("div");actions.className="row-actions";const edit=document.createElement("button");edit.className="small-action";edit.textContent="Edit";edit.addEventListener("click",()=>{$("blogEditId").value=post.id;$("blogTitle").value=post.title;$("blogSummary").value=post.summary;$("blogBody").value=post.body;$("blogTitle").focus();});const del=document.createElement("button");del.className="small-action danger";del.textContent="Delete";del.addEventListener("click",async()=>{if(!confirm("Delete this article?"))return;const {error}=await db.from("blog_posts").delete().eq("id",post.id);if(error)return say("adminStatus",error.message,true);await logActivity("blog_deleted",post.title);await loadAdmin();await loadPublic();});actions.append(edit,del);row.append(title,actions);root.append(row);});
}
$("blogForm").addEventListener("submit",async e=>{
 e.preventDefault();const id=$("blogEditId").value;const row={title:$("blogTitle").value.trim(),summary:$("blogSummary").value.trim(),body:$("blogBody").value.trim(),published:true,updated_at:new Date().toISOString()};
 const {error}=id?await db.from("blog_posts").update(row).eq("id",id):await db.from("blog_posts").insert(row);
 if(error)return say("adminStatus","Blog save failed: "+error.message,true);
 $("blogForm").reset();$("blogEditId").value="";await logActivity(id?"blog_updated":"blog_created",row.title);say("adminStatus","Article published.");await loadAdmin();await loadPublic();
});

function renderCards(id,items,emptyText){const root=$(id);if(!root)return;root.replaceChildren();if(!items.length){const p=document.createElement("p");p.className="muted";p.textContent=emptyText;root.append(p);return;}items.forEach(item=>{const card=document.createElement("article");card.className="blog-card";const title=document.createElement("h3");title.textContent=item.title||item.name||"Untitled";const desc=document.createElement("p");desc.textContent=item.description||item.summary||"";card.append(title,desc);if(item.url){const url=safeExternal(item.url);if(url){const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=item.price_label||"Open ↗";card.append(a);}}root.append(card);});}
function renderReviews(items){const root=$("reviewsGrid");if(!root)return;root.replaceChildren();if(!items.length){const p=document.createElement("p");p.className="muted";p.textContent="No approved reviews yet.";root.append(p);return;}items.forEach(item=>{const card=document.createElement("article");card.className="blog-card";const title=document.createElement("h3");title.textContent=item.name;const rating=document.createElement("div");rating.className="blog-date";rating.textContent="★".repeat(Number(item.rating)||0);const body=document.createElement("p");body.textContent=item.body;card.append(title,rating,body);root.append(card);});}
function renderSystemStatus(item){const root=$("publicSystemStatus");if(!root)return;root.textContent=item?(item.message||"Services operational"):"Status information is not configured yet.";root.dataset.state=item?.state||"unknown";}
$("serviceRequestForm").addEventListener("submit",async e=>{e.preventDefault();if(!db)return say("serviceRequestStatus","Service request is unavailable.",true);const form=e.currentTarget,button=form.querySelector("button[type=submit]"),row={service:form.elements.service.value,details:form.elements.details.value.trim(),name:form.elements.name.value.trim(),email:form.elements.email.value.trim()};if(row.details.length<10)return say("serviceRequestStatus","Please add more project details.",true);setBusy(button,true,"Sending…");const {error}=await db.from("service_requests").insert(row);setBusy(button,false,"Send project request ↗");if(error)return say("serviceRequestStatus","Could not submit request: "+error.message,true);form.reset();say("serviceRequestStatus","Request received. The developer will review it soon.");});
$("reviewForm").addEventListener("submit",async e=>{e.preventDefault();if(!db)return say("reviewStatus","Reviews are unavailable.",true);const form=e.currentTarget,button=form.querySelector("button[type=submit]"),row={name:form.elements.name.value.trim(),rating:Number(form.elements.rating.value),body:form.elements.body.value.trim()};setBusy(button,true,"Submitting…");const {error}=await db.from("reviews").insert(row);setBusy(button,false,"Submit review ↗");if(error)return say("reviewStatus","Could not submit review: "+error.message,true);form.reset();say("reviewStatus","Thank you. Your review will appear after moderation.");});

function runTerminal(command){
 const output=$("terminalOutput");const c=command.trim().toLowerCase();const responses={help:"Available commands: help, about, skills, projects, contact, clear",about:"Developer Aziz — portfolio focused on web development, programming and defensive cybersecurity.",skills:"Web development • Python fundamentals • Cybersecurity principles • Linux • Git/GitHub",projects:"Scroll to the Projects section to explore published work.",contact:"Use the public contact form. No account is required.",clear:""};
 if(c==="clear"){output.textContent="AZ TERMINAL CLEARED.";return;}
 output.textContent+="\n> "+command+"\n"+(responses[c]||"Command not found. Type help to list safe commands.");
 output.scrollTop=output.scrollHeight;
}
$("terminalForm").addEventListener("submit",e=>{e.preventDefault();const input=$("terminalInput");if(input.value.trim())runTerminal(input.value);input.value="";});

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
if($("maintenanceAdminLogin"))$("maintenanceAdminLogin").addEventListener("click",openLogin);
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
  if(error || !["owner","admin","staff"].includes(role?.role)){await db.auth.signOut();$("adminModal").hidden=false;return say("loginStatus","This account does not have administrator access.",true);}
  $("adminModal").hidden=true;$("site").hidden=true;$("maintenanceGate").hidden=true;$("adminPanel").hidden=false;
  if($("teamManager"))$("teamManager").hidden=role.role!=="owner";
  await loadAdmin();
  if(role.role==="owner")await loadTeam();
  startInboxUpdates();
}
function hideAdmin(){ $("adminPanel").hidden=true; $("site").hidden=!maintenanceMode; $("maintenanceGate").hidden=!maintenanceMode; stopInboxUpdates(); }

async function loadTeam(){
 const root=$("teamMembers");if(!root)return;
 root.replaceChildren();
 const {data,error}=await db.rpc("owner_list_team");
 if(error){root.textContent="Team list unavailable: "+error.message;return;}
 (data||[]).forEach(member=>{
  const row=document.createElement("div");row.className="team-member-row";
  const info=document.createElement("div");const email=document.createElement("b");email.textContent=member.email||member.user_id;
  const role=document.createElement("small");role.textContent=member.role==="owner"?"OWNER":"TEAM MEMBER";info.append(email,role);
  const actions=document.createElement("div");actions.className="team-member-actions";
  const edit=document.createElement("button");edit.className="small-action";edit.type="button";edit.textContent="Edit access";
  edit.addEventListener("click",async()=>{
   const current=member.permissions||[];
   const chosen=prompt("Enter permissions separated by commas:\n"+["profile","projects","messages","requests","blog","reviews","academy","store","maintenance","analytics","clients","bugs"].join(", ")+"\n\nCurrent: "+current.join(", "));
   if(chosen===null)return;
   const list=chosen.split(",").map(x=>x.trim()).filter(x=>["profile","projects","messages","requests","blog","reviews","academy","store","maintenance","analytics","clients","bugs"].includes(x));
   const {error}=await db.rpc("owner_set_team_permissions",{p_user_id:member.user_id,p_permissions:list});
   if(error)return say("teamInviteStatus","Could not update permissions: "+error.message,true);
   say("teamInviteStatus","Permissions updated.");await loadTeam();
  });
  const remove=document.createElement("button");remove.className="small-action danger";remove.type="button";remove.textContent="Remove access";
  remove.disabled=member.role==="owner";
  remove.addEventListener("click",async()=>{
   if(!confirm("Remove this member's dashboard access?"))return;
   const {error}=await db.rpc("owner_remove_team_member",{p_user_id:member.user_id});
   if(error)return say("teamInviteStatus","Could not remove access: "+error.message,true);
   await loadTeam();
  });
  actions.append(edit,remove);row.append(info,actions);root.append(row);
 });
 if(!(data||[]).length)root.textContent="No team members yet.";
}
$("teamInviteForm")?.addEventListener("submit",async e=>{
 e.preventDefault();const button=e.currentTarget.querySelector("button[type=submit]");
 const email=$("teamEmail").value.trim().toLowerCase();
 const selected=[...document.querySelectorAll('input[name="teamPermission"]:checked')].map(x=>x.value);
 if(!selected.length)return say("teamInviteStatus","Choose at least one permission.",true);
 setBusy(button,true,"Sending invitation…");
 const {data,error}=await db.functions.invoke("invite-admin",{body:{email,permissions:selected}});
 setBusy(button,false,"Send invitation ↗");
 if(error)return say("teamInviteStatus","Invitation failed: "+error.message,true);
 $("teamEmail").value="";document.querySelectorAll('input[name="teamPermission"]').forEach(x=>x.checked=false);
 say("teamInviteStatus","Invitation sent. The teammate can accept it by email.");
 await loadTeam();
});
$("refreshTeam")?.addEventListener("click",loadTeam);

async function loadAdmin(){
  say("adminStatus","Loading dashboard…");
  const [profileRes,projectRes,messageRes,viewsRes,activityRes,blogRes,maintenanceRes]=await Promise.all([
    db.from("profiles").select("*").eq("id",1).maybeSingle(),
    db.from("projects").select("*").order("sort_order",{ascending:true}).order("created_at",{ascending:false}),
    db.from("messages").select("*").order("created_at",{ascending:false}).limit(100),
    db.from("page_views").select("view_date,views").order("view_date",{ascending:false}).limit(7),
    db.from("activity_logs").select("*").order("created_at",{ascending:false}).limit(30),
    db.from("blog_posts").select("*").order("created_at",{ascending:false}).limit(50),
    db.from("system_status").select("*").eq("id",1).maybeSingle()
  ]);
  const errors=[profileRes.error,projectRes.error,messageRes.error].filter(Boolean);
  if(viewsRes.error) console.warn("Analytics unavailable:",viewsRes.error.message);
  if(errors.length){say("adminStatus","Some dashboard data could not be loaded: "+errors[0].message,true);}
  if(maintenanceRes.data){applyMaintenance(maintenanceRes.data);$("maintenanceEnabled").checked=!!maintenanceRes.data.maintenance_enabled;$("maintenanceText").value=maintenanceRes.data.maintenance_message||"";}
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
  renderAdminProjects(projectsCache);renderMessages(messagesCache);renderContacts(messagesCache);renderActivity(activityRes.data||[]);renderAdminBlog(blogRes.data||[]);translatePage();
  if(activityRes.error)console.warn("Activity log unavailable:",activityRes.error.message);
  if(!errors.length)say("adminStatus","Dashboard is up to date.");
}
$("saveMaintenance").addEventListener("click",async()=>{
  const button=$("saveMaintenance");setBusy(button,true,"Saving…");
  const enabled=$("maintenanceEnabled").checked;
  const message=$("maintenanceText").value.trim()||"The website is currently undergoing scheduled maintenance. Please check back soon.";
  const {error}=await db.from("system_status").update({maintenance_enabled:enabled,maintenance_message:message,updated_at:new Date().toISOString()}).eq("id",1);
  setBusy(button,false,"Save maintenance settings ↗");
  if(error){$("maintenanceAdminStatus").textContent="Could not save settings: "+error.message;return;}
  applyMaintenance({maintenance_enabled:enabled,maintenance_message:message});
  await logActivity("maintenance_mode",enabled?"Enabled maintenance mode":"Disabled maintenance mode");
  $("maintenanceAdminStatus").textContent=enabled?"Maintenance mode is ON. Visitors will see the maintenance page.":"Maintenance mode is OFF. The public website is visible.";
  say("adminStatus","Maintenance settings saved.");
});
$("refreshAdmin").addEventListener("click",loadAdmin);
$("profileForm").addEventListener("submit",async e=>{
  e.preventDefault();const button=e.currentTarget.querySelector("button[type=submit]");setBusy(button,true,"Saving…");
  const row={id:1,display_name:$("editName").value.trim(),headline:$("editHeadline").value.trim(),about:$("editAbout").value.trim(),location:$("editLocation").value.trim(),contact_email:$("editEmail").value.trim()||null,updated_at:new Date().toISOString()};
  const {error}=await db.from("profiles").upsert(row);setBusy(button,false,"Save profile changes ↗");
  if(error)return say("adminStatus","Profile save failed: "+error.message,true);
  say("adminStatus","Profile saved successfully.");await logActivity("profile_updated","Updated portfolio profile settings.");await refreshActivity();await loadPublic();
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
  say("adminStatus",id?"Project updated successfully.":"Project published successfully.");await logActivity(id?"project_updated":"project_created",row.title);await refreshActivity();resetProjectForm();await loadAdmin();await loadPublic();
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
    const del=document.createElement("button");del.className="small-action danger";del.type="button";del.textContent="Delete";del.addEventListener("click",async()=>{if(!confirm("Delete this project?"))return;const {error}=await db.from("projects").delete().eq("id",p.id);if(error)return say("adminStatus","Delete failed: "+error.message,true);say("adminStatus","Project deleted.");await logActivity("project_deleted",p.title);await refreshActivity();await loadAdmin();await loadPublic();});
    actions.append(edit,del);row.append(actions);root.append(row);
  });
}
$("contactSearch").addEventListener("input",()=>renderContacts(messagesCache));
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
async function logActivity(action,details){
  if(!db)return;
  const {data:{user}}=await db.auth.getUser();
  if(!user)return;
  const {error}=await db.from("activity_logs").insert({actor_id:user.id,action,details});
  if(error)console.warn("Activity log:",error.message);
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
    const tools=document.createElement("div");tools.className="message-tools";
    const status=document.createElement("select");status.className="request-status";status.setAttribute("aria-label","Request status");
    [["new","New"],["in_progress","In progress"],["completed","Completed"]].forEach(([value,label])=>{const option=document.createElement("option");option.value=value;option.textContent=label;status.append(option);});
    status.value=m.status||"new";
    status.addEventListener("change",async()=>{
      const next=status.value;status.disabled=true;
      const {error}=await db.from("messages").update({status:next}).eq("id",m.id);
      status.disabled=false;
      if(error){status.value=m.status||"new";return say("adminStatus","Could not update request: "+error.message,true);}
      m.status=next;await logActivity("request_status",m.name+" — "+next.replace("_"," "));
      say("adminStatus","Request status updated.");await refreshActivity();
    });
    const del=document.createElement("button");del.className="small-action danger";del.type="button";del.textContent="Delete";
    del.addEventListener("click",async()=>{if(!confirm("Delete this message?"))return;const {error}=await db.from("messages").delete().eq("id",m.id);if(error)return say("adminStatus","Message delete failed: "+error.message,true);await logActivity("message_deleted",m.name+" · "+m.email);say("adminStatus","Message deleted.");await loadAdmin();});
    tools.append(status,del);row.append(body,tools);root.append(row);
  });
}
function renderContacts(items){
  const root=$("adminContacts");if(!root)return;root.replaceChildren();
  const q=($("contactSearch")?.value||"").trim().toLowerCase();
  const map=new Map();
  items.forEach(m=>{const key=(m.email||"").toLowerCase();if(key&&!map.has(key))map.set(key,m);});
  const contacts=[...map.values()].filter(m=>(m.name+" "+m.email).toLowerCase().includes(q));
  $("contactCount").textContent=map.size+" CONTACTS";
  if(!contacts.length){const p=document.createElement("p");p.className="muted";p.textContent="No matching contacts yet.";root.append(p);return;}
  contacts.forEach(m=>{
    const row=document.createElement("div");row.className="contact-row";
    const name=document.createElement("b");name.textContent=m.name;
    const email=document.createElement("small");email.textContent=m.email;
    const link=document.createElement("a");link.href="mailto:"+encodeURIComponent(m.email);link.textContent="Reply by email ↗";
    row.append(name,email,link);root.append(row);
  });
}
function renderActivity(items){
  const root=$("activityLog");if(!root)return;root.replaceChildren();
  if(!items.length){const p=document.createElement("p");p.className="muted";p.textContent="Activity will appear here as you manage requests.";root.append(p);return;}
  items.forEach(item=>{
    const row=document.createElement("div");row.className="activity-row";
    const title=document.createElement("b");title.textContent=item.action.replaceAll("_"," ").toUpperCase();
    const detail=document.createElement("p");detail.textContent=item.details||"";
    const date=document.createElement("small");date.textContent=new Date(item.created_at).toLocaleString();
    row.append(title,detail,date);root.append(row);
  });
}
async function refreshActivity(){
  const {data,error}=await db.from("activity_logs").select("*").order("created_at",{ascending:false}).limit(30);
  if(!error)renderActivity(data||[]);
}

function updateUnreadCount(){
  const unread=messagesCache.filter(m=>!lastReadAt || new Date(m.created_at).getTime()>new Date(lastReadAt).getTime()).length;
  const badge=$("unreadCount");if(!badge)return;
  badge.textContent=unread+" NEW";badge.hidden=unread===0;
  $("statMessages").textContent=messagesCache.length;
}
$("markMessagesRead").addEventListener("click",()=>{
  lastReadAt=new Date().toISOString();localStorage.setItem(LAST_READ_KEY,lastReadAt);updateUnreadCount();
  say("adminStatus","Inbox marked as read.");
});
$("enableNotifications").addEventListener("click",async()=>{
  if(!("Notification" in window))return say("adminStatus","Browser notifications are not supported here.",true);
  const permission=await Notification.requestPermission();
  if(permission==="granted"){say("adminStatus","Browser notifications enabled.");$("enableNotifications").textContent="Alerts enabled";}
  else say("adminStatus","Notifications are blocked. You can enable them in browser site settings.",true);
});
function notifyNewMessage(message){
  say("adminStatus","New message received from "+message.name+".");
  if("Notification" in window && Notification.permission==="granted" && document.hidden){
    new Notification("Developer Aziz — New message",{body:"From "+message.name+": "+message.message.slice(0,110)});
  }
}
function startInboxUpdates(){
  stopInboxUpdates();
  inboxChannel=db.channel("az-control-inbox").on("postgres_changes",{event:"INSERT",schema:"public",table:"messages"},payload=>{
    const m=payload.new;if(!m)return;
    if(!messagesCache.some(x=>x.id===m.id)){messagesCache.unshift(m);renderMessages(messagesCache);renderContacts(messagesCache);$("messageCount").textContent=messagesCache.length+" MESSAGES";$("statMessages").textContent=messagesCache.length;updateUnreadCount();notifyNewMessage(m);}
  }).subscribe();
  inboxPoll=window.setInterval(async()=>{
    if($("adminPanel").hidden)return;
    const {data,error}=await db.from("messages").select("*").order("created_at",{ascending:false}).limit(100);
    if(error)return;
    const known=new Set(messagesCache.map(m=>m.id));
    const fresh=(data||[]).filter(m=>!known.has(m.id));
    if(fresh.length){messagesCache=data||[];renderMessages(messagesCache);renderContacts(messagesCache);$("messageCount").textContent=messagesCache.length+" MESSAGES";$("statMessages").textContent=messagesCache.length;updateUnreadCount();fresh.forEach(notifyNewMessage);}
  },30000);
}
function stopInboxUpdates(){
  if(inboxPoll){clearInterval(inboxPoll);inboxPoll=null;}
  if(inboxChannel&&db){db.removeChannel(inboxChannel);inboxChannel=null;}
}

$("logoutButton").addEventListener("click",async()=>{await db.auth.signOut();hideAdmin();});
init();
})();
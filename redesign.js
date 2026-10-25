/* Maazi redesign layer: hero photo, category tiles, hearts + Wishlist, bottom nav. index.html ki script ke baad load karein. */
(()=>{
const $=id=>document.getElementById(id);
const E=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
let CI={};
/* hero (text code mein, photos aapke live products se) */
const hero=document.querySelector(".hero");
hero.innerHTML='<div class="hx"><small>WINTER COLLECTION</small><h1>Premium</h1><p>Sweatshirts &amp; Shirts</p><span class="hbtn">Shop Now →</span></div><div class="hph" id="hph"></div>';
hero.onclick=()=>$("shopTop").scrollIntoView({behavior:"smooth"});
let hdone=false;
function heroPics(){if(hdone||typeof P=="undefined"||!P.length)return;const a=P.filter(p=>p.imgs.length).slice(0,2);if(!a.length)return;hdone=true;$("hph").innerHTML=a.map((p,i)=>`<img class="hp${i}" src="${E(p.imgs[0])}" alt="${E(p.name)}">`).join("")}
/* wishlist storage */
let W=new Set();try{W=new Set(JSON.parse(localStorage.getItem("maazi_wish")||"[]").map(String))}catch{}
const saveW=()=>{try{localStorage.setItem("maazi_wish",JSON.stringify([...W]))}catch{}};
const heart=id=>W.has(String(id))?"♥️":"♡";
function hearts(){heroPics();document.querySelectorAll("#grid .card").forEach(c=>{const s=c.querySelector("[data-sl]");if(!s||c.querySelector(".sz3"))return;const p=P.find(x=>String(x.id)==s.dataset.sl);const d=c.querySelector(".sizes");if(!p||!d)return;const z=[...new Set(p.v.map(v=>v.size).filter(Boolean))];d.className="sizes sz3";d.innerHTML=z.map(k=>`<i class="${p.v.some(v=>v.size==k&&v.stock>0)?"":"off"}">${E(k)}</i>`).join("")});document.querySelectorAll("#grid .slider[data-sl]").forEach(s=>{if(s.querySelector(".wh"))return;const id=s.dataset.sl,b=document.createElement("button");b.type="button";b.className="wh"+(W.has(id)?" on":"");b.dataset.w=id;b.setAttribute("aria-label","Add to wishlist");b.textContent=heart(id);s.appendChild(b)})}
new MutationObserver(hearts).observe($("grid"),{childList:true});hearts();
/* wishlist overlay */
const ov=document.createElement("div");ov.className="ov";ov.id="wov";ov.innerHTML='<div class="panel" id="wp"></div>';document.body.appendChild(ov);
function drawW(){const items=[...W].map(id=>P.find(p=>String(p.id)==id)).filter(Boolean);
 $("wp").innerHTML='<button class="x" aria-label="Close">×</button><h2 style="margin-bottom:12px">Wishlist</h2>'+(items.length?items.map(p=>`<div class="wr" data-wo="${E(p.id)}"><div class="th">${art(p,0)}</div><div style="flex:1"><div>${E(p.name)}</div><small>${E(p.cat)}</small><div class="price">${rs(p.price)}</div></div><button class="wh on" type="button" data-w="${E(p.id)}" aria-label="Remove">♥️</button></div>`).join(""):'<p class="note">Wishlist khali hai. Kisi product ke heart par tap karein.</p>')+'<img class="wbn" src="assets/wishlist-banner.jpg" alt="Maazi Clothing">'}
function setNav(k){nav.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x.dataset.n==k))}
const openW=()=>{drawW();ov.classList.add("show");setNav("wish")},closeW=()=>{ov.classList.remove("show");setNav("home")};
document.addEventListener("click",e=>{
 const h=e.target.closest("[data-w]");
 if(h){const id=h.dataset.w;W.has(id)?W.delete(id):W.add(id);saveW();document.querySelectorAll('.wh[data-w="'+id+'"]').forEach(b=>{b.classList.toggle("on",W.has(id));b.textContent=heart(id)});if(ov.classList.contains("show"))drawW();return}
 if(e.target==ov||e.target.closest("#wp .x")){closeW();return}
 const cn=e.target.closest(".card .pn,.card .price,.card .sizes");if(cn){const s=cn.closest(".card").querySelector("[data-sl]");if(s)open(s.dataset.sl);return}
 const r=e.target.closest("[data-wo]");if(r){const id=r.dataset.wo;closeW();open(id)}});
document.addEventListener("keydown",e=>{if(e.key=="Escape"&&ov.classList.contains("show"))closeW()});
/* bottom nav */
const ic={home:'<path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',cat:'<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',cart:'<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M9 8V6a3 3 0 016 0v2"/>',wish:'<path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z"/>'};
const nav=document.createElement("nav");nav.id="bnav";
nav.innerHTML=[["home","Home"],["cat","Category"],["cart","Cart"],["wish","Wishlist"]].map(([k,t])=>`<button type="button" data-n="${k}" class="${k=="home"?"on":""}"><svg viewBox="0 0 24 24">${ic[k]}</svg>${t}${k=="cart"?'<em id="bcc">0</em>':""}</button>`).join("");
document.body.appendChild(nav);
nav.onclick=e=>{const b=e.target.closest("[data-n]");if(!b)return;const k=b.dataset.n;
 document.querySelectorAll("#wov,#gov").forEach(o=>o.classList.remove("show"));
 if(k=="home"){scrollTo({top:0,behavior:"smooth"});setNav("home")}
 if(k=="cat")openC();
 if(k=="cart")$("cartBtn").click();
 if(k=="wish")openW()};
const sync=()=>{const n=$("cc").textContent,e=$("bcc");e.textContent=n;e.style.display=n=="0"?"none":"grid"};
new MutationObserver(sync).observe($("cc"),{childList:true,characterData:true,subtree:true});sync();
/* category tiles */
const topCats=()=>cats().filter(c=>c!="All Products"&&c!="Sale").sort((a,b)=>/sweat/i.test(b)-/sweat/i.test(a)).slice(0,2);
const qt=document.createElement("div");qt.className="qt";hero.after(qt);
const IC={shirt:'<path d="M8 4l-5 3 2 4 2-1v10h10V10l2 1 2-4-5-3c-.5 1.5-2 2.5-4 2.5S8.5 5.5 8 4z"/>',sweat:'<path d="M8 4l-5 3 1 6 3-.5V20h10v-7.5l3 .5 1-6-5-3c-.5 1.5-2 2.5-4 2.5S8.5 5.5 8 4z"/>',star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',bag:'<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 016 0v2"/>'};
const icFor=n=>/sweat|hood|wool/i.test(n)?"sweat":/shirt/i.test(n)?"shirt":/sale/i.test(n)?"tag":/new/i.test(n)?"star":"bag";
function tiles(){if(typeof P=="undefined"||!P.length){qt.style.display="none";return}
 const cs=topCats();
 const T=[...cs.map(c=>[c,c]),["New Arrivals","All Products","n"],cats().includes("Sale")?["Sale","Sale"]:["All Products","All Products"]];
 qt.innerHTML=T.map(([n,c,s])=>`<button type="button" data-tc="${E(c)}" data-ts="${s||""}">${CI[n]?`<img class="qi" src="${E(CI[n])}" alt="">`:`<svg viewBox="0 0 24 24">${IC[icFor(n)]}</svg>`}${E(n)}</button>`).join("");qt.style.display=""}
qt.onclick=e=>{const t=e.target.closest("[data-tc]");if(!t)return;pick(t.dataset.tc);if(t.dataset.ts){$("sort").value=t.dataset.ts;$("sort").dispatchEvent(new Event("change"))}$("shopTop").scrollIntoView({behavior:"smooth"})};
new MutationObserver(tiles).observe($("cats"),{childList:true});tiles();
/* Category pictures (admin ke Category Pictures page se set hoti hain) */
(async()=>{try{if(typeof DB=="undefined"||!DB)return;const r=await DB.from("settings").select("key,value").like("key","cat_img:%");(r.data||[]).forEach(x=>{const u=String(x.value||"");if(/^(data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+|https?:\/\/[^\s"'()]+)$/.test(u))CI[x.key.slice(8)]=u});if(typeof st!="undefined"){tiles();window.list()}}catch(e){}})();
/* Categories page */
const gv=document.createElement("div");gv.className="ov";gv.id="gov";gv.innerHTML='<div class="panel" id="gp"></div>';document.body.appendChild(gv);
const pick=n=>{const b=[...document.querySelectorAll("#cats .cat")].find(x=>x.firstChild.textContent==n);if(b)b.click()};
function openC(){const cs=topCats();
 const card=c=>{const p=P.find(x=>inCat(x,c));return `<div class="cc" data-gp="${E(c)}"><div class="im">${CI[c]?`<img src="${E(CI[c])}" alt="">`:(p?art(p,0):"")}</div><div class="in"><b>${E(c)}</b><small>${P.filter(x=>inCat(x,c)).length} products</small><div style="margin-top:8px">View All →</div></div></div>`};
 const ex=(i,t,s,c,srt)=>`<button type="button" class="ex" data-gp="${E(c)}" data-gs="${srt||""}"><span style="font-size:26px">${i}</span><span style="flex:1"><b style="display:block">${t}</b><small style="color:var(--mut)">${s}</small></span>›</button>`;
 $("gp").innerHTML='<div class="pdh"><button class="x2" data-gc aria-label="Back">←</button><b>Categories</b><span style="width:40px"></span></div><div class="cb"><h3>Premium<br>Winter Collection</h3><p style="color:var(--mut);font-size:12px;margin-top:6px">Stay Warm, Stay Stylish</p></div><div class="cg">'+cs.map(card).join("")+'</div><h3 style="margin:20px 0 10px;font-size:18px">Explore More</h3>'+ex("✨","New Arrivals","Latest styles, just in","All Products","n")+ex("🔥","Best Sellers","Most loved by our customers","All Products")+ex("🏷","Sale","Premium quality, better prices",cats().includes("Sale")?"Sale":"All Products");
 gv.classList.add("show");setNav("cat")}
const closeG=()=>{gv.classList.remove("show");setNav("home")};
document.addEventListener("click",e=>{
 if(e.target==gv||e.target.closest("[data-gc]")){closeG();return}
 const t=e.target.closest("[data-gp]");if(t&&gv.contains(t)){const s=t.dataset.gs;gv.classList.remove("show");setNav("home");pick(t.dataset.gp);if(s){$("sort").value=s;$("sort").dispatchEvent(new Event("change"))}$("shopTop").scrollIntoView({behavior:"smooth"})}});
/* Search */
let q="";const L0=window.list;
function bn(){let b=$("cbn");if(!b){b=document.createElement("div");b.id="cbn";b.className="cb";$("grid").before(b)}if(st.cat=="All Products"){b.style.display="none";return}b.style.display="";b.style.background=CI[st.cat]?`linear-gradient(90deg,#0c0b0a 35%,rgba(12,11,10,.15)),url("${CI[st.cat]}") center/cover`:"";b.innerHTML=`<h3>${E(st.cat)}</h3><p style="color:var(--mut);font-size:12px;margin-top:6px">Soft. Warm. Everyday.</p>`}
window.list=function(){L0();if(st.cat=="All Products")$("title").textContent="Top Picks";bn();if(q){let n=0;document.querySelectorAll("#grid .card").forEach(c=>{const ok=c.querySelector(".pn").textContent.toLowerCase().includes(q);c.style.display=ok?"":"none";if(ok)n++});$("count").textContent=n+" products"}};
const sq=document.createElement("input");sq.id="sq";sq.type="text";sq.placeholder="Search products";sq.setAttribute("aria-label","Search products");$("fbtn").before(sq);
sq.oninput=()=>{q=sq.value.trim().toLowerCase();window.list()};
/* Product page */
window.open=function(id){const p=P.find(x=>String(x.id)==String(id));if(!p)return;let sel=null,i=0;const n=Math.max(1,p.imgs.length);
 const cols=[...new Set(p.v.map(v=>v.color).filter(Boolean))];
 const draw=()=>{const sv=sel&&p.v.find(v=>String(v.id)==String(sel));
  $("pp").innerHTML=`<div class="pdh"><button class="x2" data-pc aria-label="Back">←</button><div><button class="x2" data-sh aria-label="Share">⤴️</button><button class="x2 wh" data-w="${E(p.id)}" aria-label="Wishlist">${heart(p.id)}</button></div></div>
  <div class="slider pbig"><div class="slides" style="transform:translateX(-${i*100}%)">${Array.from({length:n},(_,k)=>`<div class="slide">${art(p,k)}</div>`).join("")}</div></div>
  ${n>1?`<div class="pth">${Array.from({length:Math.min(n,5)},(_,k)=>`<button type="button" data-t="${k}" class="${k==i?"on":""}">${art(p,k)}</button>`).join("")}</div>`:'<div style="height:14px"></div>'}
  <h2>${E(p.name)}</h2><div class="price" style="font-size:20px;margin:4px 0">${rs(p.price)}${p.old>p.price?`<s>${rs(p.old)}</s>`:""}</div>
  <p style="margin:10px 0;color:var(--mut);line-height:1.6;white-space:pre-line">${E(p.desc)}</p>
  <div class="spec2">${p.cat?`<span>Category</span><b>${E(p.cat)}</b>`:""}${cols.length?`<span>Color</span><b>${E(cols.join(", "))}</b>`:""}</div>
  <b>Select Size</b><div class="sz2">${p.v.length?p.v.map(v=>`<button type="button" class="chip ${String(sel)==String(v.id)?"on":""}" data-z="${E(v.id)}" ${v.stock?"":"disabled"}>${E(vlabel(v))}</button>`).join(""):'<small style="color:var(--mut)">Currently unavailable</small>'}</div>${sv?`<small style="color:var(--mut)">${sv.stock} left</small>`:""}
  <div class="pbar"><button class="primary" id="add">Add to Cart</button><button type="button" class="wh" data-w="${E(p.id)}" aria-label="Wishlist">${heart(p.id)}</button></div>`};
 $("pp").onclick=e=>{const b=e.target.closest("button");if(!b)return;
  if(b.hasAttribute("data-pc"))$("pov").classList.remove("show");
  else if(b.hasAttribute("data-sh")){const d={title:p.name,url:location.href};navigator.share?navigator.share(d).catch(()=>{}):navigator.clipboard&&navigator.clipboard.writeText(d.url).then(()=>toast("Link copied"))}
  else if(b.dataset.t!==undefined){i=+b.dataset.t;draw()}
  else if(b.dataset.z!==undefined){sel=b.dataset.z;draw()}
  else if(b.id=="add"){const sv=sel&&p.v.find(v=>String(v.id)==String(sel));if(!sv)return toast("Select a size first");addCart(sv);$("pov").classList.remove("show")}};
 draw();$("pov").classList.add("show")};
})();

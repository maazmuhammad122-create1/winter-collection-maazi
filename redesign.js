/* Maazi redesign layer: hero photo, category tiles, hearts + Wishlist, bottom nav. index.html ki script ke baad load karein. */
(()=>{
const $=id=>document.getElementById(id);
const E=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
/* hero photo (poora banner clickable) */
const hero=document.querySelector(".hero");
hero.innerHTML='<img src="assets/hero-photo.jpg" alt="Winter Collection: Premium Sweatshirts and Shirts">';
hero.onclick=()=>$("shopTop").scrollIntoView({behavior:"smooth"});
/* wishlist storage */
let W=new Set();try{W=new Set(JSON.parse(localStorage.getItem("maazi_wish")||"[]").map(String))}catch{}
const saveW=()=>{try{localStorage.setItem("maazi_wish",JSON.stringify([...W]))}catch{}};
const heart=id=>W.has(String(id))?"♥":"♡";
function hearts(){document.querySelectorAll("#grid .slider[data-sl]").forEach(s=>{if(s.querySelector(".wh"))return;const id=s.dataset.sl,b=document.createElement("button");b.type="button";b.className="wh"+(W.has(id)?" on":"");b.dataset.w=id;b.setAttribute("aria-label","Add to wishlist");b.textContent=heart(id);s.appendChild(b)})}
new MutationObserver(hearts).observe($("grid"),{childList:true});hearts();
/* wishlist overlay */
const ov=document.createElement("div");ov.className="ov";ov.id="wov";ov.innerHTML='<div class="panel" id="wp"></div>';document.body.appendChild(ov);
function drawW(){const items=[...W].map(id=>P.find(p=>String(p.id)==id)).filter(Boolean);
 $("wp").innerHTML='<button class="x" aria-label="Close">×</button><h2 style="margin-bottom:12px">Wishlist</h2>'+(items.length?items.map(p=>`<div class="wr" data-wo="${E(p.id)}"><div class="th">${art(p,0)}</div><div style="flex:1"><div>${E(p.name)}</div><small>${E(p.cat)}</small><div class="price">${rs(p.price)}</div></div><button class="wh on" type="button" data-w="${E(p.id)}" aria-label="Remove">♥</button></div>`).join(""):'<p class="note">Wishlist khali hai. Kisi product ke heart par tap karein.</p>')+'<img class="wbn" src="assets/wishlist-banner.jpg" alt="Maazi Clothing">'}
function setNav(k){nav.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x.dataset.n==k))}
const openW=()=>{drawW();ov.classList.add("show");setNav("wish")},closeW=()=>{ov.classList.remove("show");setNav("home")};
document.addEventListener("click",e=>{
 const h=e.target.closest("[data-w]");
 if(h){const id=h.dataset.w;W.has(id)?W.delete(id):W.add(id);saveW();document.querySelectorAll('.wh[data-w="'+id+'"]').forEach(b=>{b.classList.toggle("on",W.has(id));b.textContent=heart(id)});if(ov.classList.contains("show"))drawW();return}
 if(e.target==ov||e.target.closest("#wp .x")){closeW();return}
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
/* category tiles (database ki categories se khud bante hain) */
const qt=document.createElement("div");qt.className="qt";hero.after(qt);
const em=n=>/sweat|hood/i.test(n)?"🧥":/shirt/i.test(n)?"👔":/sale/i.test(n)?"🏷":/new/i.test(n)?"✨":"🛍";
function tiles(){const bs=[...document.querySelectorAll("#cats .cat")].slice(0,4);
 qt.innerHTML=bs.map((b,i)=>{const n=b.firstChild.textContent;return `<button type="button" data-i="${i}"><span>${em(n)}</span>${E(n)}</button>`}).join("");qt.style.display=bs.length?"":"none"}
qt.onclick=e=>{const t=e.target.closest("[data-i]");if(!t)return;const b=document.querySelectorAll("#cats .cat")[+t.dataset.i];if(b){b.click();$("shopTop").scrollIntoView({behavior:"smooth"})}};
new MutationObserver(tiles).observe($("cats"),{childList:true});tiles();
/* Categories page */
const gv=document.createElement("div");gv.className="ov";gv.id="gov";gv.innerHTML='<div class="panel" id="gp"></div>';document.body.appendChild(gv);
const pick=n=>{const b=[...document.querySelectorAll("#cats .cat")].find(x=>x.firstChild.textContent==n);if(b)b.click()};
function openC(){const cs=cats().filter(c=>c!="All Products"&&c!="Sale").slice(0,2);
 const card=c=>{const p=P.find(x=>inCat(x,c));return `<div class="cc" data-gp="${E(c)}"><div class="im">${p?art(p,0):""}</div><div class="in"><b>${E(c)}</b><small>${P.filter(x=>inCat(x,c)).length} products</small><div style="margin-top:8px">View All →</div></div></div>`};
 const ex=(i,t,s,c,srt)=>`<button type="button" class="ex" data-gp="${E(c)}" data-gs="${srt||""}"><span style="font-size:26px">${i}</span><span style="flex:1"><b style="display:block">${t}</b><small style="color:var(--mut)">${s}</small></span>›</button>`;
 $("gp").innerHTML='<div class="pdh"><button class="x2" data-gc aria-label="Back">←</button><b>Categories</b><span style="width:40px"></span></div><div class="cb"><h3>Premium<br>Winter Collection</h3><p style="color:var(--mut);font-size:12px;margin-top:6px">Stay Warm, Stay Stylish</p></div><div class="cg">'+cs.map(card).join("")+'</div><h3 style="margin:20px 0 10px;font-size:18px">Explore More</h3>'+ex("✨","New Arrivals","Latest styles, just in","All Products","n")+ex("🔥","Best Sellers","Most loved by our customers","All Products")+ex("🏷","Sale","Premium quality, better prices",cats().includes("Sale")?"Sale":"All Products");
 gv.classList.add("show");setNav("cat")}
const closeG=()=>{gv.classList.remove("show");setNav("home")};
document.addEventListener("click",e=>{
 if(e.target==gv||e.target.closest("[data-gc]")){closeG();return}
 const t=e.target.closest("[data-gp]");if(t&&gv.contains(t)){const s=t.dataset.gs;gv.classList.remove("show");setNav("home");pick(t.dataset.gp);if(s){$("sort").value=s;$("sort").dispatchEvent(new Event("change"))}$("shopTop").scrollIntoView({behavior:"smooth"})}});
/* Search */
let q="";const L0=window.list;
window.list=function(){L0();if(q){let n=0;document.querySelectorAll("#grid .card").forEach(c=>{const ok=c.querySelector(".pn").textContent.toLowerCase().includes(q);c.style.display=ok?"":"none";if(ok)n++});$("count").textContent=n+" products"}};
const sq=document.createElement("input");sq.id="sq";sq.type="text";sq.placeholder="Search products";sq.setAttribute("aria-label","Search products");$("fbtn").before(sq);
sq.oninput=()=>{q=sq.value.trim().toLowerCase();window.list()};
/* Product page */
window.open=function(id){const p=P.find(x=>String(x.id)==String(id));if(!p)return;let sel=null,i=0;const n=Math.max(1,p.imgs.length);
 const cols=[...new Set(p.v.map(v=>v.color).filter(Boolean))];
 const draw=()=>{const sv=sel&&p.v.find(v=>String(v.id)==String(sel));
  $("pp").innerHTML=`<div class="pdh"><button class="x2" data-pc aria-label="Back">←</button><div><button class="x2" data-sh aria-label="Share">⤴</button><button class="x2 wh" data-w="${E(p.id)}" aria-label="Wishlist">${heart(p.id)}</button></div></div>
  <div class="slider pbig"><div class="slides" style="transform:translateX(-${i*100}%)">${Array.from({length:n},(_,k)=>`<div class="slide">${art(p,k)}</div>`).join("")}</div></div>
  ${n>1?`<div class="pth">${Array.from({length:Math.min(n,5)},(_,k)=>`<button type="button" data-t="${k}" class="${k==i?"on":""}">${art(p,k)}</button>`).join("")}</div>`:'<div style="height:14px"></div>'}
  <h2>${E(p.name)}</h2><div class="price" style="font-size:20px;margin:4px 0">${rs(p.price)}${p.old>p.price?`<s>${rs(p.old)}</s>`:""}</div>
  <p style="margin:10px 0;color:var(--mut);line-height:1.6;white-space:pre-line">${E(p.desc)}</p>
  <div class="spec2">${p.cat?`<span>Category</span><b>${E(p.cat)}</b>`:""}${cols.length?`<span>Color</span><b>${E(cols.join(", "))}</b>`:""}</div>
  <b>Select Size</b><div class="sz2">${p.v.length?p.v.map(v=>`<button type="button" class="chip ${String(sel)==String(v.id)?"on":""}" data-z="${E(v.id)}" ${v.stock?"":"disabled"}>${E(vlabel(v))}</button>`).join(""):'<small style="color:var(--mut)">Currently unavailable</small>'}</div>${sv?`<small style="color:var(--mut)">${sv.stock} left</small>`:""}
  <button class="primary" id="add">Add to Cart</button>`};
 $("pp").onclick=e=>{const b=e.target.closest("button");if(!b)return;
  if(b.hasAttribute("data-pc"))$("pov").classList.remove("show");
  else if(b.hasAttribute("data-sh")){const d={title:p.name,url:location.href};navigator.share?navigator.share(d).catch(()=>{}):navigator.clipboard&&navigator.clipboard.writeText(d.url).then(()=>toast("Link copied"))}
  else if(b.dataset.t!==undefined){i=+b.dataset.t;draw()}
  else if(b.dataset.z!==undefined){sel=b.dataset.z;draw()}
  else if(b.id=="add"){const sv=sel&&p.v.find(v=>String(v.id)==String(sel));if(!sv)return toast("Select a size first");addCart(sv);$("pov").classList.remove("show")}};
 draw();$("pov").classList.add("show")};
})();

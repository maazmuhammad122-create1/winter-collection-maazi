/* Maazi sections layer (ek hi file):
   1) header menu links + ORDER NOW, stats, Why Us, Sale, Reviews, Updates, footer columns
   2) checkout: naye Order & Payment Instructions
   index.html mein redesign.js ke BAAD: <script src="sections.js"></script> */
(()=>{
"use strict";
const $=id=>document.getElementById(id),E=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const css=`html{scroll-behavior:smooth;scroll-padding-top:84px}
.qt button{background:#fff;color:#3a3a40;font-size:12px;font-weight:500;border-color:#e0d4a6;box-shadow:0 2px 10px -6px rgba(143,106,26,.35)}
aside h3{font-size:26px;font-weight:700}#title{font-weight:700}
.tn{display:none;gap:24px;align-items:center;font-size:14px}.tn a{color:#c9bfa2}.tn a:hover{color:#e6c458}
.tno{display:none;padding:9px 18px;border-radius:6px;font-size:12px;font-weight:700;letter-spacing:1px;background:var(--btnbg);color:#15110a}
@media(min-width:801px){.tn{display:flex}.tno{display:inline-block}}
.stt{display:flex;justify-content:center;gap:clamp(20px,6vw,56px);flex-wrap:wrap;padding:26px 18px 0}
.stt div{text-align:center}.stt b{display:block;font:700 28px "Cormorant Garamond",Georgia,serif;color:var(--brown)}.stt span{font-size:11px;letter-spacing:.15em;color:var(--mut)}
.sx{max-width:1100px;margin:0 auto;padding:54px 18px}
.sh{text-align:center;margin-bottom:26px}.sh small{color:var(--brown);letter-spacing:.3em;font-size:11px;font-weight:600}.sh h2{font-size:clamp(30px,5vw,42px);margin-top:4px}
.wy,.rv{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
.wy div,.rv div{background:#fff;border:1px solid var(--line);border-radius:14px;padding:22px 18px;text-align:center}
.wy i{font-style:normal;font-size:30px;display:block;margin-bottom:6px}.wy h3{font:600 21px "Cormorant Garamond",Georgia,serif;margin-bottom:4px}.wy p,.rv p{color:var(--mut);font-size:14px}
.rv div{text-align:left}.rv .rs{color:#b8941f;font-size:14px;margin-bottom:6px}.rv p{margin:6px 0 10px;line-height:1.6}
.sb{background:linear-gradient(120deg,#fbf3d6,#fff);border:1px solid #d4af37;border-radius:16px;padding:44px 22px;text-align:center}
.sb h2{font-size:clamp(28px,5vw,40px)}.sb p{color:var(--mut);margin:8px 0 20px}
.sb a,.ub a{display:inline-block;background:var(--btnbg);color:#15110a;font-weight:700;border-radius:8px;padding:13px 28px;font-size:14px;letter-spacing:.04em}
.ub{text-align:center}.ub p{color:var(--mut);margin:6px 0 18px}
.fc{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:24px;max-width:1000px;margin:0 auto 28px;text-align:left}
.fc h4{color:var(--ink);margin-bottom:8px;font-size:14px}.fc a{display:block;padding:3px 0;font-size:13px}.fc a:hover{color:var(--brown)}
.ins{background:#fffaf0;border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:10px 0;font-size:14px;line-height:1.7}.ins h4{font:600 19px "Cormorant Garamond",Georgia,serif;color:var(--brown);margin-bottom:6px}.ins ol{padding-left:20px;margin-bottom:10px}.ins p{margin:0}.ins .ty{margin-top:10px;color:var(--brown);font-weight:600}`;
const sty=document.createElement("style");sty.textContent=css;document.head.appendChild(sty);

/* ---------- checkout instructions ---------- */
const cp=$("cp");
if(cp){
 const INS=()=>`<div class="ins"><h4>Maazi Clothing — Order &amp; Payment Instructions</h4><ol><li>Apna active WhatsApp number aur complete delivery address enter karein.</li><li>Order place karne ke baad WhatsApp automatically open hoga.</li><li>Advance payment ka screenshot aur Transaction ID WhatsApp par send karein.</li><li>Payment verify hone ke baad aapka order confirm kiya jayega.</li></ol><p><b>Payment Method:</b> Easypaisa<br><b>Advance Payment:</b> ${Math.round(ADV_PCT*100)}%<br><b>Delivery Charges:</b> Rs. ${DEL}<br><b>Remaining Amount:</b> Delivery par ada karein.</p><p class="ty">Thank you for shopping with Maazi Clothing!</p></div>`;
 const fixCheckout=()=>{
  const n=[...cp.querySelectorAll("p.note")].find(p=>/Advance Easypaisa par bhejne/.test(p.textContent));
  if(!n)return;
  n.outerHTML=INS();
  const pay=cp.querySelector(".pay");if(pay){const ps=pay.querySelectorAll("p");if(ps.length>2)ps[2].remove()}};
 new MutationObserver(fixCheckout).observe(cp,{childList:true});
}

/* ---------- page sections ---------- */
const hdr=document.querySelector("header"),brand=document.querySelector(".brand"),qt=document.querySelector(".qt"),foot=document.querySelector("footer"),hero=document.querySelector(".hero");
if(!hdr||!brand||!foot||!$("cats"))return;
if(qt)qt.id="collections";foot.id="contact";

const tn=document.createElement("nav");tn.className="tn";tn.setAttribute("aria-label","Main menu");
tn.innerHTML='<a href="#collections">Collections</a><a href="#shopTop">Shop</a><a href="#why">Why Us</a><a href="#reviews">Reviews</a><a href="#contact">Contact</a>';
brand.after(tn);
const tno=document.createElement("a");tno.className="tno";tno.href="#shopTop";tno.textContent="ORDER NOW";
$("waBtn").before(tno);

const stt=document.createElement("div");stt.className="stt";stt.id="stt";(qt||hero).after(stt);

const w=document.createElement("div");
w.innerHTML=`<section class="sx" id="why"><div class="sh"><small>WHY MAAZI</small><h2>Made for You</h2></div><div class="wy">
<div><i>❄️</i><h3>Winter Essentials</h3><p>Warm, comfortable pieces for the cold season.</p></div>
<div><i>🚚</i><h3>Delivery in Pakistan</h3><p>Track your order anytime with your order number.</p></div>
<div><i>💳</i><h3>Easy Payment</h3><p>Pay a 50% advance on Easypaisa, the rest on delivery.</p></div>
<div><i>💬</i><h3>WhatsApp Support</h3><p>Message us about any order, anytime.</p></div></div></section>
<section class="sx" id="sale" hidden><div class="sb"><small style="letter-spacing:.3em;color:#8f6a1a;font-weight:600;font-size:11px">LIMITED OFFER</small><h2></h2><p>Grab your favourites before the cold season ends.</p><a href="#shopTop">ORDER NOW</a></div></section>
<section class="sx" id="reviews" hidden><div class="sh"><small>TESTIMONIALS</small><h2>Loved by Customers</h2></div><div class="rv" id="rv"></div></section>
<section class="sx ub" id="upd"><div class="sh"><small>STAY IN THE LOOP</small><h2>New Collection Updates</h2></div><p>Message us on WhatsApp to hear about new arrivals and sales.</p><a target="_blank" rel="noopener noreferrer" href="https://wa.me/923189250877?text=${encodeURIComponent("Hello Maazi, please send me updates about new collections and sales.")}">GET UPDATES ON WHATSAPP</a></section>`;
foot.before(...w.children);

const fc=document.createElement("div");fc.className="fc";fc.id="fc";foot.prepend(fc);
const ig=(foot.querySelector('a[href*="instagram"]')||{}).href||"https://www.instagram.com/winter_collection_27";

let rdone=false;
async function reviews(){
 if(rdone||typeof DB=="undefined"||!DB)return;rdone=true;
 try{const r=await DB.from("reviews").select("*").limit(12);if(r.error||!r.data)return;
  const bad=x=>x.is_approved===false||x.approved===false||x.is_hidden===true||x.hidden===true||["hidden","pending"].includes(String(x.status||"").toLowerCase());
  const a=r.data.filter(x=>!bad(x)).map(x=>({n:x.customer_name||x.name||x.reviewer_name||"Customer",s:Math.max(0,Math.min(5,Math.round(Number(x.rating)||0))),t:String(x.comment||x.review||x.text||x.message||"").trim()})).filter(x=>x.t&&x.s>0).slice(0,6);
  if(!a.length)return;
  $("rv").innerHTML=a.map(x=>`<div><div class="rs">${"★".repeat(x.s)}${"☆".repeat(5-x.s)}</div><p>${E(x.t)}</p><b>${E(x.n)}</b></div>`).join("");
  $("reviews").hidden=false}catch(e){}}

function refresh(){
 if(typeof P=="undefined"||!P.length)return;
 const cs=cats().filter(c=>c!="All Products"&&c!="Sale");
 $("stt").innerHTML=`<div><b>${P.length}</b><span>STYLES</span></div><div><b>${Math.max(1,cs.length)}</b><span>COLLECTIONS</span></div><div><b>${Math.round(ADV_PCT*100)}%</b><span>ADVANCE ONLY</span></div><div><b>${rs(DEL)}</b><span>DELIVERY</span></div>`;
 const sp=P.filter(p=>p.old>p.price),sale=$("sale");
 if(sp.length){const m=Math.round(Math.max(...sp.map(p=>(p.old-p.price)/p.old*100)));sale.querySelector("h2").textContent="Winter Sale — up to "+m+"% off";sale.hidden=false}else sale.hidden=true;
 $("fc").innerHTML=`<div><h4>MAAZI CLOTHING</h4><a href="#top" style="color:var(--mut)">Perfect your style, every season.</a></div><div><h4>Shop</h4>${cs.slice(0,4).map(c=>`<a href="#shopTop" data-fc="${E(c)}">${E(c)}</a>`).join("")||'<a href="#shopTop">All Products</a>'}</div><div><h4>Help</h4><a href="#why">Delivery &amp; payment</a><a href="#" data-tr>Track your order</a><a href="#reviews">Reviews</a></div><div><h4>Connect</h4><a target="_blank" rel="noopener noreferrer" href="https://wa.me/923189250877">WhatsApp</a><a target="_blank" rel="noopener noreferrer" href="${E(ig)}">Instagram</a></div>`;
 reviews()}

document.addEventListener("click",e=>{
 const a=e.target.closest("[data-fc]");
 if(a){e.preventDefault();const b=[...document.querySelectorAll("#cats .cat")].find(x=>x.firstChild&&x.firstChild.textContent==a.dataset.fc);if(b)b.click();$("shopTop").scrollIntoView({behavior:"smooth"})}
 else if(e.target.closest("[data-tr]")){e.preventDefault();$("trackBtn").click()}});

new MutationObserver(refresh).observe($("cats"),{childList:true});refresh();
})();

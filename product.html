/* MAAZI - product detail upgrade (gallery + thumbnails, size, qty, trust, description, reviews, related, sticky bar).
   Add this line in index.html, LAST before </body>:  <script src="pdp.js"></script>
   Cart, checkout, stock and Supabase code stay exactly as they are. */
(function(){
const css=`
#pov{padding:0}
.panel.pdp{padding:0;max-width:1000px;height:100%;max-height:100%;border-radius:0}
@media(min-width:801px){#pov{padding:14px}.panel.pdp{height:auto;max-height:94vh;border-radius:16px}}
.pdp .ptop{position:sticky;top:0;z-index:6;display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg);border-bottom:1px solid var(--line)}
.pdp .bk{background:none;border:0;font-size:24px;color:var(--gold);width:38px;height:38px}
.pdp .ptop span{font-family:"Cormorant Garamond",Georgia,serif;font-size:21px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pdp .pin{display:grid;gap:20px;padding:16px}
@media(min-width:801px){.pdp .pin{grid-template-columns:1.05fr 1fr;align-items:start;padding:22px}.pdp .info{position:sticky;top:70px}}
.pdp .slider{aspect-ratio:1/1.1;border:1px solid var(--line)}
.pdp .pth{display:flex;gap:8px;overflow-x:auto;padding:10px 0 0;scrollbar-width:none}
.pdp .pth button{flex:0 0 62px;height:62px;border:1px solid var(--line);border-radius:6px;overflow:hidden;padding:0;background:var(--card)}
.pdp .pth button.on{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold)}
.pdp .pth img{width:100%;height:100%;object-fit:cover;display:block}
.pdp h2{font-size:32px;line-height:1.1}
.pdp .rt{display:flex;gap:8px;align-items:center;color:var(--mut);font-size:14px;margin-top:6px}
.pdp .stars{color:var(--gold);letter-spacing:2px}
.pdp .pr{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:12px 0 4px}
.pdp .pr b{font-size:28px;color:var(--gold);font-weight:600}
.pdp .pr s{color:var(--mut)}
.pdp .save{background:#2a2312;color:#f0d77a;font-size:12px;padding:3px 9px;border-radius:4px;border:1px solid var(--line)}
.pdp .lb{margin:16px 0 8px;font-size:14px;color:var(--mut)}.pdp .lb b{color:var(--ink);font-weight:500}
.pdp .szs{display:flex;gap:8px;flex-wrap:wrap}
.pdp .szs .chip{min-width:74px;padding:9px 14px;font-size:14px}
.pdp .szs .chip:disabled{text-decoration:line-through}
.pdp .left{font-size:13px;color:var(--gold);min-height:20px;margin-top:8px}
.pdp .row{display:flex;gap:10px;margin-top:14px}
.pdp .qty{display:flex;align-items:center;border:1px solid var(--line);border-radius:10px;background:var(--card)}
.pdp .qty button{width:38px;height:44px;background:none;border:0;font-size:18px}
.pdp .qty span{width:30px;text-align:center}
.pdp .gold{flex:1;background:var(--btnbg);color:var(--btnfg);border:0;border-radius:10px;padding:13px;font-weight:600}
.pdp .line2{width:100%;margin-top:10px;background:none;border:1.5px solid var(--gold);color:var(--gold);border-radius:10px;padding:13px;font-weight:600;display:block;text-align:center;text-decoration:none}
.pdp .trust{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:20px 0;padding:16px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.pdp .trust div{font-size:13px;color:var(--mut)}.pdp .trust b{display:block;color:var(--ink);font-weight:500;font-size:14px}
.pdp details{border-bottom:1px solid var(--line);padding:14px 0}
.pdp summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;font-weight:500;letter-spacing:.05em}
.pdp summary::-webkit-details-marker{display:none}
.pdp summary::after{content:"+";color:var(--gold);font-size:20px;line-height:1}
.pdp details[open] summary::after{content:"\\2212"}
.pdp details p{margin-top:12px;color:#cfc6b0;font-size:15px;line-height:1.65;white-space:pre-line}
.pdp .rev{border-top:1px dashed var(--line);padding-top:10px;margin-top:12px;font-size:14px;color:#cfc6b0}
.pdp .rev small{color:var(--mut)}
.pdp .rl{padding:0 16px 20px}
.pdp .rl h3{font-family:"Cormorant Garamond",Georgia,serif;font-size:28px;text-align:center;margin:10px 0 14px}
.pdp .rel{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px}
.pdp .rc{flex:0 0 44%;max-width:220px;scroll-snap-align:start;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;padding:0;text-align:left}
.pdp .rc .im{aspect-ratio:3/4}.pdp .rc .im img{width:100%;height:100%;object-fit:cover;display:block}
.pdp .rc .t{padding:9px 10px;font-size:14px}.pdp .rc .t b{display:block;color:var(--gold);font-weight:500}.pdp .rc .t s{color:var(--mut);font-size:12px;margin-left:5px}
.pdp .pbar{position:sticky;bottom:0;z-index:6;display:flex;align-items:center;gap:10px;padding:9px 14px calc(9px + env(safe-area-inset-bottom,0px));background:#0e0c08;border-top:1px solid var(--line)}
.pdp .pbar .th2{width:42px;height:42px;border-radius:6px;overflow:hidden;flex:none;background:var(--card)}.pdp .pbar .th2 img{width:100%;height:100%;object-fit:cover}
.pdp .pbar div.n{flex:1;min-width:0;font-size:13px}.pdp .pbar div.n span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pdp .pbar div.n b{color:var(--gold)}
.pdp .pbar .gold{flex:0 0 auto;padding:11px 18px}`;
const st0=document.createElement("style");st0.textContent=css;document.head.appendChild(st0);

const okRev=x=>x.approved!==false&&x.is_approved!==false&&x.is_visible!==false&&x.hidden!==true&&!["hidden","pending","rejected"].includes(String(x.status||"").toLowerCase());
async function loadRv(pid){try{const r=await DB.from("reviews").select("*").eq("product_id",pid);return r.error?[]:(r.data||[]).filter(okRev)}catch(e){return[]}}

function addQ(v,qn){
  const l=st.cart.find(x=>String(x.vid)==String(v.id)),q=(l?l.q:0)+qn;
  if(q>v.stock){toast("Only "+v.stock+" available");return false}
  l?l.q=q:st.cart.push({vid:v.id,q:qn});saveCart();drawCart();return true;
}

function render(p,S){
  const n=Math.max(1,p.imgs.length),sv=S.sel&&p.v.find(v=>String(v.id)==String(S.sel));
  const off=p.old>p.price?Math.round(100-p.price/p.old*100):0;
  const rv=S.rv||[],avg=rv.length?rv.reduce((a,r)=>a+(+r.rating||0),0)/rv.length:0,ra=Math.round(avg);
  const rel=P.filter(x=>String(x.id)!=String(p.id));
  const avail=p.v.some(v=>v.stock>0);
  return `<div class="ptop"><button class="bk" aria-label="Back">\u2190</button><span>${esc(p.name)}</span></div>
  <div class="pin">
   <section>
    <div class="slider">${off?`<span class="badge">-${off}%</span>`:""}
      <div class="slides" style="transform:translateX(-${S.i*100}%)">${Array.from({length:n},(_,k)=>`<div class="slide">${art(p,k)}</div>`).join("")}</div>
      ${n>1?`<button class="arr l" id="pl" aria-label="Previous photo">\u2039</button><button class="arr r" id="pr" aria-label="Next photo">\u203A</button><div class="dots">${Array.from({length:n},(_,k)=>`<i class="${k==S.i?"on":""}"></i>`).join("")}</div>`:""}
    </div>
    ${n>1?`<div class="pth">${p.imgs.map((u,k)=>`<button data-t="${k}" class="${k==S.i?"on":""}" aria-label="Photo ${k+1}"><img src="${esc(u)}" alt="" loading="lazy"></button>`).join("")}</div>`:""}
   </section>
   <section class="info">
    <h2>${esc(p.name)}</h2>
    <div class="rt">${rv.length?`<span class="stars">${"\u2605".repeat(ra)}${"\u2606".repeat(5-ra)}</span><span>${avg.toFixed(1)} (${rv.length} reviews)</span>`:`<span>${esc(p.cat)}</span>`}</div>
    <div class="pr"><b>${rs(p.price)}</b>${p.old>p.price?`<s>${rs(p.old)}</s><span class="save">Save ${rs(p.old-p.price)}</span>`:""}</div>
    <div class="lb">Size: <b>${sv?esc(vlabel(sv)):"Select"}</b></div>
    <div class="szs">${p.v.length?p.v.map(v=>`<button class="chip ${String(S.sel)==String(v.id)?"on":""}" data-z="${esc(v.id)}" ${v.stock?"":"disabled"}>${esc(vlabel(v))}</button>`).join(""):`<small style="color:var(--mut)">Currently unavailable</small>`}</div>
    <div class="left">${sv?(sv.stock<=3?"Only "+sv.stock+" left in "+esc(vlabel(sv)):"In stock"):""}</div>
    <div class="row"><div class="qty"><button id="qm" aria-label="Less">\u2212</button><span id="qv">${S.q}</span><button id="qp" aria-label="More">+</button></div><button class="gold js-add" ${avail?"":"disabled"}>Add to cart</button></div>
    <button class="line2 js-buy" ${avail?"":"disabled"}>Buy now</button>
    <a class="line2" target="_blank" rel="noopener noreferrer" href="${wa("Hello Maazi, I want to ask about: "+p.name)}">Ask on WhatsApp</a>
    <div class="trust">
      <div><b>Easypaisa advance</b>50% now, rest on delivery</div>
      <div><b>Delivery across Pakistan</b>Delivery PKR ${DEL} paid on delivery</div>
      <div><b>Quality checked</b>Every piece inspected</div>
      <div><b>Order help</b>WhatsApp support</div>
    </div>
    <details open><summary>DESCRIPTION</summary><p>${esc(p.desc||"Premium quality from Winter Collection by Maazi.")}</p></details>
    <details class="rvd" ${S.ro?"open":""}><summary>REVIEWS</summary>${S.rv===null?`<p>Loading...</p>`:rv.length?rv.map(r=>`<div class="rev"><span class="stars">${"\u2605".repeat(Math.max(0,Math.min(5,+r.rating||0)))}</span> <small>${esc(r.customer_name||r.name||"Customer")}</small><br>${esc(r.comment||r.review||r.text||"")}</div>`).join(""):`<p>No reviews yet.</p>`}</details>
   </section>
  </div>
  ${rel.length?`<div class="rl"><h3>Related Products</h3><div class="rel">${rel.map(x=>`<button class="rc" data-r="${esc(x.id)}"><div class="im">${art(x,0)}</div><div class="t">${esc(x.name)}<b>${rs(x.price)}${x.old>x.price?`<s>${rs(x.old)}</s>`:""}</b></div></button>`).join("")}</div></div>`:""}
  <div class="pbar"><div class="th2">${art(p,0)}</div><div class="n"><span>${esc(p.name)}</span><b>${rs(p.price)}</b></div><button class="gold js-add" ${avail?"":"disabled"}>Add to cart</button></div>`;
}

function openP(id){
  const p=P.find(x=>String(x.id)==String(id));if(!p)return;
  const S={sel:null,i:0,q:1,rv:null,ro:false},root=$("pp"),n=Math.max(1,p.imgs.length);
  root.classList.add("pdp");root.dataset.pid=p.id;
  const draw=()=>{const sc=root.scrollTop;root.innerHTML=render(p,S);root.scrollTop=sc;bind()};
  const need=()=>{const v=S.sel&&p.v.find(v=>String(v.id)==String(S.sel));
    if(!v){toast("Select a size first");const z=root.querySelector(".szs");z&&z.scrollIntoView({behavior:"smooth",block:"center"})}return v};
  const bind=()=>{
    root.querySelector(".bk").onclick=()=>$("pov").classList.remove("show");
    const go=k=>{S.i=(k+n)%n;root.querySelector(".slides").style.transform="translateX(-"+S.i*100+"%)";
      root.querySelectorAll(".dots i").forEach((d,j)=>d.classList.toggle("on",j==S.i));
      root.querySelectorAll(".pth button").forEach((b,j)=>b.classList.toggle("on",j==S.i))};
    if($("pl")){$("pl").onclick=()=>go(S.i-1);$("pr").onclick=()=>go(S.i+1)}
    root.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>go(+b.dataset.t));
    let x0=null;const sl=root.querySelector(".slider");
    sl.ontouchstart=e=>{x0=e.touches[0].clientX};
    sl.ontouchend=e=>{if(x0==null||n<2)return;const d=e.changedTouches[0].clientX-x0;if(Math.abs(d)>40)go(S.i+(d<0?1:-1));x0=null};
    root.querySelectorAll("[data-z]").forEach(b=>b.onclick=()=>{S.sel=b.dataset.z;S.q=1;draw()});
    $("qm").onclick=()=>{if(S.q>1){S.q--;$("qv").textContent=S.q}};
    $("qp").onclick=()=>{const v=S.sel&&p.v.find(v=>String(v.id)==String(S.sel)),max=v?v.stock:99;
      if(S.q<max){S.q++;$("qv").textContent=S.q}else toast(v?"Only "+max+" available":"Select a size first")};
    root.querySelectorAll(".js-add").forEach(b=>b.onclick=()=>{const v=need();if(v&&addQ(v,S.q)){$("pov").classList.remove("show");showCart(true)}});
    root.querySelectorAll(".js-buy").forEach(b=>b.onclick=()=>{const v=need();if(v&&addQ(v,S.q)){$("pov").classList.remove("show");checkout()}});
    const rd=root.querySelector(".rvd");rd.ontoggle=()=>{S.ro=rd.open};
    root.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>openP(b.dataset.r));
  };
  draw();root.scrollTop=0;$("pov").classList.add("show");
  loadRv(p.id).then(r=>{if(String(root.dataset.pid)==String(p.id)){S.rv=r;draw()}});
}
window.open=openP;
})();

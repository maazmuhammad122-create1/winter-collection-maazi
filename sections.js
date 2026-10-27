/* Maazi checkout instructions: purana note hata kar naye Order & Payment Instructions dikhata hai.
   index.html mein redesign.js ke BAAD load karein: <script src="sections.js"></script> */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const cp=$("cp");if(!cp)return;
const sx=document.createElement("style");
sx.textContent='.ins{background:#fffaf0;border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:10px 0;font-size:14px;line-height:1.7}.ins h4{font:600 19px "Cormorant Garamond",Georgia,serif;color:var(--brown);margin-bottom:6px}.ins ol{padding-left:20px;margin-bottom:10px}.ins p{margin:0}.ins .ty{margin-top:10px;color:var(--brown);font-weight:600}';
document.head.appendChild(sx);
const INS=()=>`<div class="ins"><h4>Maazi Clothing — Order &amp; Payment Instructions</h4><ol><li>Apna active WhatsApp number aur complete delivery address enter karein.</li><li>Order place karne ke baad WhatsApp automatically open hoga.</li><li>Advance payment ka screenshot aur Transaction ID WhatsApp par send karein.</li><li>Payment verify hone ke baad aapka order confirm kiya jayega.</li></ol><p><b>Payment Method:</b> Easypaisa<br><b>Advance Payment:</b> ${Math.round(ADV_PCT*100)}%<br><b>Delivery Charges:</b> Rs. ${DEL}<br><b>Remaining Amount:</b> Delivery par ada karein.</p><p class="ty">Thank you for shopping with Maazi Clothing!</p></div>`;
function fixCheckout(){
 const n=[...cp.querySelectorAll("p.note")].find(p=>/Advance Easypaisa par bhejne/.test(p.textContent));
 if(!n)return;
 n.outerHTML=INS();
 const pay=cp.querySelector(".pay");if(pay){const ps=pay.querySelectorAll("p");if(ps.length>2)ps[2].remove()}}
new MutationObserver(fixCheckout).observe(cp,{childList:true});
})();

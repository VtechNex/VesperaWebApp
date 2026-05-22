import{c as i,d as s,A as o,n,j as a,r as l}from"./index-CxJRAfod.js";/**
 * @license lucide-react v0.454.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=i("EyeOff",[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);/**
 * @license lucide-react v0.454.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=i("Eye",[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.454.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=i("LayoutGrid",[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]]);/**
 * @license lucide-react v0.454.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=i("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]),d=async(e=1,t=20,r={})=>{try{return await s.get(`${o.PROPERTIES}/all`,{params:{page:e,limit:t,...r}})}catch(c){return n(c,"Failed to fetch properties")}},y=async e=>{try{return await s.post(`${o.PROPERTIES}/upload-property-images`,e,{headers:{"Content-Type":"multipart/form-data"}})}catch(t){return n(t,"Failed to upload property image")}},u=async e=>{try{return await s.delete(`${o.PROPERTIES}/asset/${e}`)}catch(t){return n(t,"Failed to delete property asset")}},h=async e=>{try{return await s.post(`${o.PROPERTIES}/create`,e)}catch(t){return n(t,"Failed to create property")}},E=async(e,t)=>{try{return await s.put(`${o.PROPERTIES}/update/${e}`,t)}catch(r){return n(r,"Failed to update property")}},x=async e=>{try{return await s.delete(`${o.PROPERTIES}/delete/${e}`)}catch(t){return n(t,"Failed to delete property")}},P=async(e=1,t=50)=>{try{return await s.get(`${o.GLOBAL}/properties/all`,{params:{page:e,limit:t}})}catch(r){return n(r,"Failed to fetch public properties")}},R={GET:d,GET_PUBLIC:P,CREATE:h,UPDATE:E,DELETE:x,UPLOAD_IMAGE:y,DELETE_ASSET:u},p=l.createContext(null);function T({open:e,onOpenChange:t,children:r}){return a.jsx(p.Provider,{value:{open:e,onOpenChange:t},children:r})}function v({children:e,className:t=""}){const r=l.useContext(p);return r!=null&&r.open?a.jsxs("div",{className:"fixed inset-0 z-50 flex items-center justify-center",children:[a.jsx("div",{className:"absolute inset-0 bg-black/70 backdrop-blur-sm",onClick:()=>{var c;return(c=r.onOpenChange)==null?void 0:c.call(r,!1)}}),a.jsx("div",{className:"absolute inset-0 pointer-events-none","aria-hidden":"true",style:{background:"radial-gradient(900px 450px at 50% 10%, rgba(212,175,55,0.12), transparent 60%)"}}),a.jsx("div",{className:`relative z-10 rounded-lg ${t}`,children:e})]}):null}const $=({children:e,className:t=""})=>a.jsx("div",{className:`mb-4 ${t}`,children:e}),j=({children:e,className:t=""})=>a.jsx("h3",{className:`text-lg font-semibold ${t}`,children:e}),w=({children:e,className:t=""})=>a.jsx("p",{className:`text-sm text-white/70 ${t}`,children:e}),D=({children:e,className:t=""})=>a.jsx("div",{className:`mt-4 ${t}`,children:e});export{T as D,m as E,f as L,R as P,b as U,v as a,$ as b,j as c,w as d,D as e,k as f};

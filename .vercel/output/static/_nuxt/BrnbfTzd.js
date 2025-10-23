import{a9 as te,a4 as d,a5 as R,a2 as j,a6 as f,d as A,ab as K,ac as G,a0 as x,aD as ne,ba as ie,aE as oe,bm as re,a as E,af as B,ag as se,P as le,r as w,h as v,o as p,e as u,w as y,g as e,i as V,b1 as ae,k as b,t as m,F as I,j as U,b as q,ad as ce,aU as de,u as me}from"./CKxg9VfS.js";import{u as J}from"./BUAQ2s_u.js";import{i as ue,B as Q}from"./CkclNe_0.js";import{a as O,r as H}from"./CbhVS3Xc.js";import{f as pe}from"./ChAwXecA.js";import{_ as ge}from"./DpFlcqSt.js";import{_ as X}from"./DboHdRIr.js";import{_ as _e}from"./BjNiWSUp.js";import{_ as Y}from"./Bt2YpT3E.js";import{_ as fe,a as ve}from"./D9m8h4ON.js";import{u as ye}from"./B9Nuy0Yo.js";import{_ as xe}from"./C_IQnCrB.js";import"./Bjtksisr.js";import"./mUUuLyVv.js";import"./Be7d-GBD.js";import"./DDBjNozI.js";import"./HiGXOwLp.js";import"./Be3VPoHw.js";let W=!1;function he(){if(ue&&window.CSS&&!W&&(W=!0,"registerProperty"in(window==null?void 0:window.CSS)))try{CSS.registerProperty({name:"--n-color-start",syntax:"<color>",inherits:!1,initialValue:"#0000"}),CSS.registerProperty({name:"--n-color-end",syntax:"<color>",inherits:!1,initialValue:"#0000"})}catch{}}const be={titleMarginMedium:"0 0 6px 0",titleMarginLarge:"-2px 0 6px 0",titleFontSizeMedium:"14px",titleFontSizeLarge:"16px",iconSizeMedium:"14px",iconSizeLarge:"14px"};function ze(r){const{textColor3:a,infoColor:l,errorColor:i,successColor:o,warningColor:c,textColor1:g,textColor2:h,railColor:z,fontWeightStrong:k,fontSize:C}=r;return Object.assign(Object.assign({},be),{contentFontSize:C,titleFontWeight:k,circleBorder:`2px solid ${a}`,circleBorderInfo:`2px solid ${l}`,circleBorderError:`2px solid ${i}`,circleBorderSuccess:`2px solid ${o}`,circleBorderWarning:`2px solid ${c}`,iconColor:a,iconColorInfo:l,iconColorError:i,iconColorSuccess:o,iconColorWarning:c,titleTextColor:g,contentTextColor:h,metaTextColor:a,lineColor:z})}const Ce={common:te,self:ze},L=1.25,ke=d("timeline",`
 position: relative;
 width: 100%;
 display: flex;
 flex-direction: column;
 line-height: ${L};
`,[R("horizontal",`
 flex-direction: row;
 `,[j(">",[d("timeline-item",`
 flex-shrink: 0;
 padding-right: 40px;
 `,[R("dashed-line-type",[j(">",[d("timeline-item-timeline",[f("line",`
 background-image: linear-gradient(90deg, var(--n-color-start), var(--n-color-start) 50%, transparent 50%, transparent 100%);
 background-size: 10px 1px;
 `)])])]),j(">",[d("timeline-item-content",`
 margin-top: calc(var(--n-icon-size) + 12px);
 `,[j(">",[f("meta",`
 margin-top: 6px;
 margin-bottom: unset;
 `)])]),d("timeline-item-timeline",`
 width: 100%;
 height: calc(var(--n-icon-size) + 12px);
 `,[f("line",`
 left: var(--n-icon-size);
 top: calc(var(--n-icon-size) / 2 - 1px);
 right: 0px;
 width: unset;
 height: 2px;
 `)])])])])]),R("right-placement",[d("timeline-item",[d("timeline-item-content",`
 text-align: right;
 margin-right: calc(var(--n-icon-size) + 12px);
 `),d("timeline-item-timeline",`
 width: var(--n-icon-size);
 right: 0;
 `)])]),R("left-placement",[d("timeline-item",[d("timeline-item-content",`
 margin-left: calc(var(--n-icon-size) + 12px);
 `),d("timeline-item-timeline",`
 left: 0;
 `)])]),d("timeline-item",`
 position: relative;
 `,[j("&:last-child",[d("timeline-item-timeline",[f("line",`
 display: none;
 `)]),d("timeline-item-content",[f("meta",`
 margin-bottom: 0;
 `)])]),d("timeline-item-content",[f("title",`
 margin: var(--n-title-margin);
 font-size: var(--n-title-font-size);
 transition: color .3s var(--n-bezier);
 font-weight: var(--n-title-font-weight);
 color: var(--n-title-text-color);
 `),f("content",`
 transition: color .3s var(--n-bezier);
 font-size: var(--n-content-font-size);
 color: var(--n-content-text-color);
 `),f("meta",`
 transition: color .3s var(--n-bezier);
 font-size: 12px;
 margin-top: 6px;
 margin-bottom: 20px;
 color: var(--n-meta-text-color);
 `)]),R("dashed-line-type",[d("timeline-item-timeline",[f("line",`
 --n-color-start: var(--n-line-color);
 transition: --n-color-start .3s var(--n-bezier);
 background-color: transparent;
 background-image: linear-gradient(180deg, var(--n-color-start), var(--n-color-start) 50%, transparent 50%, transparent 100%);
 background-size: 1px 10px;
 `)])]),d("timeline-item-timeline",`
 width: calc(var(--n-icon-size) + 12px);
 position: absolute;
 top: calc(var(--n-title-font-size) * ${L} / 2 - var(--n-icon-size) / 2);
 height: 100%;
 `,[f("circle",`
 border: var(--n-circle-border);
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 width: var(--n-icon-size);
 height: var(--n-icon-size);
 border-radius: var(--n-icon-size);
 box-sizing: border-box;
 `),f("icon",`
 color: var(--n-icon-color);
 font-size: var(--n-icon-size);
 height: var(--n-icon-size);
 width: var(--n-icon-size);
 display: flex;
 align-items: center;
 justify-content: center;
 `),f("line",`
 transition: background-color .3s var(--n-bezier);
 position: absolute;
 top: var(--n-icon-size);
 left: calc(var(--n-icon-size) / 2 - 1px);
 bottom: 0px;
 width: 2px;
 background-color: var(--n-line-color);
 `)])])]),we=Object.assign(Object.assign({},G.props),{horizontal:Boolean,itemPlacement:{type:String,default:"left"},size:{type:String,default:"medium"},iconSize:Number}),Z=ie("n-timeline"),$e=A({name:"Timeline",props:we,setup(r,{slots:a}){const{mergedClsPrefixRef:l}=K(r),i=G("Timeline","-timeline",ke,Ce,r,l);return ne(Z,{props:r,mergedThemeRef:i,mergedClsPrefixRef:l}),()=>{const{value:o}=l;return x("div",{class:[`${o}-timeline`,r.horizontal&&`${o}-timeline--horizontal`,`${o}-timeline--${r.size}-size`,!r.horizontal&&`${o}-timeline--${r.itemPlacement}-placement`]},a)}}}),Se={time:[String,Number],title:String,content:String,color:String,lineType:{type:String,default:"default"},type:{type:String,default:"default"}},Te=A({name:"TimelineItem",props:Se,slots:Object,setup(r){const a=oe(Z);a||re("timeline-item","`n-timeline-item` must be placed inside `n-timeline`."),he();const{inlineThemeDisabled:l}=K(),i=E(()=>{const{props:{size:c,iconSize:g},mergedThemeRef:h}=a,{type:z}=r,{self:{titleTextColor:k,contentTextColor:C,metaTextColor:$,lineColor:s,titleFontWeight:t,contentFontSize:n,[B("iconSize",c)]:N,[B("titleMargin",c)]:D,[B("titleFontSize",c)]:M,[B("circleBorder",z)]:S,[B("iconColor",z)]:P},common:{cubicBezierEaseInOut:_}}=h.value;return{"--n-bezier":_,"--n-circle-border":S,"--n-icon-color":P,"--n-content-font-size":n,"--n-content-text-color":C,"--n-line-color":s,"--n-meta-text-color":$,"--n-title-font-size":M,"--n-title-font-weight":t,"--n-title-margin":D,"--n-title-text-color":k,"--n-icon-size":pe(g)||N}}),o=l?se("timeline-item",E(()=>{const{props:{size:c,iconSize:g}}=a,{type:h}=r;return`${c[0]}${g||"a"}${h[0]}`}),i,a.props):void 0;return{mergedClsPrefix:a.mergedClsPrefixRef,cssVars:l?void 0:i,themeClass:o==null?void 0:o.themeClass,onRender:o==null?void 0:o.onRender}},render(){const{mergedClsPrefix:r,color:a,onRender:l,$slots:i}=this;return l==null||l(),x("div",{class:[`${r}-timeline-item`,this.themeClass,`${r}-timeline-item--${this.type}-type`,`${r}-timeline-item--${this.lineType}-line-type`],style:this.cssVars},x("div",{class:`${r}-timeline-item-timeline`},x("div",{class:`${r}-timeline-item-timeline__line`}),O(i.icon,o=>o?x("div",{class:`${r}-timeline-item-timeline__icon`,style:{color:a}},o):x("div",{class:`${r}-timeline-item-timeline__circle`,style:{borderColor:a}}))),x("div",{class:`${r}-timeline-item-content`},O(i.header,o=>o||this.title?x("div",{class:`${r}-timeline-item-content__title`},o||this.title):null),x("div",{class:`${r}-timeline-item-content__content`},H(i.default,()=>[this.content])),x("div",{class:`${r}-timeline-item-content__meta`},H(i.footer,()=>[this.time]))))}}),Ne={class:"space-y-4"},De={class:"flex gap-2"},Me={key:0,class:"tracking-info space-y-4"},Pe={class:"basic-info space-y-2"},Re={class:"flex justify-between items-center"},je={class:"flex justify-between items-center"},Be={class:"flex justify-between items-center"},Fe={class:"flex justify-between items-center"},Ve={class:"recipient-info space-y-1"},Ie={class:"status-history"},Ee={class:"timeline-content"},Oe={class:"font-medium"},He={class:"text-sm text-gray-500"},We={key:1,class:"text-red-500 text-sm"},Le={key:2,class:"empty-state text-center py-4"},Ae={__name:"TrackOrder",setup(r){const a=J(),l=w(""),i=w(null),o=w(!1),c=w(!1),g=w(""),h=t=>new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(t||0),z=t=>{if(!t)return"N/A";const n=new Date(t);return new Intl.DateTimeFormat("vi-VN",{year:"numeric",month:"2-digit",day:"2-digit"}).format(n)},k=t=>{if(!t)return"N/A";const n=new Date(t);return new Intl.DateTimeFormat("vi-VN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(n)},C=t=>({ready_to_pick:"Ready for pickup",picking:"Picking up",picked:"Picked up",delivering:"Delivering",delivered:"Delivered",delivery_failed:"Delivery failed",waiting_to_return:"Waiting for return",return:"Returning",returned:"Returned",cancelled:"Cancelled"})[t]||t,$=t=>({ready_to_pick:"info",picking:"info",picked:"success",delivering:"warning",delivered:"success",delivery_failed:"error",waiting_to_return:"warning",return:"warning",returned:"info",cancelled:"error"})[t]||"default",s=async()=>{if(l.value){o.value=!0,c.value=!1,g.value="";try{const t=await a.get(`/api/shipping/track?order_code=${l.value}`);t.status&&t.data?i.value=t.data:(c.value=!0,g.value=t.message||"Order information not found",i.value=null)}catch(t){console.error("Error tracking order:",t),c.value=!0,g.value="Cannot track order: "+(t.message||""),i.value=null}finally{o.value=!1}}};return(t,n)=>{const N=ge,D=Q,M=X,S=_e,P=Te,_=$e,F=Y;return p(),v("div",null,[u(F,{title:"Track GHN Delivery",size:"small"},{default:y(()=>[e("div",Ne,[e("div",De,[u(N,{value:l.value,"onUpdate:value":n[0]||(n[0]=T=>l.value=T),placeholder:"Enter tracking code",disabled:o.value,onKeyup:ae(s,["enter"])},null,8,["value","disabled"]),u(D,{loading:o.value,disabled:!l.value,onClick:s,type:"primary",strong:""},{default:y(()=>n[1]||(n[1]=[b(" Track ")])),_:1,__:[1]},8,["loading","disabled"])]),i.value?(p(),v("div",Me,[e("div",Pe,[e("div",Re,[n[2]||(n[2]=e("span",{class:"font-medium"},"Tracking Code:",-1)),e("span",null,m(i.value.order_code),1)]),e("div",je,[n[3]||(n[3]=e("span",{class:"font-medium"},"Status:",-1)),u(M,{type:$(i.value.status),bordered:"false"},{default:y(()=>[b(m(C(i.value.status)),1)]),_:1},8,["type"])]),e("div",Be,[n[4]||(n[4]=e("span",{class:"font-medium"},"Expected Delivery:",-1)),e("span",null,m(z(i.value.expected_delivery_time)),1)]),e("div",Fe,[n[5]||(n[5]=e("span",{class:"font-medium"},"Shipping Fee:",-1)),e("span",null,m(h(i.value.total_fee)),1)])]),u(S),e("div",Ve,[n[9]||(n[9]=e("h3",{class:"font-medium"},"Recipient Information",-1)),e("p",null,[n[6]||(n[6]=e("strong",null,"Full name:",-1)),b(" "+m(i.value.to_name),1)]),e("p",null,[n[7]||(n[7]=e("strong",null,"Phone number:",-1)),b(" "+m(i.value.to_phone),1)]),e("p",null,[n[8]||(n[8]=e("strong",null,"Address:",-1)),b(" "+m(i.value.to_address),1)])]),u(S),e("div",Ie,[n[10]||(n[10]=e("h3",{class:"font-medium mb-2"},"Status History",-1)),u(_,null,{default:y(()=>[(p(!0),v(I,null,U(i.value.status_history,(T,ee)=>(p(),q(P,{key:ee,type:$(T.status)},{content:y(()=>[e("div",Ee,[e("p",Oe,m(C(T.status)),1),e("p",He,m(k(T.timestamp)),1)])]),_:2},1032,["type"]))),128))]),_:1})])])):V("",!0),c.value?(p(),v("div",We,m(g.value),1)):V("",!0),!i.value&&!o.value&&!c.value?(p(),v("div",Le,n[11]||(n[11]=[e("p",{class:"text-gray-500"},"Enter a tracking code to see your delivery status",-1)]))):V("",!0)])]),_:1})])}}},Ke=le(Ae,[["__scopeId","data-v-eadf2603"]]),Ge={class:"mb-4"},Ue={class:"grid grid-cols-1 lg:grid-cols-2 gap-6"},qe={key:0,class:"text-center py-8"},Je={key:1,class:"space-y-4"},Qe={class:"flex justify-between items-center"},Xe={class:"font-medium"},Ye={class:"text-sm text-gray-500"},Ze={class:"mt-2 flex justify-between items-center"},et={class:"text-sm"},tt={class:"text-gray-500"},ht={__name:"track",setup(r){const a=de(),l=J(),i=ye(),o=w([]),c=w(!0),g=s=>new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(s||0),h=s=>{if(!s)return"N/A";const t=new Date(s);return new Intl.DateTimeFormat("vi-VN",{year:"numeric",month:"2-digit",day:"2-digit"}).format(t)},z=s=>({pending:"Pending",confirmed:"Confirmed",shipping:"Shipping",delivered:"Delivered",cancelled:"Cancelled"})[s]||s,k=s=>({pending:"info",confirmed:"info",shipping:"warning",delivered:"success",cancelled:"error"})[s]||"default",C=async s=>{try{await navigator.clipboard.writeText(s),i.success("Tracking code copied")}catch(t){console.error("Error copying:",t),i.error("Could not copy tracking code")}},$=async()=>{try{const s=await l.get("/api/shipping?limit=5");s.status&&s.data&&(o.value=s.data)}catch(s){console.error("Error fetching shipping list:",s)}finally{c.value=!1}};return ce(()=>{$()}),(s,t)=>{const n=ve,N=fe,D=xe,M=X,S=Q,P=Y;return p(),v("div",null,[e("div",Ge,[u(N,null,{default:y(()=>[u(n,{onClick:t[0]||(t[0]=_=>me(a).push("/"))},{default:y(()=>t[1]||(t[1]=[b(" Home ")])),_:1,__:[1]}),u(n,null,{default:y(()=>t[2]||(t[2]=[b(" Track Order ")])),_:1,__:[2]})]),_:1})]),t[5]||(t[5]=e("div",{class:"flex justify-between items-center mb-4"},[e("div",null,[e("h1",{class:"text-2xl font-bold"},"Track Order"),e("p",{class:"text-gray-500 dark:text-gray-400"}," Check the status of your order through GHN ")])],-1)),e("div",Ue,[e("div",null,[u(Ke)]),e("div",null,[u(P,{title:"Recent Orders",size:"small"},{default:y(()=>[c.value?(p(),q(D,{key:0})):(p(),v(I,{key:1},[o.value.length===0?(p(),v("div",qe,t[3]||(t[3]=[e("p",{class:"text-gray-500"},"No recent orders",-1)]))):(p(),v("div",Je,[(p(!0),v(I,null,U(o.value,(_,F)=>(p(),v("div",{key:F,class:"border-b pb-3 last:border-0"},[e("div",Qe,[e("div",null,[e("h3",Xe,"Tracking Code: "+m(_.shipping_code),1),e("p",Ye,"Created: "+m(h(_.created_at)),1)]),u(M,{type:k(_.status)},{default:y(()=>[b(m(z(_.status)),1)]),_:2},1032,["type"])]),e("div",Ze,[e("div",et,[e("div",null,"Recipient: "+m(_.recipient_name),1),e("div",tt,m(g(_.shipping_fee)),1)]),u(S,{size:"small",onClick:T=>C(_.shipping_code)},{default:y(()=>t[4]||(t[4]=[b(" Copy code ")])),_:2,__:[4]},1032,["onClick"])])]))),128))]))],64))]),_:1})])])])}}};export{ht as default};

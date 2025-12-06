import{i as P}from"./CkclNe_0.js";import{a9 as T,a4 as m,a2 as s,a6 as u,a5 as L,d as g,a0 as v,ab as y,ac as C,aD as j,$ as H,a as p,ag as E,ba as S,r as $,ad as O,aC as I,aE as w}from"./CKxg9VfS.js";import{r as A}from"./CbhVS3Xc.js";const V={fontWeightActive:"400"};function D(e){const{fontSize:o,textColor3:a,textColor2:r,borderRadius:n,buttonColor2Hover:t,buttonColor2Pressed:l}=e;return Object.assign(Object.assign({},V),{fontSize:o,itemLineHeight:"1.25",itemTextColor:a,itemTextColorHover:r,itemTextColorPressed:r,itemTextColorActive:r,itemBorderRadius:n,itemColorHover:t,itemColorPressed:l,separatorColor:a})}const K={common:T,self:D},M=m("breadcrumb",`
 white-space: nowrap;
 cursor: default;
 line-height: var(--n-item-line-height);
`,[s("ul",`
 list-style: none;
 padding: 0;
 margin: 0;
 `),s("a",`
 color: inherit;
 text-decoration: inherit;
 `),m("breadcrumb-item",`
 font-size: var(--n-font-size);
 transition: color .3s var(--n-bezier);
 display: inline-flex;
 align-items: center;
 `,[m("icon",`
 font-size: 18px;
 vertical-align: -.2em;
 transition: color .3s var(--n-bezier);
 color: var(--n-item-text-color);
 `),s("&:not(:last-child)",[L("clickable",[u("link",`
 cursor: pointer;
 `,[s("&:hover",`
 background-color: var(--n-item-color-hover);
 `),s("&:active",`
 background-color: var(--n-item-color-pressed); 
 `)])])]),u("link",`
 padding: 4px;
 border-radius: var(--n-item-border-radius);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 color: var(--n-item-text-color);
 position: relative;
 `,[s("&:hover",`
 color: var(--n-item-text-color-hover);
 `,[m("icon",`
 color: var(--n-item-text-color-hover);
 `)]),s("&:active",`
 color: var(--n-item-text-color-pressed);
 `,[m("icon",`
 color: var(--n-item-text-color-pressed);
 `)])]),u("separator",`
 margin: 0 8px;
 color: var(--n-separator-color);
 transition: color .3s var(--n-bezier);
 user-select: none;
 -webkit-user-select: none;
 `),s("&:last-child",[u("link",`
 font-weight: var(--n-font-weight-active);
 cursor: unset;
 color: var(--n-item-text-color-active);
 `,[m("icon",`
 color: var(--n-item-text-color-active);
 `)]),u("separator",`
 display: none;
 `)])])]),x=S("n-breadcrumb"),F=Object.assign(Object.assign({},C.props),{separator:{type:String,default:"/"}}),Q=g({name:"Breadcrumb",props:F,setup(e){const{mergedClsPrefixRef:o,inlineThemeDisabled:a}=y(e),r=C("Breadcrumb","-breadcrumb",M,K,e,o);j(x,{separatorRef:H(e,"separator"),mergedClsPrefixRef:o});const n=p(()=>{const{common:{cubicBezierEaseInOut:l},self:{separatorColor:d,itemTextColor:i,itemTextColorHover:c,itemTextColorPressed:b,itemTextColorActive:h,fontSize:f,fontWeightActive:R,itemBorderRadius:k,itemColorHover:_,itemColorPressed:z,itemLineHeight:B}}=r.value;return{"--n-font-size":f,"--n-bezier":l,"--n-item-text-color":i,"--n-item-text-color-hover":c,"--n-item-text-color-pressed":b,"--n-item-text-color-active":h,"--n-separator-color":d,"--n-item-color-hover":_,"--n-item-color-pressed":z,"--n-item-border-radius":k,"--n-font-weight-active":R,"--n-item-line-height":B}}),t=a?E("breadcrumb",void 0,n,e):void 0;return{mergedClsPrefix:o,cssVars:a?void 0:n,themeClass:t==null?void 0:t.themeClass,onRender:t==null?void 0:t.onRender}},render(){var e;return(e=this.onRender)===null||e===void 0||e.call(this),v("nav",{class:[`${this.mergedClsPrefix}-breadcrumb`,this.themeClass],style:this.cssVars,"aria-label":"Breadcrumb"},v("ul",null,this.$slots))}});function N(e=P?window:null){const o=()=>{const{hash:n,host:t,hostname:l,href:d,origin:i,pathname:c,port:b,protocol:h,search:f}=(e==null?void 0:e.location)||{};return{hash:n,host:t,hostname:l,href:d,origin:i,pathname:c,port:b,protocol:h,search:f}},a=$(o()),r=()=>{a.value=o()};return O(()=>{e&&(e.addEventListener("popstate",r),e.addEventListener("hashchange",r))}),I(()=>{e&&(e.removeEventListener("popstate",r),e.removeEventListener("hashchange",r))}),a}const U={separator:String,href:String,clickable:{type:Boolean,default:!0},onClick:Function},X=g({name:"BreadcrumbItem",props:U,slots:Object,setup(e,{slots:o}){const a=w(x,null);if(!a)return()=>null;const{separatorRef:r,mergedClsPrefixRef:n}=a,t=N(),l=p(()=>e.href?"a":"span"),d=p(()=>t.value.href===e.href?"location":null);return()=>{const{value:i}=n;return v("li",{class:[`${i}-breadcrumb-item`,e.clickable&&`${i}-breadcrumb-item--clickable`]},v(l.value,{class:`${i}-breadcrumb-item__link`,"aria-current":d.value,href:e.href,onClick:e.onClick},o),v("span",{class:`${i}-breadcrumb-item__separator`,"aria-hidden":"true"},A(o.separator,()=>{var c;return[(c=e.separator)!==null&&c!==void 0?c:r.value]})))}}});export{Q as _,X as a};

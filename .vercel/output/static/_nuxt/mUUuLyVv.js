import{a2 as r,a3 as l,a4 as f,d,a0 as c,a7 as v,$ as m,r as o,aX as p,a1 as $}from"./CKxg9VfS.js";const{cubicBezierEaseInOut:a}=l;function w({duration:e=".2s",delay:i=".1s"}={}){return[r("&.fade-in-width-expand-transition-leave-from, &.fade-in-width-expand-transition-enter-to",{opacity:1}),r("&.fade-in-width-expand-transition-leave-to, &.fade-in-width-expand-transition-enter-from",`
 opacity: 0!important;
 margin-left: 0!important;
 margin-right: 0!important;
 `),r("&.fade-in-width-expand-transition-leave-active",`
 overflow: hidden;
 transition:
 opacity ${e} ${a},
 max-width ${e} ${a} ${i},
 margin-left ${e} ${a} ${i},
 margin-right ${e} ${a} ${i};
 `),r("&.fade-in-width-expand-transition-enter-active",`
 overflow: hidden;
 transition:
 opacity ${e} ${a} ${i},
 max-width ${e} ${a},
 margin-left ${e} ${a},
 margin-right ${e} ${a};
 `)]}const u=f("base-wave",`
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 border-radius: inherit;
`),x=d({name:"BaseWave",props:{clsPrefix:{type:String,required:!0}},setup(e){v("-base-wave",u,m(e,"clsPrefix"));const i=o(null),n=o(!1);let t=null;return p(()=>{t!==null&&window.clearTimeout(t)}),{active:n,selfRef:i,play(){t!==null&&(window.clearTimeout(t),n.value=!1,t=null),$(()=>{var s;(s=i.value)===null||s===void 0||s.offsetHeight,n.value=!0,t=window.setTimeout(()=>{n.value=!1,t=null},1e3)})}}},render(){const{clsPrefix:e}=this;return c("div",{ref:"selfRef","aria-hidden":!0,class:[`${e}-base-wave`,this.active&&`${e}-base-wave--active`]})}});export{x as N,w as f};

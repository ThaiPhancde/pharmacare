import{a9 as S,a2 as f,a4 as p,a5 as h,d as C,a0 as r,eI as x,aa as k,ab as T,ac as v,a as u,af as $,ag as w,r as R,aA as _}from"./CKxg9VfS.js";import{f as B}from"./Be7d-GBD.js";import{p as O}from"./CbhVS3Xc.js";import{u as j}from"./Be3VPoHw.js";function I(e){const{opacityDisabled:a,heightTiny:t,heightSmall:i,heightMedium:l,heightLarge:s,heightHuge:c,primaryColor:o,fontSize:n}=e;return{fontSize:n,textColor:o,sizeTiny:t,sizeSmall:i,sizeMedium:l,sizeLarge:s,sizeHuge:c,color:o,opacitySpinning:a}}const N={common:S,self:I},P=f([f("@keyframes spin-rotate",`
 from {
 transform: rotate(0);
 }
 to {
 transform: rotate(360deg);
 }
 `),p("spin-container",`
 position: relative;
 `,[p("spin-body",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 `,[B()])]),p("spin-body",`
 display: inline-flex;
 align-items: center;
 justify-content: center;
 flex-direction: column;
 `),p("spin",`
 display: inline-flex;
 height: var(--n-size);
 width: var(--n-size);
 font-size: var(--n-size);
 color: var(--n-color);
 `,[h("rotate",`
 animation: spin-rotate 2s linear infinite;
 `)]),p("spin-description",`
 display: inline-block;
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 margin-top: 8px;
 `),p("spin-content",`
 opacity: 1;
 transition: opacity .3s var(--n-bezier);
 pointer-events: all;
 `,[h("spinning",`
 user-select: none;
 -webkit-user-select: none;
 pointer-events: none;
 opacity: var(--n-opacity-spinning);
 `)])]),V={small:20,medium:18,large:16},W=Object.assign(Object.assign({},v.props),{contentClass:String,contentStyle:[Object,String],description:String,stroke:String,size:{type:[String,Number],default:"medium"},show:{type:Boolean,default:!0},strokeWidth:Number,rotate:{type:Boolean,default:!0},spinning:{type:Boolean,validator:()=>!0,default:void 0},delay:Number}),M=C({name:"Spin",props:W,slots:Object,setup(e){const{mergedClsPrefixRef:a,inlineThemeDisabled:t}=T(e),i=v("Spin","-spin",P,N,e,a),l=u(()=>{const{size:n}=e,{common:{cubicBezierEaseInOut:d},self:m}=i.value,{opacitySpinning:g,color:y,textColor:b}=m,z=typeof n=="number"?O(n):m[$("size",n)];return{"--n-bezier":d,"--n-opacity-spinning":g,"--n-size":z,"--n-color":y,"--n-text-color":b}}),s=t?w("spin",u(()=>{const{size:n}=e;return typeof n=="number"?String(n):n[0]}),l,e):void 0,c=j(e,["spinning","show"]),o=R(!1);return _(n=>{let d;if(c.value){const{delay:m}=e;if(m){d=window.setTimeout(()=>{o.value=!0},m),n(()=>{clearTimeout(d)});return}}o.value=c.value}),{mergedClsPrefix:a,active:o,mergedStrokeWidth:u(()=>{const{strokeWidth:n}=e;if(n!==void 0)return n;const{size:d}=e;return V[typeof d=="number"?"medium":d]}),cssVars:t?void 0:l,themeClass:s==null?void 0:s.themeClass,onRender:s==null?void 0:s.onRender}},render(){var e,a;const{$slots:t,mergedClsPrefix:i,description:l}=this,s=t.icon&&this.rotate,c=(l||t.description)&&r("div",{class:`${i}-spin-description`},l||((e=t.description)===null||e===void 0?void 0:e.call(t))),o=t.icon?r("div",{class:[`${i}-spin-body`,this.themeClass]},r("div",{class:[`${i}-spin`,s&&`${i}-spin--rotate`],style:t.default?"":this.cssVars},t.icon()),c):r("div",{class:[`${i}-spin-body`,this.themeClass]},r(x,{clsPrefix:i,style:t.default?"":this.cssVars,stroke:this.stroke,"stroke-width":this.mergedStrokeWidth,class:`${i}-spin`}),c);return(a=this.onRender)===null||a===void 0||a.call(this),t.default?r("div",{class:[`${i}-spin-container`,this.themeClass],style:this.cssVars},r("div",{class:[`${i}-spin-content`,this.active&&`${i}-spin-content--spinning`,this.contentClass],style:this.contentStyle},t),r(k,{name:"fade-in-transition"},{default:()=>this.active?o:null})):o}});export{M as _};

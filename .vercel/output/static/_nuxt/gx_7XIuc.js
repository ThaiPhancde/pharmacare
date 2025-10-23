import{a9 as O,bE as u,b9 as v,a4 as x,a6 as i,a5 as y,bk as F,a2 as V,d as N,a0 as l,v as D,fa as K,bc as q,bi as G,bh as J,bg as Q,bj as U,a8 as X,ab as Y,ac as $,ae as Z,a as E,af as c,ag as oo,r as eo}from"./CKxg9VfS.js";import{r as ro,a as no,g as so}from"./CbhVS3Xc.js";const lo={iconMargin:"11px 8px 0 12px",iconMarginRtl:"11px 12px 0 8px",iconSize:"24px",closeIconSize:"16px",closeSize:"20px",closeMargin:"13px 14px 0 0",closeMarginRtl:"13px 0 0 14px",padding:"13px"};function to(r){const{lineHeight:o,borderRadius:d,fontWeightStrong:C,baseColor:t,dividerColor:b,actionColor:P,textColor1:g,textColor2:s,closeColorHover:h,closeColorPressed:f,closeIconColor:p,closeIconColorHover:m,closeIconColorPressed:n,infoColor:e,successColor:I,warningColor:z,errorColor:S,fontSize:T}=r;return Object.assign(Object.assign({},lo),{fontSize:T,lineHeight:o,titleFontWeight:C,borderRadius:d,border:`1px solid ${b}`,color:P,titleTextColor:g,iconColor:s,contentTextColor:s,closeBorderRadius:d,closeColorHover:h,closeColorPressed:f,closeIconColor:p,closeIconColorHover:m,closeIconColorPressed:n,borderInfo:`1px solid ${u(t,v(e,{alpha:.25}))}`,colorInfo:u(t,v(e,{alpha:.08})),titleTextColorInfo:g,iconColorInfo:e,contentTextColorInfo:s,closeColorHoverInfo:h,closeColorPressedInfo:f,closeIconColorInfo:p,closeIconColorHoverInfo:m,closeIconColorPressedInfo:n,borderSuccess:`1px solid ${u(t,v(I,{alpha:.25}))}`,colorSuccess:u(t,v(I,{alpha:.08})),titleTextColorSuccess:g,iconColorSuccess:I,contentTextColorSuccess:s,closeColorHoverSuccess:h,closeColorPressedSuccess:f,closeIconColorSuccess:p,closeIconColorHoverSuccess:m,closeIconColorPressedSuccess:n,borderWarning:`1px solid ${u(t,v(z,{alpha:.33}))}`,colorWarning:u(t,v(z,{alpha:.08})),titleTextColorWarning:g,iconColorWarning:z,contentTextColorWarning:s,closeColorHoverWarning:h,closeColorPressedWarning:f,closeIconColorWarning:p,closeIconColorHoverWarning:m,closeIconColorPressedWarning:n,borderError:`1px solid ${u(t,v(S,{alpha:.25}))}`,colorError:u(t,v(S,{alpha:.08})),titleTextColorError:g,iconColorError:S,contentTextColorError:s,closeColorHoverError:h,closeColorPressedError:f,closeIconColorError:p,closeIconColorHoverError:m,closeIconColorPressedError:n})}const io={common:O,self:to},ao=x("alert",`
 line-height: var(--n-line-height);
 border-radius: var(--n-border-radius);
 position: relative;
 transition: background-color .3s var(--n-bezier);
 background-color: var(--n-color);
 text-align: start;
 word-break: break-word;
`,[i("border",`
 border-radius: inherit;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 transition: border-color .3s var(--n-bezier);
 border: var(--n-border);
 pointer-events: none;
 `),y("closable",[x("alert-body",[i("title",`
 padding-right: 24px;
 `)])]),i("icon",{color:"var(--n-icon-color)"}),x("alert-body",{padding:"var(--n-padding)"},[i("title",{color:"var(--n-title-text-color)"}),i("content",{color:"var(--n-content-text-color)"})]),F({originalTransition:"transform .3s var(--n-bezier)",enterToProps:{transform:"scale(1)"},leaveToProps:{transform:"scale(0.9)"}}),i("icon",`
 position: absolute;
 left: 0;
 top: 0;
 align-items: center;
 justify-content: center;
 display: flex;
 width: var(--n-icon-size);
 height: var(--n-icon-size);
 font-size: var(--n-icon-size);
 margin: var(--n-icon-margin);
 `),i("close",`
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 position: absolute;
 right: 0;
 top: 0;
 margin: var(--n-close-margin);
 `),y("show-icon",[x("alert-body",{paddingLeft:"calc(var(--n-icon-margin-left) + var(--n-icon-size) + var(--n-icon-margin-right))"})]),y("right-adjust",[x("alert-body",{paddingRight:"calc(var(--n-close-size) + var(--n-padding) + 2px)"})]),x("alert-body",`
 border-radius: var(--n-border-radius);
 transition: border-color .3s var(--n-bezier);
 `,[i("title",`
 transition: color .3s var(--n-bezier);
 font-size: 16px;
 line-height: 19px;
 font-weight: var(--n-title-font-weight);
 `,[V("& +",[i("content",{marginTop:"9px"})])]),i("content",{transition:"color .3s var(--n-bezier)",fontSize:"var(--n-font-size)"})]),i("icon",{transition:"color .3s var(--n-bezier)"})]),co=Object.assign(Object.assign({},$.props),{title:String,showIcon:{type:Boolean,default:!0},type:{type:String,default:"default"},bordered:{type:Boolean,default:!0},closable:Boolean,onClose:Function,onAfterLeave:Function,onAfterHide:Function}),uo=N({name:"Alert",inheritAttrs:!1,props:co,slots:Object,setup(r){const{mergedClsPrefixRef:o,mergedBorderedRef:d,inlineThemeDisabled:C,mergedRtlRef:t}=Y(r),b=$("Alert","-alert",ao,io,r,o),P=Z("Alert",t,o),g=E(()=>{const{common:{cubicBezierEaseInOut:n},self:e}=b.value,{fontSize:I,borderRadius:z,titleFontWeight:S,lineHeight:T,iconSize:H,iconMargin:R,iconMarginRtl:_,closeIconSize:W,closeBorderRadius:w,closeSize:A,closeMargin:B,closeMarginRtl:j,padding:k}=e,{type:a}=r,{left:M,right:L}=so(R);return{"--n-bezier":n,"--n-color":e[c("color",a)],"--n-close-icon-size":W,"--n-close-border-radius":w,"--n-close-color-hover":e[c("closeColorHover",a)],"--n-close-color-pressed":e[c("closeColorPressed",a)],"--n-close-icon-color":e[c("closeIconColor",a)],"--n-close-icon-color-hover":e[c("closeIconColorHover",a)],"--n-close-icon-color-pressed":e[c("closeIconColorPressed",a)],"--n-icon-color":e[c("iconColor",a)],"--n-border":e[c("border",a)],"--n-title-text-color":e[c("titleTextColor",a)],"--n-content-text-color":e[c("contentTextColor",a)],"--n-line-height":T,"--n-border-radius":z,"--n-font-size":I,"--n-title-font-weight":S,"--n-icon-size":H,"--n-icon-margin":R,"--n-icon-margin-rtl":_,"--n-close-size":A,"--n-close-margin":B,"--n-close-margin-rtl":j,"--n-padding":k,"--n-icon-margin-left":M,"--n-icon-margin-right":L}}),s=C?oo("alert",E(()=>r.type[0]),g,r):void 0,h=eo(!0),f=()=>{const{onAfterLeave:n,onAfterHide:e}=r;n&&n(),e&&e()};return{rtlEnabled:P,mergedClsPrefix:o,mergedBordered:d,visible:h,handleCloseClick:()=>{var n;Promise.resolve((n=r.onClose)===null||n===void 0?void 0:n.call(r)).then(e=>{e!==!1&&(h.value=!1)})},handleAfterLeave:()=>{f()},mergedTheme:b,cssVars:C?void 0:g,themeClass:s==null?void 0:s.themeClass,onRender:s==null?void 0:s.onRender}},render(){var r;return(r=this.onRender)===null||r===void 0||r.call(this),l(X,{onAfterLeave:this.handleAfterLeave},{default:()=>{const{mergedClsPrefix:o,$slots:d}=this,C={class:[`${o}-alert`,this.themeClass,this.closable&&`${o}-alert--closable`,this.showIcon&&`${o}-alert--show-icon`,!this.title&&this.closable&&`${o}-alert--right-adjust`,this.rtlEnabled&&`${o}-alert--rtl`],style:this.cssVars,role:"alert"};return this.visible?l("div",Object.assign({},D(this.$attrs,C)),this.closable&&l(K,{clsPrefix:o,class:`${o}-alert__close`,onClick:this.handleCloseClick}),this.bordered&&l("div",{class:`${o}-alert__border`}),this.showIcon&&l("div",{class:`${o}-alert__icon`,"aria-hidden":"true"},ro(d.icon,()=>[l(q,{clsPrefix:o},{default:()=>{switch(this.type){case"success":return l(U,null);case"info":return l(Q,null);case"warning":return l(J,null);case"error":return l(G,null);default:return null}}})])),l("div",{class:[`${o}-alert-body`,this.mergedBordered&&`${o}-alert-body--bordered`]},no(d.header,t=>{const b=t||this.title;return b?l("div",{class:`${o}-alert-body__title`},b):null}),d.default&&l("div",{class:`${o}-alert-body__content`},d))):null}})}});export{uo as _};

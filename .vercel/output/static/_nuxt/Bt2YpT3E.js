import{a9 as X,a2 as n,a4 as z,bF as Y,bG as Z,fe as oo,a5 as i,a6 as a,d as eo,a0 as s,ab as ro,ac as _,ae as to,a as E,ag as no,fa as ao,af as $}from"./CKxg9VfS.js";import{a as h,c as io,f as v,g as lo}from"./CbhVS3Xc.js";import{k as so}from"./HiGXOwLp.js";const co={paddingSmall:"12px 16px 12px",paddingMedium:"19px 24px 20px",paddingLarge:"23px 32px 24px",paddingHuge:"27px 40px 28px",titleFontSizeSmall:"16px",titleFontSizeMedium:"18px",titleFontSizeLarge:"18px",titleFontSizeHuge:"18px",closeIconSize:"18px",closeSize:"22px"};function bo(e){const{primaryColor:u,borderRadius:g,lineHeight:o,fontSize:c,cardColor:b,textColor2:x,textColor1:f,dividerColor:d,fontWeightStrong:t,closeIconColor:r,closeIconColorHover:l,closeIconColorPressed:C,closeColorHover:p,closeColorPressed:S,modalColor:y,boxShadow1:k,popoverColor:w,actionColor:m}=e;return Object.assign(Object.assign({},co),{lineHeight:o,color:b,colorModal:y,colorPopover:w,colorTarget:u,colorEmbedded:m,colorEmbeddedModal:m,colorEmbeddedPopover:m,textColor:x,titleTextColor:f,borderColor:d,actionColor:m,titleFontWeight:t,closeColorHover:p,closeColorPressed:S,closeBorderRadius:g,closeIconColor:r,closeIconColorHover:l,closeIconColorPressed:C,fontSizeSmall:c,fontSizeMedium:c,fontSizeLarge:c,fontSizeHuge:c,boxShadow:k,borderRadius:g})}const go={name:"Card",common:X,self:bo},fo=n([z("card",`
 font-size: var(--n-font-size);
 line-height: var(--n-line-height);
 display: flex;
 flex-direction: column;
 width: 100%;
 box-sizing: border-box;
 position: relative;
 border-radius: var(--n-border-radius);
 background-color: var(--n-color);
 color: var(--n-text-color);
 word-break: break-word;
 transition: 
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[oo({background:"var(--n-color-modal)"}),i("hoverable",[n("&:hover","box-shadow: var(--n-box-shadow);")]),i("content-segmented",[n(">",[a("content",{paddingTop:"var(--n-padding-bottom)"})])]),i("content-soft-segmented",[n(">",[a("content",`
 margin: 0 var(--n-padding-left);
 padding: var(--n-padding-bottom) 0;
 `)])]),i("footer-segmented",[n(">",[a("footer",{paddingTop:"var(--n-padding-bottom)"})])]),i("footer-soft-segmented",[n(">",[a("footer",`
 padding: var(--n-padding-bottom) 0;
 margin: 0 var(--n-padding-left);
 `)])]),n(">",[z("card-header",`
 box-sizing: border-box;
 display: flex;
 align-items: center;
 font-size: var(--n-title-font-size);
 padding:
 var(--n-padding-top)
 var(--n-padding-left)
 var(--n-padding-bottom)
 var(--n-padding-left);
 `,[a("main",`
 font-weight: var(--n-title-font-weight);
 transition: color .3s var(--n-bezier);
 flex: 1;
 min-width: 0;
 color: var(--n-title-text-color);
 `),a("extra",`
 display: flex;
 align-items: center;
 font-size: var(--n-font-size);
 font-weight: 400;
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
 `),a("close",`
 margin: 0 0 0 8px;
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 `)]),a("action",`
 box-sizing: border-box;
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 background-clip: padding-box;
 background-color: var(--n-action-color);
 `),a("content","flex: 1; min-width: 0;"),a("content, footer",`
 box-sizing: border-box;
 padding: 0 var(--n-padding-left) var(--n-padding-bottom) var(--n-padding-left);
 font-size: var(--n-font-size);
 `,[n("&:first-child",{paddingTop:"var(--n-padding-bottom)"})]),a("action",`
 background-color: var(--n-action-color);
 padding: var(--n-padding-bottom) var(--n-padding-left);
 border-bottom-left-radius: var(--n-border-radius);
 border-bottom-right-radius: var(--n-border-radius);
 `)]),z("card-cover",`
 overflow: hidden;
 width: 100%;
 border-radius: var(--n-border-radius) var(--n-border-radius) 0 0;
 `,[n("img",`
 display: block;
 width: 100%;
 `)]),i("bordered",`
 border: 1px solid var(--n-border-color);
 `,[n("&:target","border-color: var(--n-color-target);")]),i("action-segmented",[n(">",[a("action",[n("&:not(:first-child)",{borderTop:"1px solid var(--n-border-color)"})])])]),i("content-segmented, content-soft-segmented",[n(">",[a("content",{transition:"border-color 0.3s var(--n-bezier)"},[n("&:not(:first-child)",{borderTop:"1px solid var(--n-border-color)"})])])]),i("footer-segmented, footer-soft-segmented",[n(">",[a("footer",{transition:"border-color 0.3s var(--n-bezier)"},[n("&:not(:first-child)",{borderTop:"1px solid var(--n-border-color)"})])])]),i("embedded",`
 background-color: var(--n-color-embedded);
 `)]),Y(z("card",`
 background: var(--n-color-modal);
 `,[i("embedded",`
 background-color: var(--n-color-embedded-modal);
 `)])),Z(z("card",`
 background: var(--n-color-popover);
 `,[i("embedded",`
 background-color: var(--n-color-embedded-popover);
 `)]))]),F={title:[String,Function],contentClass:String,contentStyle:[Object,String],headerClass:String,headerStyle:[Object,String],headerExtraClass:String,headerExtraStyle:[Object,String],footerClass:String,footerStyle:[Object,String],embedded:Boolean,segmented:{type:[Boolean,Object],default:!1},size:{type:String,default:"medium"},bordered:{type:Boolean,default:!0},closable:Boolean,hoverable:Boolean,role:String,onClose:[Function,Array],tag:{type:String,default:"div"},cover:Function,content:[String,Function],footer:Function,action:Function,headerExtra:Function},uo=so(F),po=Object.assign(Object.assign({},_.props),F),xo=eo({name:"Card",props:po,slots:Object,setup(e){const u=()=>{const{onClose:t}=e;t&&io(t)},{inlineThemeDisabled:g,mergedClsPrefixRef:o,mergedRtlRef:c}=ro(e),b=_("Card","-card",fo,go,e,o),x=to("Card",c,o),f=E(()=>{const{size:t}=e,{self:{color:r,colorModal:l,colorTarget:C,textColor:p,titleTextColor:S,titleFontWeight:y,borderColor:k,actionColor:w,borderRadius:m,lineHeight:P,closeIconColor:T,closeIconColorHover:R,closeIconColorPressed:B,closeColorHover:O,closeColorPressed:M,closeBorderRadius:j,closeIconSize:H,closeSize:I,boxShadow:V,colorPopover:L,colorEmbedded:W,colorEmbeddedModal:K,colorEmbeddedPopover:N,[$("padding",t)]:A,[$("fontSize",t)]:D,[$("titleFontSize",t)]:G},common:{cubicBezierEaseInOut:q}}=b.value,{top:J,left:Q,bottom:U}=lo(A);return{"--n-bezier":q,"--n-border-radius":m,"--n-color":r,"--n-color-modal":l,"--n-color-popover":L,"--n-color-embedded":W,"--n-color-embedded-modal":K,"--n-color-embedded-popover":N,"--n-color-target":C,"--n-text-color":p,"--n-line-height":P,"--n-action-color":w,"--n-title-text-color":S,"--n-title-font-weight":y,"--n-close-icon-color":T,"--n-close-icon-color-hover":R,"--n-close-icon-color-pressed":B,"--n-close-color-hover":O,"--n-close-color-pressed":M,"--n-border-color":k,"--n-box-shadow":V,"--n-padding-top":J,"--n-padding-bottom":U,"--n-padding-left":Q,"--n-font-size":D,"--n-title-font-size":G,"--n-close-size":I,"--n-close-icon-size":H,"--n-close-border-radius":j}}),d=g?no("card",E(()=>e.size[0]),f,e):void 0;return{rtlEnabled:x,mergedClsPrefix:o,mergedTheme:b,handleCloseClick:u,cssVars:g?void 0:f,themeClass:d==null?void 0:d.themeClass,onRender:d==null?void 0:d.onRender}},render(){const{segmented:e,bordered:u,hoverable:g,mergedClsPrefix:o,rtlEnabled:c,onRender:b,embedded:x,tag:f,$slots:d}=this;return b==null||b(),s(f,{class:[`${o}-card`,this.themeClass,x&&`${o}-card--embedded`,{[`${o}-card--rtl`]:c,[`${o}-card--content${typeof e!="boolean"&&e.content==="soft"?"-soft":""}-segmented`]:e===!0||e!==!1&&e.content,[`${o}-card--footer${typeof e!="boolean"&&e.footer==="soft"?"-soft":""}-segmented`]:e===!0||e!==!1&&e.footer,[`${o}-card--action-segmented`]:e===!0||e!==!1&&e.action,[`${o}-card--bordered`]:u,[`${o}-card--hoverable`]:g}],style:this.cssVars,role:this.role},h(d.cover,t=>{const r=this.cover?v([this.cover()]):t;return r&&s("div",{class:`${o}-card-cover`,role:"none"},r)}),h(d.header,t=>{const{title:r}=this,l=r?v(typeof r=="function"?[r()]:[r]):t;return l||this.closable?s("div",{class:[`${o}-card-header`,this.headerClass],style:this.headerStyle,role:"heading"},s("div",{class:`${o}-card-header__main`,role:"heading"},l),h(d["header-extra"],C=>{const p=this.headerExtra?v([this.headerExtra()]):C;return p&&s("div",{class:[`${o}-card-header__extra`,this.headerExtraClass],style:this.headerExtraStyle},p)}),this.closable&&s(ao,{clsPrefix:o,class:`${o}-card-header__close`,onClick:this.handleCloseClick,absolute:!0})):null}),h(d.default,t=>{const{content:r}=this,l=r?v(typeof r=="function"?[r()]:[r]):t;return l&&s("div",{class:[`${o}-card__content`,this.contentClass],style:this.contentStyle,role:"none"},l)}),h(d.footer,t=>{const r=this.footer?v([this.footer()]):t;return r&&s("div",{class:[`${o}-card__footer`,this.footerClass],style:this.footerStyle,role:"none"},r)}),h(d.action,t=>{const r=this.action?v([this.action()]):t;return r&&s("div",{class:`${o}-card__action`,role:"none"},r)}))}});export{xo as _,F as a,uo as b,go as c};

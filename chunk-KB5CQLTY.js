import{F as h,H as n,K as b,L as P,M as N,P as C,Q as m,R as l,Ra as T,S,T as _,Ta as k,U as p,Ua as E,V as u,Va as O,W as y,Wa as A,X as i,Xa as j,Y as r,Za as $,aa as d,ba as I,ca as F,ja as f,la as c,ma as s,na as g,p as w,q as D,r as x}from"./chunk-S5N3PDNS.js";var H=["*"];var V=new D("MAT_CARD_CONFIG"),B=(()=>{class t{appearance;constructor(){let e=x(V,{optional:!0});this.appearance=e?.appearance||"raised"}static \u0275fac=function(o){return new(o||t)};static \u0275cmp=b({type:t,selectors:[["mat-card"]],hostAttrs:[1,"mat-mdc-card","mdc-card"],hostVars:8,hostBindings:function(o,v){o&2&&f("mat-mdc-card-outlined",v.appearance==="outlined")("mdc-card--outlined",v.appearance==="outlined")("mat-mdc-card-filled",v.appearance==="filled")("mdc-card--filled",v.appearance==="filled")},inputs:{appearance:"appearance"},exportAs:["matCard"],ngContentSelectors:H,decls:1,vars:0,template:function(o,v){o&1&&(I(),F(0))},styles:[`.mat-mdc-card {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  position: relative;
  border-style: solid;
  border-width: 0;
  background-color: var(--%NS%mat-card-elevated-container-color, var(--%NS%mat-sys-surface-container-low));
  border-color: var(--%NS%mat-card-elevated-container-color, var(--%NS%mat-sys-surface-container-low));
  border-radius: var(--%NS%mat-card-elevated-container-shape, var(--%NS%mat-sys-corner-medium));
  box-shadow: var(--%NS%mat-card-elevated-container-elevation, var(--%NS%mat-sys-level1));
}
.mat-mdc-card::after {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: solid 1px transparent;
  content: "";
  display: block;
  pointer-events: none;
  box-sizing: border-box;
  border-radius: var(--%NS%mat-card-elevated-container-shape, var(--%NS%mat-sys-corner-medium));
}

.mat-mdc-card-outlined {
  background-color: var(--%NS%mat-card-outlined-container-color, var(--%NS%mat-sys-surface));
  border-radius: var(--%NS%mat-card-outlined-container-shape, var(--%NS%mat-sys-corner-medium));
  border-width: var(--%NS%mat-card-outlined-outline-width, 1px);
  border-color: var(--%NS%mat-card-outlined-outline-color, var(--%NS%mat-sys-outline-variant));
  box-shadow: var(--%NS%mat-card-outlined-container-elevation, var(--%NS%mat-sys-level0));
}
.mat-mdc-card-outlined::after {
  border: none;
}

.mat-mdc-card-filled {
  background-color: var(--%NS%mat-card-filled-container-color, var(--%NS%mat-sys-surface-container-highest));
  border-radius: var(--%NS%mat-card-filled-container-shape, var(--%NS%mat-sys-corner-medium));
  box-shadow: var(--%NS%mat-card-filled-container-elevation, var(--%NS%mat-sys-level0));
}

.mdc-card__media {
  position: relative;
  box-sizing: border-box;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}
.mdc-card__media::before {
  display: block;
  content: "";
}
.mdc-card__media:first-child {
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
}
.mdc-card__media:last-child {
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: inherit;
}

.mat-mdc-card-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  box-sizing: border-box;
  min-height: 52px;
  padding: 8px;
}

.mat-mdc-card-title {
  font-family: var(--%NS%mat-card-title-text-font, var(--%NS%mat-sys-title-large-font));
  line-height: var(--%NS%mat-card-title-text-line-height, var(--%NS%mat-sys-title-large-line-height));
  font-size: var(--%NS%mat-card-title-text-size, var(--%NS%mat-sys-title-large-size));
  letter-spacing: var(--%NS%mat-card-title-text-tracking, var(--%NS%mat-sys-title-large-tracking));
  font-weight: var(--%NS%mat-card-title-text-weight, var(--%NS%mat-sys-title-large-weight));
}

.mat-mdc-card-subtitle {
  color: var(--%NS%mat-card-subtitle-text-color, var(--%NS%mat-sys-on-surface));
  font-family: var(--%NS%mat-card-subtitle-text-font, var(--%NS%mat-sys-title-medium-font));
  line-height: var(--%NS%mat-card-subtitle-text-line-height, var(--%NS%mat-sys-title-medium-line-height));
  font-size: var(--%NS%mat-card-subtitle-text-size, var(--%NS%mat-sys-title-medium-size));
  letter-spacing: var(--%NS%mat-card-subtitle-text-tracking, var(--%NS%mat-sys-title-medium-tracking));
  font-weight: var(--%NS%mat-card-subtitle-text-weight, var(--%NS%mat-sys-title-medium-weight));
}

.mat-mdc-card-title,
.mat-mdc-card-subtitle {
  display: block;
  margin: 0;
}
.mat-mdc-card-avatar ~ .mat-mdc-card-header-text .mat-mdc-card-title,
.mat-mdc-card-avatar ~ .mat-mdc-card-header-text .mat-mdc-card-subtitle {
  padding: 16px 16px 0;
}

.mat-mdc-card-header {
  display: flex;
  padding: 16px 16px 0;
}

.mat-mdc-card-content {
  display: block;
  padding: 0 16px;
}
.mat-mdc-card-content:first-child {
  padding-top: 16px;
}
.mat-mdc-card-content:last-child {
  padding-bottom: 16px;
}

.mat-mdc-card-title-group {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.mat-mdc-card-avatar {
  height: 40px;
  width: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-bottom: 16px;
  object-fit: cover;
}
.mat-mdc-card-avatar ~ .mat-mdc-card-header-text .mat-mdc-card-subtitle,
.mat-mdc-card-avatar ~ .mat-mdc-card-header-text .mat-mdc-card-title {
  line-height: normal;
}

.mat-mdc-card-sm-image {
  width: 80px;
  height: 80px;
}

.mat-mdc-card-md-image {
  width: 112px;
  height: 112px;
}

.mat-mdc-card-lg-image {
  width: 152px;
  height: 152px;
}

.mat-mdc-card-xl-image {
  width: 240px;
  height: 240px;
}

.mat-mdc-card-subtitle ~ .mat-mdc-card-title,
.mat-mdc-card-title ~ .mat-mdc-card-subtitle,
.mat-mdc-card-header .mat-mdc-card-header-text .mat-mdc-card-title,
.mat-mdc-card-header .mat-mdc-card-header-text .mat-mdc-card-subtitle,
.mat-mdc-card-title-group .mat-mdc-card-title,
.mat-mdc-card-title-group .mat-mdc-card-subtitle {
  padding-top: 0;
}

.mat-mdc-card-content > :last-child:not(.mat-mdc-card-footer) {
  margin-bottom: 0;
}

.mat-mdc-card-actions-align-end {
  justify-content: flex-end;
}
`],encapsulation:2})}return t})();var z=(()=>{class t{static \u0275fac=function(o){return new(o||t)};static \u0275dir=N({type:t,selectors:[["mat-card-content"]],hostAttrs:[1,"mat-mdc-card-content"]})}return t})();var L=(()=>{class t{static \u0275fac=function(o){return new(o||t)};static \u0275mod=P({type:t});static \u0275inj=w({imports:[T]})}return t})();var U=(t,a)=>a.title,M=(t,a)=>a.label;function q(t,a){if(t&1&&(i(0,"a",11),c(1),i(2,"mat-icon",12),c(3,"arrow_forward"),r()()),t&2){let e=d().$implicit;f("primary-action",e.primary),y("matButton",e.primary?"filled":"outlined")("routerLink",e.route),n(),g(" ",e.label," ")}}function J(t,a){if(t&1&&(i(0,"a",13),c(1),i(2,"mat-icon",12),c(3,"open_in_new"),r()()),t&2){let e=d().$implicit;f("primary-action",e.primary),y("matButton",e.primary?"filled":"outlined")("href",e.href,h),C("aria-label",e.label+" (opens in a new tab)"),n(),g(" ",e.label," ")}}function K(t,a){if(t&1&&m(0,q,4,5,"a",9)(1,J,4,6,"a",10),t&2){let e=a.$implicit;l(e.route?0:1)}}function Q(t,a){if(t&1&&(i(0,"div",4),p(1,K,2,1,null,null,M),r()),t&2){let e=d();n(),u(e.content.actions)}}function W(t,a){if(t&1&&(i(0,"div")(1,"dt"),c(2),r(),i(3,"dd"),c(4),r()()),t&2){let e=a.$implicit;n(2),s(e.label),n(2),s(e.value)}}function Y(t,a){if(t&1&&(i(0,"mat-card",6)(1,"mat-card-content",14)(2,"dl",15),p(3,W,5,2,"div",null,M),r()()()),t&2){let e=d();n(3),u(e.content.facts)}}function Z(t,a){if(t&1&&(i(0,"p",19),c(1),r()),t&2){let e=d().$implicit;n(),g(" ",e.eyebrow," ")}}function tt(t,a){if(t&1&&(i(0,"p",20),c(1),r()),t&2){let e=a.$implicit;n(),s(e)}}function et(t,a){if(t&1&&(i(0,"li",20),c(1),r()),t&2){let e=a.$implicit;n(),s(e)}}function at(t,a){if(t&1&&(i(0,"ul"),p(1,et,2,1,"li",20,_),r()),t&2){let e=d().$implicit;n(),u(e.items)}}function nt(t,a){if(t&1&&(i(0,"li",20),c(1),r()),t&2){let e=a.$implicit;n(),s(e)}}function it(t,a){if(t&1&&(i(0,"ol"),p(1,nt,2,1,"li",20,_),r()),t&2){let e=d().$implicit;n(),u(e.steps)}}function rt(t,a){if(t&1&&(i(0,"th",23),c(1),r()),t&2){let e=a.$implicit;n(),s(e)}}function ot(t,a){if(t&1&&(i(0,"td"),c(1),r()),t&2){let e=a.$implicit;n(),s(e)}}function ct(t,a){if(t&1&&(i(0,"tr"),p(1,ot,2,1,"td",null,S),r()),t&2){let e=a.$implicit;n(),u(e)}}function dt(t,a){if(t&1&&(i(0,"div",21)(1,"table")(2,"caption"),c(3),r(),i(4,"thead")(5,"tr"),p(6,rt,2,1,"th",23,_),r()(),i(8,"tbody"),p(9,ct,3,0,"tr",null,S),r()()()),t&2){let e=a;C("aria-label",e.caption),n(3),g(" ",e.caption," "),n(3),u(e.columns),n(3),u(e.rows)}}function mt(t,a){if(t&1&&(i(0,"pre")(1,"code"),c(2),r()()),t&2){let e=d().$implicit;n(2),s(e.code)}}function lt(t,a){if(t&1&&(i(0,"aside")(1,"mat-icon",12),c(2,"info"),r(),i(3,"div")(4,"strong"),c(5,"Good to know"),r(),i(6,"span"),c(7),r()()()),t&2){let e=d().$implicit;n(7),s(e.note)}}function st(t,a){if(t&1&&(i(0,"a",24),c(1),i(2,"mat-icon",12),c(3,"arrow_forward"),r()()),t&2){let e=d().$implicit;y("routerLink",e.route),n(),g(" ",e.label," ")}}function pt(t,a){if(t&1&&(i(0,"a",25),c(1),i(2,"mat-icon",12),c(3,"open_in_new"),r()()),t&2){let e=d().$implicit;y("href",e.href,h),C("aria-label",e.label+" (opens in a new tab)"),n(),g(" ",e.label," ")}}function ut(t,a){if(t&1&&m(0,st,4,2,"a",24)(1,pt,4,3,"a",25),t&2){let e=a.$implicit;l(e.route?0:1)}}function gt(t,a){if(t&1&&(i(0,"div",22),p(1,ut,2,1,null,null,M),r()),t&2){let e=d().$implicit;n(),u(e.actions)}}function ft(t,a){if(t&1&&(i(0,"mat-card",16)(1,"mat-card-content",17)(2,"section",18),m(3,Z,2,1,"p",19),i(4,"h2"),c(5),r(),p(6,tt,2,1,"p",20,_),m(8,at,3,0,"ul"),m(9,it,3,0,"ol"),m(10,dt,11,2,"div",21),m(11,mt,3,1,"pre"),m(12,lt,8,1,"aside"),m(13,gt,3,0,"div",22),r()()()),t&2){let e,o=a.$implicit;f("col-span-full",o.wide),n(3),l(o.eyebrow?3:-1),n(2),s(o.title),n(),u(o.paragraphs),n(2),l(o.items?.length?8:-1),n(),l(o.steps?.length?9:-1),n(),l((e=o.table)?10:-1,e),n(),l(o.code?11:-1),n(),l(o.note?12:-1),n(),l(o.actions?.length?13:-1)}}var R=class t{content=x(j).snapshot.data.content;static \u0275fac=function(e){return new(e||t)};static \u0275cmp=b({type:t,selectors:[["app-documentation-page"]],decls:15,vars:5,consts:[[1,"border-b","border-outline-variant","text-on-primary-container"],[1,"mx-auto","max-w-360","px-docs-inline","py-hero-block"],[1,"m-0","text-xs","font-bold","tracking-eyebrow","text-primary","uppercase"],[1,"m-0","max-w-192","text-summary","leading-summary","text-on-primary-container"],["aria-label","Page actions",1,"mt-6","flex","flex-wrap","items-center","gap-3"],[1,"mx-auto","max-w-360","px-docs-inline","pt-8","pb-20","max-mobile:pb-12"],["appearance","outlined",1,"bg-surface-container-lowest"],[1,"mt-5","grid","grid-cols-sections","gap-5"],["appearance","outlined",1,"min-w-0","bg-surface-container-lowest",3,"col-span-full"],[1,"max-mobile:w-full","max-mobile:justify-between",3,"matButton","primary-action","routerLink"],["target","_blank","rel","noopener noreferrer",1,"max-mobile:w-full","max-mobile:justify-between",3,"matButton","primary-action","href"],[1,"max-mobile:w-full","max-mobile:justify-between",3,"matButton","routerLink"],["aria-hidden","true"],["target","_blank","rel","noopener noreferrer",1,"max-mobile:w-full","max-mobile:justify-between",3,"matButton","href"],[1,"p-0!"],["aria-label","At a glance",1,"m-0","grid","grid-cols-facts","overflow-hidden","max-mobile:grid-cols-1"],["appearance","outlined",1,"min-w-0","bg-surface-container-lowest"],[1,"p-docs-card"],[1,"min-w-0"],[1,"mb-3","text-xs","font-bold","tracking-eyebrow","text-primary","uppercase"],[1,"leading-summary","text-on-surface-variant"],["role","region","tabindex","0",1,"mt-5","overflow-x-auto"],[1,"mt-section-actions","flex","flex-wrap","items-center","gap-3"],["scope","col"],["matButton","",1,"text-primary",3,"routerLink"],["matButton","","target","_blank","rel","noopener noreferrer",1,"text-primary",3,"href"]],template:function(e,o){e&1&&(i(0,"article")(1,"header",0)(2,"div",1)(3,"p",2),c(4),r(),i(5,"h1"),c(6),r(),i(7,"p",3),c(8),r(),m(9,Q,3,0,"div",4),r()(),i(10,"div",5),m(11,Y,5,0,"mat-card",6),i(12,"div",7),p(13,ft,14,10,"mat-card",8,U),r()()()),e&2&&(n(4),g(" ",o.content.eyebrow," "),n(2),s(o.content.title),n(2),g(" ",o.content.summary," "),n(),l(o.content.actions?.length?9:-1),n(2),l(o.content.facts?.length?11:-1),n(2),u(o.content.sections))},dependencies:[E,k,L,B,z,A,O,$],styles:["article[_ngcontent-%COMP%] > header[_ngcontent-%COMP%]{background:radial-gradient(circle at top right,color-mix(in srgb,var(--%NS%mat-sys-tertiary) 22%,transparent),transparent 32rem),var(--%NS%mat-sys-primary-container)}h1[_ngcontent-%COMP%]{max-width:58rem;margin:.45rem 0 1rem;font-size:clamp(2.25rem,5vw,4rem);letter-spacing:-.04em;line-height:1.05;text-wrap:balance}dl[_ngcontent-%COMP%]   div[_ngcontent-%COMP%]{padding:1.25rem 1.5rem}dl[_ngcontent-%COMP%]   div[_ngcontent-%COMP%] + div[_ngcontent-%COMP%]{border-left:1px solid var(--%NS%mat-sys-outline-variant)}dl[_ngcontent-%COMP%]   dt[_ngcontent-%COMP%]{margin-bottom:.35rem;color:var(--%NS%mat-sys-primary);font-size:.75rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase}dl[_ngcontent-%COMP%]   dd[_ngcontent-%COMP%]{margin:0;font-size:1.05rem;font-weight:700}h2[_ngcontent-%COMP%]{margin:0;font-size:1.35rem;letter-spacing:-.02em}ul[_ngcontent-%COMP%], ol[_ngcontent-%COMP%]{margin:1.15rem 0 0;padding-left:1.4rem}li[_ngcontent-%COMP%]{padding-left:.25rem}li[_ngcontent-%COMP%] + li[_ngcontent-%COMP%]{margin-top:.65rem}li[_ngcontent-%COMP%]::marker{color:var(--%NS%mat-sys-primary);font-weight:700}table[_ngcontent-%COMP%]{width:100%;min-width:42rem;border-collapse:collapse;line-height:1.5}caption[_ngcontent-%COMP%]{padding-bottom:.75rem;color:var(--%NS%mat-sys-on-surface);font-size:1rem;font-weight:700;text-align:left}th[_ngcontent-%COMP%], td[_ngcontent-%COMP%]{border:1px solid var(--%NS%mat-sys-outline-variant);padding:.85rem;text-align:left;vertical-align:top}th[_ngcontent-%COMP%]{background:var(--%NS%mat-sys-surface-container);color:var(--%NS%mat-sys-on-surface)}td[_ngcontent-%COMP%]{color:var(--%NS%mat-sys-on-surface-variant)}tbody[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]:nth-child(2n){background:var(--%NS%mat-sys-surface-container-low)}pre[_ngcontent-%COMP%]{overflow-x:auto;margin:1.25rem 0 0;border-radius:.75rem;padding:1rem;background:var(--%NS%mat-sys-inverse-surface);color:var(--%NS%mat-sys-inverse-on-surface);line-height:1.6}aside[_ngcontent-%COMP%]{display:flex;gap:.75rem;margin-top:1.25rem;border-left:.25rem solid var(--%NS%mat-sys-tertiary);border-radius:.25rem .75rem .75rem .25rem;padding:1rem;background:var(--%NS%mat-sys-tertiary-container);color:var(--%NS%mat-sys-on-tertiary-container);line-height:1.65}aside[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{flex:0 0 auto}aside[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%], aside[_ngcontent-%COMP%]   span[_ngcontent-%COMP%]{display:block}@media(width<=620px){dl[_ngcontent-%COMP%]   div[_ngcontent-%COMP%] + div[_ngcontent-%COMP%]{border-top:1px solid var(--%NS%mat-sys-outline-variant);border-left:0}}"]})};export{R as DocumentationPage};

import{F as h,H as a,K as b,L as O,M as I,P as x,Q as l,R as s,Ra as T,S as M,T as v,Ta as k,U as p,Ua as E,V as g,Va as A,W as y,Wa as $,X as i,Xa as B,Y as r,Za as j,aa as m,ba as S,ca as F,ja as u,la as c,ma as d,na as f,p as w,q as D,r as C}from"./chunk-QNMCYWMW.js";var H=["*"];var V=new D("MAT_CARD_CONFIG"),z=(()=>{class t{appearance;constructor(){let e=C(V,{optional:!0});this.appearance=e?.appearance||"raised"}static \u0275fac=function(o){return new(o||t)};static \u0275cmp=b({type:t,selectors:[["mat-card"]],hostAttrs:[1,"mat-mdc-card","mdc-card"],hostVars:8,hostBindings:function(o,_){o&2&&u("mat-mdc-card-outlined",_.appearance==="outlined")("mdc-card--outlined",_.appearance==="outlined")("mat-mdc-card-filled",_.appearance==="filled")("mdc-card--filled",_.appearance==="filled")},inputs:{appearance:"appearance"},exportAs:["matCard"],ngContentSelectors:H,decls:1,vars:0,template:function(o,_){o&1&&(S(),F(0))},styles:[`.mat-mdc-card {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  position: relative;
  border-style: solid;
  border-width: 0;
  background-color: var(--mat-card-elevated-container-color, var(--mat-sys-surface-container-low));
  border-color: var(--mat-card-elevated-container-color, var(--mat-sys-surface-container-low));
  border-radius: var(--mat-card-elevated-container-shape, var(--mat-sys-corner-medium));
  box-shadow: var(--mat-card-elevated-container-elevation, var(--mat-sys-level1));
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
  border-radius: var(--mat-card-elevated-container-shape, var(--mat-sys-corner-medium));
}

.mat-mdc-card-outlined {
  background-color: var(--mat-card-outlined-container-color, var(--mat-sys-surface));
  border-radius: var(--mat-card-outlined-container-shape, var(--mat-sys-corner-medium));
  border-width: var(--mat-card-outlined-outline-width, 1px);
  border-color: var(--mat-card-outlined-outline-color, var(--mat-sys-outline-variant));
  box-shadow: var(--mat-card-outlined-container-elevation, var(--mat-sys-level0));
}
.mat-mdc-card-outlined::after {
  border: none;
}

.mat-mdc-card-filled {
  background-color: var(--mat-card-filled-container-color, var(--mat-sys-surface-container-highest));
  border-radius: var(--mat-card-filled-container-shape, var(--mat-sys-corner-medium));
  box-shadow: var(--mat-card-filled-container-elevation, var(--mat-sys-level0));
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
  font-family: var(--mat-card-title-text-font, var(--mat-sys-title-large-font));
  line-height: var(--mat-card-title-text-line-height, var(--mat-sys-title-large-line-height));
  font-size: var(--mat-card-title-text-size, var(--mat-sys-title-large-size));
  letter-spacing: var(--mat-card-title-text-tracking, var(--mat-sys-title-large-tracking));
  font-weight: var(--mat-card-title-text-weight, var(--mat-sys-title-large-weight));
}

.mat-mdc-card-subtitle {
  color: var(--mat-card-subtitle-text-color, var(--mat-sys-on-surface));
  font-family: var(--mat-card-subtitle-text-font, var(--mat-sys-title-medium-font));
  line-height: var(--mat-card-subtitle-text-line-height, var(--mat-sys-title-medium-line-height));
  font-size: var(--mat-card-subtitle-text-size, var(--mat-sys-title-medium-size));
  letter-spacing: var(--mat-card-subtitle-text-tracking, var(--mat-sys-title-medium-tracking));
  font-weight: var(--mat-card-subtitle-text-weight, var(--mat-sys-title-medium-weight));
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
`],encapsulation:2})}return t})();var L=(()=>{class t{static \u0275fac=function(o){return new(o||t)};static \u0275dir=I({type:t,selectors:[["mat-card-content"]],hostAttrs:[1,"mat-mdc-card-content"]})}return t})();var N=(()=>{class t{static \u0275fac=function(o){return new(o||t)};static \u0275mod=O({type:t});static \u0275inj=w({imports:[T]})}return t})();var U=(t,n)=>n.title,P=(t,n)=>n.label;function q(t,n){if(t&1&&(i(0,"a",11),c(1),i(2,"mat-icon",12),c(3,"arrow_forward"),r()()),t&2){let e=m().$implicit;u("primary-action",e.primary),y("matButton",e.primary?"filled":"outlined")("routerLink",e.route),a(),f(" ",e.label," ")}}function J(t,n){if(t&1&&(i(0,"a",13),c(1),i(2,"mat-icon",12),c(3,"open_in_new"),r()()),t&2){let e=m().$implicit;u("primary-action",e.primary),y("matButton",e.primary?"filled":"outlined")("href",e.href,h),x("aria-label",e.label+" (opens in a new tab)"),a(),f(" ",e.label," ")}}function K(t,n){if(t&1&&l(0,q,4,5,"a",9)(1,J,4,6,"a",10),t&2){let e=n.$implicit;s(e.route?0:1)}}function Q(t,n){if(t&1&&(i(0,"div",4),p(1,K,2,1,null,null,P),r()),t&2){let e=m();a(),g(e.content.actions)}}function W(t,n){if(t&1&&(i(0,"div")(1,"dt"),c(2),r(),i(3,"dd"),c(4),r()()),t&2){let e=n.$implicit;a(2),d(e.label),a(2),d(e.value)}}function Y(t,n){if(t&1&&(i(0,"mat-card",6)(1,"mat-card-content")(2,"dl",14),p(3,W,5,2,"div",null,P),r()()()),t&2){let e=m();a(3),g(e.content.facts)}}function Z(t,n){if(t&1&&(i(0,"p",16),c(1),r()),t&2){let e=m().$implicit;a(),d(e.eyebrow)}}function tt(t,n){if(t&1&&(i(0,"p"),c(1),r()),t&2){let e=n.$implicit;a(),d(e)}}function et(t,n){if(t&1&&(i(0,"li"),c(1),r()),t&2){let e=n.$implicit;a(),d(e)}}function nt(t,n){if(t&1&&(i(0,"ul"),p(1,et,2,1,"li",null,v),r()),t&2){let e=m().$implicit;a(),g(e.items)}}function at(t,n){if(t&1&&(i(0,"li"),c(1),r()),t&2){let e=n.$implicit;a(),d(e)}}function it(t,n){if(t&1&&(i(0,"ol"),p(1,at,2,1,"li",null,v),r()),t&2){let e=m().$implicit;a(),g(e.steps)}}function rt(t,n){if(t&1&&(i(0,"th",19),c(1),r()),t&2){let e=n.$implicit;a(),d(e)}}function ot(t,n){if(t&1&&(i(0,"td"),c(1),r()),t&2){let e=n.$implicit;a(),d(e)}}function ct(t,n){if(t&1&&(i(0,"tr"),p(1,ot,2,1,"td",null,M),r()),t&2){let e=n.$implicit;a(),g(e)}}function dt(t,n){if(t&1&&(i(0,"div",17)(1,"table")(2,"caption"),c(3),r(),i(4,"thead")(5,"tr"),p(6,rt,2,1,"th",19,v),r()(),i(8,"tbody"),p(9,ct,3,0,"tr",null,M),r()()()),t&2){let e=n;x("aria-label",e.caption),a(3),f(" ",e.caption," "),a(3),g(e.columns),a(3),g(e.rows)}}function mt(t,n){if(t&1&&(i(0,"pre")(1,"code"),c(2),r()()),t&2){let e=m().$implicit;a(2),d(e.code)}}function lt(t,n){if(t&1&&(i(0,"aside")(1,"mat-icon",12),c(2,"info"),r(),i(3,"div")(4,"strong"),c(5,"Good to know"),r(),i(6,"span"),c(7),r()()()),t&2){let e=m().$implicit;a(7),d(e.note)}}function st(t,n){if(t&1&&(i(0,"a",20),c(1),i(2,"mat-icon",12),c(3,"arrow_forward"),r()()),t&2){let e=m().$implicit;y("routerLink",e.route),a(),f(" ",e.label," ")}}function pt(t,n){if(t&1&&(i(0,"a",21),c(1),i(2,"mat-icon",12),c(3,"open_in_new"),r()()),t&2){let e=m().$implicit;y("href",e.href,h),x("aria-label",e.label+" (opens in a new tab)"),a(),f(" ",e.label," ")}}function gt(t,n){if(t&1&&l(0,st,4,2,"a",20)(1,pt,4,3,"a",21),t&2){let e=n.$implicit;s(e.route?0:1)}}function ut(t,n){if(t&1&&(i(0,"div",18),p(1,gt,2,1,null,null,P),r()),t&2){let e=m().$implicit;a(),g(e.actions)}}function ft(t,n){if(t&1&&(i(0,"mat-card",15)(1,"mat-card-content")(2,"section"),l(3,Z,2,1,"p",16),i(4,"h2"),c(5),r(),p(6,tt,2,1,"p",null,v),l(8,nt,3,0,"ul"),l(9,it,3,0,"ol"),l(10,dt,11,2,"div",17),l(11,mt,3,1,"pre"),l(12,lt,8,1,"aside"),l(13,ut,3,0,"div",18),r()()()),t&2){let e,o=n.$implicit;u("wide",o.wide),a(3),s(o.eyebrow?3:-1),a(2),d(o.title),a(),g(o.paragraphs),a(2),s(o.items?.length?8:-1),a(),s(o.steps?.length?9:-1),a(),s((e=o.table)?10:-1,e),a(),s(o.code?11:-1),a(),s(o.note?12:-1),a(),s(o.actions?.length?13:-1)}}var R=class t{content=C(B).snapshot.data.content;static \u0275fac=function(e){return new(e||t)};static \u0275cmp=b({type:t,selectors:[["app-documentation-page"]],decls:15,vars:5,consts:[[1,"hero"],[1,"hero-content"],[1,"eyebrow"],[1,"summary"],["aria-label","Page actions",1,"actions"],[1,"page-content"],["appearance","outlined",1,"facts-card"],[1,"sections"],["appearance","outlined",1,"documentation-card",3,"wide"],[3,"matButton","primary-action","routerLink"],["target","_blank","rel","noopener noreferrer",3,"matButton","primary-action","href"],[3,"matButton","routerLink"],["aria-hidden","true"],["target","_blank","rel","noopener noreferrer",3,"matButton","href"],["aria-label","At a glance",1,"facts"],["appearance","outlined",1,"documentation-card"],[1,"section-eyebrow"],["role","region","tabindex","0",1,"table-scroll"],[1,"section-actions"],["scope","col"],["matButton","",3,"routerLink"],["matButton","","target","_blank","rel","noopener noreferrer",3,"href"]],template:function(e,o){e&1&&(i(0,"article")(1,"header",0)(2,"div",1)(3,"p",2),c(4),r(),i(5,"h1"),c(6),r(),i(7,"p",3),c(8),r(),l(9,Q,3,0,"div",4),r()(),i(10,"div",5),l(11,Y,5,0,"mat-card",6),i(12,"div",7),p(13,ft,14,10,"mat-card",8,U),r()()()),e&2&&(a(4),d(o.content.eyebrow),a(2),d(o.content.title),a(2),d(o.content.summary),a(),s(o.content.actions?.length?9:-1),a(2),s(o.content.facts?.length?11:-1),a(2),g(o.content.sections))},dependencies:[E,k,N,z,L,$,A,j],styles:[".hero[_ngcontent-%COMP%]{border-bottom:1px solid var(--mat-sys-outline-variant);background:radial-gradient(circle at top right,color-mix(in srgb,var(--mat-sys-tertiary) 22%,transparent),transparent 32rem),var(--mat-sys-primary-container);color:var(--mat-sys-on-primary-container)}.hero-content[_ngcontent-%COMP%], .page-content[_ngcontent-%COMP%]{max-width:90rem;margin:0 auto;padding-right:clamp(1rem,5vw,4rem);padding-left:clamp(1rem,5vw,4rem)}.hero-content[_ngcontent-%COMP%]{padding-top:clamp(2.5rem,7vw,5rem);padding-bottom:clamp(2.5rem,7vw,5rem)}.eyebrow[_ngcontent-%COMP%], .section-eyebrow[_ngcontent-%COMP%]{font-size:.75rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase}.eyebrow[_ngcontent-%COMP%]{margin:0;color:var(--mat-sys-primary)}h1[_ngcontent-%COMP%]{max-width:58rem;margin:.45rem 0 1rem;font-size:clamp(2.25rem,5vw,4rem);letter-spacing:-.04em;line-height:1.05;text-wrap:balance}.summary[_ngcontent-%COMP%]{max-width:48rem;margin:0;color:var(--mat-sys-on-primary-container);font-size:1.08rem;line-height:1.7}.actions[_ngcontent-%COMP%], .section-actions[_ngcontent-%COMP%]{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem}.actions[_ngcontent-%COMP%]{margin-top:1.5rem}.page-content[_ngcontent-%COMP%]{padding-top:2rem;padding-bottom:5rem}.facts-card[_ngcontent-%COMP%], .documentation-card[_ngcontent-%COMP%]{background:var(--mat-sys-surface-container-lowest)}.facts-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%]{padding:0}.facts[_ngcontent-%COMP%]{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));margin:0;overflow:hidden}.facts[_ngcontent-%COMP%]   div[_ngcontent-%COMP%]{padding:1.25rem 1.5rem}.facts[_ngcontent-%COMP%]   div[_ngcontent-%COMP%] + div[_ngcontent-%COMP%]{border-left:1px solid var(--mat-sys-outline-variant)}.facts[_ngcontent-%COMP%]   dt[_ngcontent-%COMP%]{margin-bottom:.35rem;color:var(--mat-sys-primary);font-size:.75rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase}.facts[_ngcontent-%COMP%]   dd[_ngcontent-%COMP%]{margin:0;font-size:1.05rem;font-weight:700}.sections[_ngcontent-%COMP%]{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,21rem),1fr));gap:1.25rem;margin-top:1.25rem}.documentation-card[_ngcontent-%COMP%]{min-width:0}.documentation-card.wide[_ngcontent-%COMP%]{grid-column:1 / -1}.documentation-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%]{padding:clamp(1.25rem,3vw,2rem)}.documentation-card[_ngcontent-%COMP%]   section[_ngcontent-%COMP%]{min-width:0}.section-eyebrow[_ngcontent-%COMP%]{margin:0 0 .75rem;color:var(--mat-sys-primary)}h2[_ngcontent-%COMP%]{margin:0;font-size:1.35rem;letter-spacing:-.02em}.documentation-card[_ngcontent-%COMP%]   section[_ngcontent-%COMP%] > p[_ngcontent-%COMP%]:not(.section-eyebrow), .documentation-card[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]{color:var(--mat-sys-on-surface-variant);line-height:1.7}ul[_ngcontent-%COMP%], ol[_ngcontent-%COMP%]{margin:1.15rem 0 0;padding-left:1.4rem}li[_ngcontent-%COMP%]{padding-left:.25rem}li[_ngcontent-%COMP%] + li[_ngcontent-%COMP%]{margin-top:.65rem}li[_ngcontent-%COMP%]::marker{color:var(--mat-sys-primary);font-weight:700}.table-scroll[_ngcontent-%COMP%]{margin-top:1.25rem;overflow-x:auto}table[_ngcontent-%COMP%]{width:100%;min-width:42rem;border-collapse:collapse;line-height:1.5}caption[_ngcontent-%COMP%]{padding-bottom:.75rem;color:var(--mat-sys-on-surface);font-size:1rem;font-weight:700;text-align:left}th[_ngcontent-%COMP%], td[_ngcontent-%COMP%]{border:1px solid var(--mat-sys-outline-variant);padding:.85rem;text-align:left;vertical-align:top}th[_ngcontent-%COMP%]{background:var(--mat-sys-surface-container);color:var(--mat-sys-on-surface)}td[_ngcontent-%COMP%]{color:var(--mat-sys-on-surface-variant)}tbody[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]:nth-child(2n){background:var(--mat-sys-surface-container-low)}pre[_ngcontent-%COMP%]{overflow-x:auto;margin:1.25rem 0 0;border-radius:.75rem;padding:1rem;background:var(--mat-sys-inverse-surface);color:var(--mat-sys-inverse-on-surface);line-height:1.6}aside[_ngcontent-%COMP%]{display:flex;gap:.75rem;margin-top:1.25rem;border-left:.25rem solid var(--mat-sys-tertiary);border-radius:.25rem .75rem .75rem .25rem;padding:1rem;background:var(--mat-sys-tertiary-container);color:var(--mat-sys-on-tertiary-container);line-height:1.65}aside[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{flex:0 0 auto}aside[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%], aside[_ngcontent-%COMP%]   span[_ngcontent-%COMP%]{display:block}.section-actions[_ngcontent-%COMP%]{margin-top:1.35rem}.section-actions[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]{color:var(--mat-sys-primary)}@media(max-width:620px){.actions[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]{justify-content:space-between;width:100%}.facts[_ngcontent-%COMP%]{grid-template-columns:1fr}.facts[_ngcontent-%COMP%]   div[_ngcontent-%COMP%] + div[_ngcontent-%COMP%]{border-top:1px solid var(--mat-sys-outline-variant);border-left:0}.page-content[_ngcontent-%COMP%]{padding-bottom:3rem}}"]})};export{R as DocumentationPage};

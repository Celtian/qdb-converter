import{$ as F,$a as Se,A as C,Aa as ae,B as N,Ba as re,C as Dt,Ca as oe,D as v,Da as se,E as Ht,Ea as le,F as Q,Fa as ce,G as gt,Ga as de,H as m,Ha as it,I as Mt,Ia as me,J as U,Ja as nt,K as g,Ka as ft,L as k,La as y,M as _,Ma as he,N as Gt,Na as pe,O as D,Oa as ue,P as M,Pa as ge,Q as z,Qa as _t,R as B,Ra as T,Sa as fe,Ta as _e,U as qt,Ua as be,V as Zt,Va as ve,W as O,Wa as we,X as s,Y as c,Ya as ye,Z as Y,Za as xe,_ as X,_a as ke,a as xt,aa as E,b as Vt,ba as w,c as b,ca as d,d as jt,da as P,e as ot,ea as J,f as ht,fa as h,g as j,ga as p,h as kt,ha as It,i as Wt,ia as lt,j as St,ja as f,k as Ct,ka as $t,l as Qt,la as u,m as pt,ma as Rt,n as S,na as Kt,o as Nt,oa as Yt,p as x,pa as L,q as A,qa as Xt,r,ra as ct,s as Z,sa as tt,t as $,ta as Jt,u as W,ua as te,v as K,va as ee,w as ut,wa as I,x as st,xa as ie,y as R,ya as et,z as Ut,za as ne}from"./chunk-S5N3PDNS.js";function Ce(i,l){let e=!l?.manualCleanup?l?.injector?.get(ut)??r(ut):null,n=$e(l?.equal),a;l?.requireSync?a=C({kind:0},{equal:n}):a=C({kind:1,value:l?.initialValue},{equal:n});let o,q=i.subscribe({next:V=>a.set({kind:1,value:V}),error:V=>{a.set({kind:2,error:V}),o?.()},complete:()=>{o?.()}});if(l?.requireSync&&a().kind===0)throw new Nt(601,!1);return o=e?.onDestroy(q.unsubscribe.bind(q)),ct(()=>{let V=a();switch(V.kind){case 1:return V.value;case 2:throw V.error;case 0:throw new Nt(601,!1)}},{equal:l?.equal})}function $e(i=Object.is){return(l,t)=>l.kind===1&&t.kind===1&&i(l.value,t.value)}var Ne=(()=>{class i{static \u0275fac=function(e){return new(e||i)};static \u0275mod=k({type:i});static \u0275inj=x({imports:[T]})}return i})();var De=(()=>{class i{static \u0275fac=function(e){return new(e||i)};static \u0275mod=k({type:i});static \u0275inj=x({imports:[T]})}return i})();var Xe=["*"],Je=`.mdc-list {
  margin: 0;
  padding: 8px 0;
  list-style-type: none;
}
.mdc-list:focus {
  outline: none;
}

.mdc-list-item {
  display: flex;
  position: relative;
  justify-content: flex-start;
  overflow: hidden;
  padding: 0;
  align-items: stretch;
  cursor: pointer;
  padding-left: 16px;
  padding-right: 16px;
  background-color: var(--%NS%mat-list-list-item-container-color, transparent);
  border-radius: var(--%NS%mat-list-list-item-container-shape, var(--%NS%mat-sys-corner-none));
}
.mdc-list-item.mdc-list-item--selected {
  background-color: var(--%NS%mat-list-list-item-selected-container-color);
}
.mdc-list-item:focus {
  outline: 0;
}
.mdc-list-item.mdc-list-item--disabled {
  cursor: auto;
}
.mdc-list-item.mdc-list-item--with-one-line {
  height: var(--%NS%mat-list-list-item-one-line-container-height, 48px);
}
.mdc-list-item.mdc-list-item--with-one-line .mdc-list-item__start {
  align-self: center;
  margin-top: 0;
}
.mdc-list-item.mdc-list-item--with-one-line .mdc-list-item__end {
  align-self: center;
  margin-top: 0;
}
.mdc-list-item.mdc-list-item--with-two-lines {
  height: var(--%NS%mat-list-list-item-two-line-container-height, 64px);
}
.mdc-list-item.mdc-list-item--with-two-lines .mdc-list-item__start {
  align-self: flex-start;
  margin-top: 16px;
}
.mdc-list-item.mdc-list-item--with-two-lines .mdc-list-item__end {
  align-self: center;
  margin-top: 0;
}
.mdc-list-item.mdc-list-item--with-three-lines {
  height: var(--%NS%mat-list-list-item-three-line-container-height, 88px);
}
.mdc-list-item.mdc-list-item--with-three-lines .mdc-list-item__start {
  align-self: flex-start;
  margin-top: 16px;
}
.mdc-list-item.mdc-list-item--with-three-lines .mdc-list-item__end {
  align-self: flex-start;
  margin-top: 16px;
}
.mdc-list-item.mdc-list-item--%NS%selected::before, .mdc-list-item.mdc-list-item--%NS%selected:focus::before, .mdc-list-item:not(.mdc-list-item--selected):focus::before {
  position: absolute;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  content: "";
  pointer-events: none;
}

a.mdc-list-item {
  color: inherit;
  text-decoration: none;
}

.mdc-list-item__start {
  fill: currentColor;
  flex-shrink: 0;
  pointer-events: none;
}
.mdc-list-item--with-leading-icon .mdc-list-item__start {
  color: var(--%NS%mat-list-list-item-leading-icon-color, var(--%NS%mat-sys-on-surface-variant));
  width: var(--%NS%mat-list-list-item-leading-icon-size, 24px);
  height: var(--%NS%mat-list-list-item-leading-icon-size, 24px);
  margin-left: 16px;
  margin-right: 32px;
}
[dir=rtl] .mdc-list-item--with-leading-icon .mdc-list-item__start {
  margin-left: 32px;
  margin-right: 16px;
}
.mdc-list-item--%NS%with-leading-icon:hover .mdc-list-item__start {
  color: var(--%NS%mat-list-list-item-hover-leading-icon-color);
}
.mdc-list-item--with-leading-avatar .mdc-list-item__start {
  width: var(--%NS%mat-list-list-item-leading-avatar-size, 40px);
  height: var(--%NS%mat-list-list-item-leading-avatar-size, 40px);
  margin-left: 16px;
  margin-right: 16px;
  border-radius: 50%;
}
.mdc-list-item--with-leading-avatar .mdc-list-item__start, [dir=rtl] .mdc-list-item--with-leading-avatar .mdc-list-item__start {
  margin-left: 16px;
  margin-right: 16px;
  border-radius: 50%;
}

.mdc-list-item__end {
  flex-shrink: 0;
  pointer-events: none;
}
.mdc-list-item--with-trailing-meta .mdc-list-item__end {
  font-family: var(--%NS%mat-list-list-item-trailing-supporting-text-font, var(--%NS%mat-sys-label-small-font));
  line-height: var(--%NS%mat-list-list-item-trailing-supporting-text-line-height, var(--%NS%mat-sys-label-small-line-height));
  font-size: var(--%NS%mat-list-list-item-trailing-supporting-text-size, var(--%NS%mat-sys-label-small-size));
  font-weight: var(--%NS%mat-list-list-item-trailing-supporting-text-weight, var(--%NS%mat-sys-label-small-weight));
  letter-spacing: var(--%NS%mat-list-list-item-trailing-supporting-text-tracking, var(--%NS%mat-sys-label-small-tracking));
}
.mdc-list-item--with-trailing-icon .mdc-list-item__end {
  color: var(--%NS%mat-list-list-item-trailing-icon-color, var(--%NS%mat-sys-on-surface-variant));
  width: var(--%NS%mat-list-list-item-trailing-icon-size, 24px);
  height: var(--%NS%mat-list-list-item-trailing-icon-size, 24px);
}
.mdc-list-item--%NS%with-trailing-icon:hover .mdc-list-item__end {
  color: var(--%NS%mat-list-list-item-hover-trailing-icon-color);
}
.mdc-list-item.mdc-list-item--with-trailing-meta .mdc-list-item__end {
  color: var(--%NS%mat-list-list-item-trailing-supporting-text-color, var(--%NS%mat-sys-on-surface-variant));
}
.mdc-list-item--selected.mdc-list-item--with-trailing-icon .mdc-list-item__end {
  color: var(--%NS%mat-list-list-item-selected-trailing-icon-color, var(--%NS%mat-sys-primary));
}

.mdc-list-item__content {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  align-self: center;
  flex: 1;
  pointer-events: none;
}
.mdc-list-item--with-two-lines .mdc-list-item__content, .mdc-list-item--with-three-lines .mdc-list-item__content {
  align-self: stretch;
}

.mdc-list-item__primary-text {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  color: var(--%NS%mat-list-list-item-label-text-color, var(--%NS%mat-sys-on-surface));
  font-family: var(--%NS%mat-list-list-item-label-text-font, var(--%NS%mat-sys-body-large-font));
  line-height: var(--%NS%mat-list-list-item-label-text-line-height, var(--%NS%mat-sys-body-large-line-height));
  font-size: var(--%NS%mat-list-list-item-label-text-size, var(--%NS%mat-sys-body-large-size));
  font-weight: var(--%NS%mat-list-list-item-label-text-weight, var(--%NS%mat-sys-body-large-weight));
  letter-spacing: var(--%NS%mat-list-list-item-label-text-tracking, var(--%NS%mat-sys-body-large-tracking));
}
.mdc-list-item:hover .mdc-list-item__primary-text {
  color: var(--%NS%mat-list-list-item-hover-label-text-color, var(--%NS%mat-sys-on-surface));
}
.mdc-list-item:focus .mdc-list-item__primary-text {
  color: var(--%NS%mat-list-list-item-focus-label-text-color, var(--%NS%mat-sys-on-surface));
}
.mdc-list-item--with-two-lines .mdc-list-item__primary-text, .mdc-list-item--with-three-lines .mdc-list-item__primary-text {
  display: block;
  margin-top: 0;
  line-height: normal;
  margin-bottom: -20px;
}
.mdc-list-item--with-two-lines .mdc-list-item__primary-text::before, .mdc-list-item--with-three-lines .mdc-list-item__primary-text::before {
  display: inline-block;
  width: 0;
  height: 28px;
  content: "";
  vertical-align: 0;
}
.mdc-list-item--with-two-lines .mdc-list-item__primary-text::after, .mdc-list-item--with-three-lines .mdc-list-item__primary-text::after {
  display: inline-block;
  width: 0;
  height: 20px;
  content: "";
  vertical-align: -20px;
}

.mdc-list-item__secondary-text {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  display: block;
  margin-top: 0;
  color: var(--%NS%mat-list-list-item-supporting-text-color, var(--%NS%mat-sys-on-surface-variant));
  font-family: var(--%NS%mat-list-list-item-supporting-text-font, var(--%NS%mat-sys-body-medium-font));
  line-height: var(--%NS%mat-list-list-item-supporting-text-line-height, var(--%NS%mat-sys-body-medium-line-height));
  font-size: var(--%NS%mat-list-list-item-supporting-text-size, var(--%NS%mat-sys-body-medium-size));
  font-weight: var(--%NS%mat-list-list-item-supporting-text-weight, var(--%NS%mat-sys-body-medium-weight));
  letter-spacing: var(--%NS%mat-list-list-item-supporting-text-tracking, var(--%NS%mat-sys-body-medium-tracking));
}
.mdc-list-item__secondary-text::before {
  display: inline-block;
  width: 0;
  height: 20px;
  content: "";
  vertical-align: 0;
}
.mdc-list-item--with-three-lines .mdc-list-item__secondary-text {
  white-space: normal;
  line-height: 20px;
}
.mdc-list-item--with-overline .mdc-list-item__secondary-text {
  white-space: nowrap;
  line-height: auto;
}

.mdc-list-item--with-leading-radio.mdc-list-item,
.mdc-list-item--with-leading-checkbox.mdc-list-item,
.mdc-list-item--with-leading-icon.mdc-list-item,
.mdc-list-item--with-leading-avatar.mdc-list-item {
  padding-left: 0;
  padding-right: 16px;
}
[dir=rtl] .mdc-list-item--with-leading-radio.mdc-list-item,
[dir=rtl] .mdc-list-item--with-leading-checkbox.mdc-list-item,
[dir=rtl] .mdc-list-item--with-leading-icon.mdc-list-item,
[dir=rtl] .mdc-list-item--with-leading-avatar.mdc-list-item {
  padding-left: 16px;
  padding-right: 0;
}
.mdc-list-item--with-leading-radio.mdc-list-item--with-two-lines .mdc-list-item__primary-text,
.mdc-list-item--with-leading-checkbox.mdc-list-item--with-two-lines .mdc-list-item__primary-text,
.mdc-list-item--with-leading-icon.mdc-list-item--with-two-lines .mdc-list-item__primary-text,
.mdc-list-item--with-leading-avatar.mdc-list-item--with-two-lines .mdc-list-item__primary-text {
  display: block;
  margin-top: 0;
  line-height: normal;
  margin-bottom: -20px;
}
.mdc-list-item--with-leading-radio.mdc-list-item--with-two-lines .mdc-list-item__primary-text::before,
.mdc-list-item--with-leading-checkbox.mdc-list-item--with-two-lines .mdc-list-item__primary-text::before,
.mdc-list-item--with-leading-icon.mdc-list-item--with-two-lines .mdc-list-item__primary-text::before,
.mdc-list-item--with-leading-avatar.mdc-list-item--with-two-lines .mdc-list-item__primary-text::before {
  display: inline-block;
  width: 0;
  height: 32px;
  content: "";
  vertical-align: 0;
}
.mdc-list-item--with-leading-radio.mdc-list-item--with-two-lines .mdc-list-item__primary-text::after,
.mdc-list-item--with-leading-checkbox.mdc-list-item--with-two-lines .mdc-list-item__primary-text::after,
.mdc-list-item--with-leading-icon.mdc-list-item--with-two-lines .mdc-list-item__primary-text::after,
.mdc-list-item--with-leading-avatar.mdc-list-item--with-two-lines .mdc-list-item__primary-text::after {
  display: inline-block;
  width: 0;
  height: 20px;
  content: "";
  vertical-align: -20px;
}
.mdc-list-item--with-leading-radio.mdc-list-item--with-two-lines.mdc-list-item--with-trailing-meta .mdc-list-item__end,
.mdc-list-item--with-leading-checkbox.mdc-list-item--with-two-lines.mdc-list-item--with-trailing-meta .mdc-list-item__end,
.mdc-list-item--with-leading-icon.mdc-list-item--with-two-lines.mdc-list-item--with-trailing-meta .mdc-list-item__end,
.mdc-list-item--with-leading-avatar.mdc-list-item--with-two-lines.mdc-list-item--with-trailing-meta .mdc-list-item__end {
  display: block;
  margin-top: 0;
  line-height: normal;
}
.mdc-list-item--with-leading-radio.mdc-list-item--with-two-lines.mdc-list-item--with-trailing-meta .mdc-list-item__end::before,
.mdc-list-item--with-leading-checkbox.mdc-list-item--with-two-lines.mdc-list-item--with-trailing-meta .mdc-list-item__end::before,
.mdc-list-item--with-leading-icon.mdc-list-item--with-two-lines.mdc-list-item--with-trailing-meta .mdc-list-item__end::before,
.mdc-list-item--with-leading-avatar.mdc-list-item--with-two-lines.mdc-list-item--with-trailing-meta .mdc-list-item__end::before {
  display: inline-block;
  width: 0;
  height: 32px;
  content: "";
  vertical-align: 0;
}

.mdc-list-item--with-trailing-icon.mdc-list-item, [dir=rtl] .mdc-list-item--with-trailing-icon.mdc-list-item {
  padding-left: 0;
  padding-right: 0;
}
.mdc-list-item--with-trailing-icon .mdc-list-item__end {
  margin-left: 16px;
  margin-right: 16px;
}

.mdc-list-item--with-trailing-meta.mdc-list-item {
  padding-left: 16px;
  padding-right: 0;
}
[dir=rtl] .mdc-list-item--with-trailing-meta.mdc-list-item {
  padding-left: 0;
  padding-right: 16px;
}
.mdc-list-item--with-trailing-meta .mdc-list-item__end {
  -webkit-user-select: none;
  user-select: none;
  margin-left: 28px;
  margin-right: 16px;
}
[dir=rtl] .mdc-list-item--with-trailing-meta .mdc-list-item__end {
  margin-left: 16px;
  margin-right: 28px;
}
.mdc-list-item--with-trailing-meta.mdc-list-item--with-three-lines .mdc-list-item__end, .mdc-list-item--with-trailing-meta.mdc-list-item--with-two-lines .mdc-list-item__end {
  display: block;
  line-height: normal;
  align-self: flex-start;
  margin-top: 0;
}
.mdc-list-item--with-trailing-meta.mdc-list-item--with-three-lines .mdc-list-item__end::before, .mdc-list-item--with-trailing-meta.mdc-list-item--with-two-lines .mdc-list-item__end::before {
  display: inline-block;
  width: 0;
  height: 28px;
  content: "";
  vertical-align: 0;
}

.mdc-list-item--with-leading-radio .mdc-list-item__start,
.mdc-list-item--with-leading-checkbox .mdc-list-item__start {
  margin-left: 8px;
  margin-right: 24px;
}
[dir=rtl] .mdc-list-item--with-leading-radio .mdc-list-item__start,
[dir=rtl] .mdc-list-item--with-leading-checkbox .mdc-list-item__start {
  margin-left: 24px;
  margin-right: 8px;
}
.mdc-list-item--with-leading-radio.mdc-list-item--with-two-lines .mdc-list-item__start,
.mdc-list-item--with-leading-checkbox.mdc-list-item--with-two-lines .mdc-list-item__start {
  align-self: flex-start;
  margin-top: 8px;
}

.mdc-list-item--with-trailing-radio.mdc-list-item,
.mdc-list-item--with-trailing-checkbox.mdc-list-item {
  padding-left: 16px;
  padding-right: 0;
}
[dir=rtl] .mdc-list-item--with-trailing-radio.mdc-list-item,
[dir=rtl] .mdc-list-item--with-trailing-checkbox.mdc-list-item {
  padding-left: 0;
  padding-right: 16px;
}
.mdc-list-item--with-trailing-radio.mdc-list-item--with-leading-icon, .mdc-list-item--with-trailing-radio.mdc-list-item--with-leading-avatar,
.mdc-list-item--with-trailing-checkbox.mdc-list-item--with-leading-icon,
.mdc-list-item--with-trailing-checkbox.mdc-list-item--with-leading-avatar {
  padding-left: 0;
}
[dir=rtl] .mdc-list-item--with-trailing-radio.mdc-list-item--with-leading-icon, [dir=rtl] .mdc-list-item--with-trailing-radio.mdc-list-item--with-leading-avatar,
[dir=rtl] .mdc-list-item--with-trailing-checkbox.mdc-list-item--with-leading-icon,
[dir=rtl] .mdc-list-item--with-trailing-checkbox.mdc-list-item--with-leading-avatar {
  padding-right: 0;
}
.mdc-list-item--with-trailing-radio .mdc-list-item__end,
.mdc-list-item--with-trailing-checkbox .mdc-list-item__end {
  margin-left: 24px;
  margin-right: 8px;
}
[dir=rtl] .mdc-list-item--with-trailing-radio .mdc-list-item__end,
[dir=rtl] .mdc-list-item--with-trailing-checkbox .mdc-list-item__end {
  margin-left: 8px;
  margin-right: 24px;
}
.mdc-list-item--with-trailing-radio.mdc-list-item--with-three-lines .mdc-list-item__end,
.mdc-list-item--with-trailing-checkbox.mdc-list-item--with-three-lines .mdc-list-item__end {
  align-self: flex-start;
  margin-top: 8px;
}

.mdc-list-group__subheader {
  margin: 0.75rem 16px;
}

.mdc-list-item--disabled .mdc-list-item__start,
.mdc-list-item--disabled .mdc-list-item__content,
.mdc-list-item--disabled .mdc-list-item__end {
  opacity: 1;
}
.mdc-list-item--disabled .mdc-list-item__primary-text,
.mdc-list-item--disabled .mdc-list-item__secondary-text {
  opacity: var(--%NS%mat-list-list-item-disabled-label-text-opacity, 0.3);
}
.mdc-list-item--disabled.mdc-list-item--with-leading-icon .mdc-list-item__start {
  color: var(--%NS%mat-list-list-item-disabled-leading-icon-color, var(--%NS%mat-sys-on-surface));
  opacity: var(--%NS%mat-list-list-item-disabled-leading-icon-opacity, 0.38);
}
.mdc-list-item--disabled.mdc-list-item--with-trailing-icon .mdc-list-item__end {
  color: var(--%NS%mat-list-list-item-disabled-trailing-icon-color, var(--%NS%mat-sys-on-surface));
  opacity: var(--%NS%mat-list-list-item-disabled-trailing-icon-opacity, 0.38);
}

.mat-mdc-list-item.mat-mdc-list-item-both-leading-and-trailing, [dir=rtl] .mat-mdc-list-item.mat-mdc-list-item-both-leading-and-trailing {
  padding-left: 0;
  padding-right: 0;
}

.mdc-list-item.mdc-list-item--disabled .mdc-list-item__primary-text {
  color: var(--%NS%mat-list-list-item-disabled-label-text-color, var(--%NS%mat-sys-on-surface));
}

.mdc-list-item:hover::before {
  background-color: var(--%NS%mat-list-list-item-hover-state-layer-color, var(--%NS%mat-sys-on-surface));
  opacity: var(--%NS%mat-list-list-item-hover-state-layer-opacity, var(--%NS%mat-sys-hover-state-layer-opacity));
}

.mdc-list-item.mdc-list-item--%NS%disabled::before {
  background-color: var(--%NS%mat-list-list-item-disabled-state-layer-color, var(--%NS%mat-sys-on-surface));
  opacity: var(--%NS%mat-list-list-item-disabled-state-layer-opacity, var(--%NS%mat-sys-focus-state-layer-opacity));
}

.mdc-list-item:focus::before {
  background-color: var(--%NS%mat-list-list-item-focus-state-layer-color, var(--%NS%mat-sys-on-surface));
  opacity: var(--%NS%mat-list-list-item-focus-state-layer-opacity, var(--%NS%mat-sys-focus-state-layer-opacity));
}

.mdc-list-item--disabled .mdc-radio,
.mdc-list-item--disabled .mdc-checkbox {
  opacity: var(--%NS%mat-list-list-item-disabled-label-text-opacity, 0.3);
}

.mdc-list-item--with-leading-avatar .mat-mdc-list-item-avatar {
  border-radius: var(--%NS%mat-list-list-item-leading-avatar-shape, var(--%NS%mat-sys-corner-full));
  background-color: var(--%NS%mat-list-list-item-leading-avatar-color, var(--%NS%mat-sys-primary-container));
}

.mat-mdc-list-item-icon {
  font-size: var(--%NS%mat-list-list-item-leading-icon-size, 24px);
}

@media (forced-colors: active) {
  a.mdc-list-item--%NS%activated::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 16px;
    transform: translateY(-50%);
    width: 10px;
    height: 0;
    border-bottom: solid 10px;
    border-radius: 10px;
  }
  a.mdc-list-item--activated [dir=rtl]::after {
    right: auto;
    left: 16px;
  }
}

.mat-mdc-list-base {
  display: block;
}
.mat-mdc-list-base .mdc-list-item__start,
.mat-mdc-list-base .mdc-list-item__end,
.mat-mdc-list-base .mdc-list-item__content {
  pointer-events: auto;
}

.mat-mdc-list-item,
.mat-mdc-list-option {
  width: 100%;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}
.mat-mdc-list-item:not(.mat-mdc-list-item-interactive),
.mat-mdc-list-option:not(.mat-mdc-list-item-interactive) {
  cursor: default;
}
.mat-mdc-list-item .mat-divider-inset,
.mat-mdc-list-option .mat-divider-inset {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
}
.mat-mdc-list-item .mat-mdc-list-item-avatar ~ .mat-divider-inset,
.mat-mdc-list-option .mat-mdc-list-item-avatar ~ .mat-divider-inset {
  margin-left: 72px;
}
[dir=rtl] .mat-mdc-list-item .mat-mdc-list-item-avatar ~ .mat-divider-inset,
[dir=rtl] .mat-mdc-list-option .mat-mdc-list-item-avatar ~ .mat-divider-inset {
  margin-right: 72px;
}

.mat-mdc-list-item-interactive::before {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  content: "";
  opacity: 0;
  pointer-events: none;
  border-radius: inherit;
}

.mat-mdc-list-item > .mat-focus-indicator {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  pointer-events: none;
}
.mat-mdc-list-item:focus-visible > .mat-focus-indicator::before {
  content: "";
}

.mat-mdc-list-item.mdc-list-item--with-three-lines .mat-mdc-list-item-line.mdc-list-item__secondary-text {
  white-space: nowrap;
  line-height: normal;
}
.mat-mdc-list-item.mdc-list-item--with-three-lines .mat-mdc-list-item-unscoped-content.mdc-list-item__secondary-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

mat-action-list button {
  background: none;
  color: inherit;
  border: none;
  font: inherit;
  outline: inherit;
  -webkit-tap-highlight-color: transparent;
  text-align: start;
}
mat-action-list button::-moz-focus-inner {
  border: 0;
}

.mdc-list-item--with-leading-icon .mdc-list-item__start {
  margin-inline-start: var(--%NS%mat-list-list-item-leading-icon-start-space, 16px);
  margin-inline-end: var(--%NS%mat-list-list-item-leading-icon-end-space, 16px);
}

.mat-mdc-nav-list .mat-mdc-list-item {
  border-radius: var(--%NS%mat-list-active-indicator-shape, var(--%NS%mat-sys-corner-full));
  --%NS%mat-focus-indicator-border-radius: var(--%NS%mat-list-active-indicator-shape, var(--%NS%mat-sys-corner-full));
}
.mat-mdc-nav-list .mat-mdc-list-item.mdc-list-item--activated {
  background-color: var(--%NS%mat-list-active-indicator-color, var(--%NS%mat-sys-secondary-container));
}
`,ti=["unscopedContent"],ei=["text"],ii=[[["","matListItemAvatar",""],["","matListItemIcon",""]],[["","matListItemTitle",""]],[["","matListItemLine",""]],"*",[["","matListItemMeta",""]],[["mat-divider"]]],ni=["[matListItemAvatar],[matListItemIcon]","[matListItemTitle]","[matListItemLine]","*","[matListItemMeta]","mat-divider"];var ai=new A("ListOption"),Et=(()=>{class i{_elementRef=r(v);static \u0275fac=function(e){return new(e||i)};static \u0275dir=_({type:i,selectors:[["","matListItemTitle",""]],hostAttrs:[1,"mat-mdc-list-item-title","mdc-list-item__primary-text"]})}return i})(),ri=(()=>{class i{_elementRef=r(v);static \u0275fac=function(e){return new(e||i)};static \u0275dir=_({type:i,selectors:[["","matListItemLine",""]],hostAttrs:[1,"mat-mdc-list-item-line","mdc-list-item__secondary-text"]})}return i})(),oi=(()=>{class i{static \u0275fac=function(e){return new(e||i)};static \u0275dir=_({type:i,selectors:[["","matListItemMeta",""]],hostAttrs:[1,"mat-mdc-list-item-meta","mdc-list-item__end"]})}return i})(),Me=(()=>{class i{_listOption=r(ai,{optional:!0});_isAlignedAtStart(){return!this._listOption||this._listOption?._getTogglePosition()==="after"}static \u0275fac=function(e){return new(e||i)};static \u0275dir=_({type:i,hostVars:4,hostBindings:function(e,n){e&2&&f("mdc-list-item__start",n._isAlignedAtStart())("mdc-list-item__end",!n._isAlignedAtStart())}})}return i})(),si=(()=>{class i extends Me{static \u0275fac=(()=>{let t;return function(n){return(t||(t=N(i)))(n||i)}})();static \u0275dir=_({type:i,selectors:[["","matListItemAvatar",""]],hostAttrs:[1,"mat-mdc-list-item-avatar"],features:[D]})}return i})(),Tt=(()=>{class i extends Me{static \u0275fac=(()=>{let t;return function(n){return(t||(t=N(i)))(n||i)}})();static \u0275dir=_({type:i,selectors:[["","matListItemIcon",""]],hostAttrs:[1,"mat-mdc-list-item-icon"],features:[D]})}return i})(),li=new A("MAT_LIST_CONFIG"),Ot=(()=>{class i{_isNonInteractive=!0;get disableRipple(){return this._disableRipple}set disableRipple(t){this._disableRipple=y(t)}_disableRipple=!1;get disabled(){return this._disabled()}set disabled(t){this._disabled.set(y(t))}_disabled=C(!1);_defaultOptions=r(li,{optional:!0});static \u0275fac=function(e){return new(e||i)};static \u0275dir=_({type:i,hostVars:1,hostBindings:function(e,n){e&2&&M("aria-disabled",n.disabled)},inputs:{disableRipple:"disableRipple",disabled:"disabled"}})}return i})(),ci=(()=>{class i{_elementRef=r(v);_ngZone=r(R);_listBase=r(Ot,{optional:!0});_platform=r(I);_hostElement;_isButtonElement;_noopAnimations=ft();_avatars;_icons;set lines(t){this._explicitLines=et(t,null),this._updateItemLines(!1)}_explicitLines=null;get disableRipple(){return this.disabled||this._disableRipple||this._noopAnimations||!!this._listBase?.disableRipple}set disableRipple(t){this._disableRipple=y(t)}_disableRipple=!1;get disabled(){return this._disabled()||!!this._listBase?.disabled}set disabled(t){this._disabled.set(y(t))}_disabled=C(!1);_subscriptions=new xt;_rippleRenderer=null;_hasUnscopedTextContent=!1;rippleConfig;get rippleDisabled(){return this.disableRipple||!!this.rippleConfig.disabled}constructor(){r(re).load(ue);let t=r(pe,{optional:!0});this.rippleConfig=t||{},this._hostElement=this._elementRef.nativeElement,this._isButtonElement=this._hostElement.nodeName.toLowerCase()==="button",this._listBase&&!this._listBase._isNonInteractive&&this._initInteractiveListItem(),this._isButtonElement&&!this._hostElement.hasAttribute("type")&&this._hostElement.setAttribute("type","button")}ngAfterViewInit(){this._monitorProjectedLinesAndTitle(),this._updateItemLines(!0)}ngOnDestroy(){this._subscriptions.unsubscribe(),this._rippleRenderer!==null&&this._rippleRenderer._removeTriggerEvents()}_hasIconOrAvatar(){return!!(this._avatars.length||this._icons.length)}_initInteractiveListItem(){this._hostElement.classList.add("mat-mdc-list-item-interactive"),this._rippleRenderer=new he(this,this._ngZone,this._hostElement,this._platform,r(W)),this._rippleRenderer.setupTriggerEvents(this._hostElement)}_monitorProjectedLinesAndTitle(){this._ngZone.runOutsideAngular(()=>{this._subscriptions.add(ht(this._lines.changes,this._titles.changes).subscribe(()=>this._updateItemLines(!1)))})}_updateItemLines(t){if(!this._lines||!this._titles||!this._unscopedContent)return;t&&this._checkDomForUnscopedTextContent();let e=this._explicitLines??this._inferLinesFromContent(),n=this._unscopedContent.nativeElement;if(this._hostElement.classList.toggle("mat-mdc-list-item-single-line",e<=1),this._hostElement.classList.toggle("mdc-list-item--with-one-line",e<=1),this._hostElement.classList.toggle("mdc-list-item--with-two-lines",e===2),this._hostElement.classList.toggle("mdc-list-item--with-three-lines",e===3),this._hasUnscopedTextContent){let a=this._titles.length===0&&e===1;n.classList.toggle("mdc-list-item__primary-text",a),n.classList.toggle("mdc-list-item__secondary-text",!a)}else n.classList.remove("mdc-list-item__primary-text"),n.classList.remove("mdc-list-item__secondary-text")}_inferLinesFromContent(){let t=this._titles.length+this._lines.length;return this._hasUnscopedTextContent&&(t+=1),t}_checkDomForUnscopedTextContent(){this._hasUnscopedTextContent=Array.from(this._unscopedContent.nativeElement.childNodes).filter(t=>t.nodeType!==t.COMMENT_NODE).some(t=>!!(t.textContent&&t.textContent.trim()))}static \u0275fac=function(e){return new(e||i)};static \u0275dir=_({type:i,contentQueries:function(e,n,a){if(e&1&&P(a,si,4)(a,Tt,4),e&2){let o;h(o=p())&&(n._avatars=o),h(o=p())&&(n._icons=o)}},hostVars:4,hostBindings:function(e,n){e&2&&(M("aria-disabled",n.disabled)("disabled",n._isButtonElement&&n.disabled||null),f("mdc-list-item--disabled",n.disabled))},inputs:{lines:"lines",disableRipple:"disableRipple",disabled:"disabled"}})}return i})();var Ie=(()=>{class i extends ci{_lines;_titles;_meta;_unscopedContent;_itemText;get activated(){return this._activated}set activated(t){this._activated=y(t)}_activated=!1;_getAriaCurrent(){return this._hostElement.nodeName==="A"&&this._activated?"page":null}_hasBothLeadingAndTrailing(){return this._meta.length!==0&&(this._avatars.length!==0||this._icons.length!==0)}static \u0275fac=(()=>{let t;return function(n){return(t||(t=N(i)))(n||i)}})();static \u0275cmp=g({type:i,selectors:[["mat-list-item"],["a","mat-list-item",""],["button","mat-list-item",""]],contentQueries:function(e,n,a){if(e&1&&P(a,ri,5)(a,Et,5)(a,oi,5),e&2){let o;h(o=p())&&(n._lines=o),h(o=p())&&(n._titles=o),h(o=p())&&(n._meta=o)}},viewQuery:function(e,n){if(e&1&&J(ti,5)(ei,5),e&2){let a;h(a=p())&&(n._unscopedContent=a.first),h(a=p())&&(n._itemText=a.first)}},hostAttrs:[1,"mat-mdc-list-item","mdc-list-item"],hostVars:13,hostBindings:function(e,n){e&2&&(M("aria-current",n._getAriaCurrent()),f("mdc-list-item--activated",n.activated)("mdc-list-item--with-leading-avatar",n._avatars.length!==0)("mdc-list-item--with-leading-icon",n._icons.length!==0)("mdc-list-item--with-trailing-meta",n._meta.length!==0)("mat-mdc-list-item-both-leading-and-trailing",n._hasBothLeadingAndTrailing())("_mat-animation-noopable",n._noopAnimations))},inputs:{activated:"activated"},exportAs:["matListItem"],features:[D],ngContentSelectors:ni,decls:10,vars:0,consts:[["unscopedContent",""],[1,"mdc-list-item__content"],[1,"mat-mdc-list-item-unscoped-content",3,"cdkObserveContent"],[1,"mat-focus-indicator"]],template:function(e,n){e&1&&(w(ii),d(0),s(1,"span",1),d(2,1),d(3,2),s(4,"span",2,0),F("cdkObserveContent",function(){return n._updateItemLines(!0)}),d(6,3),c()(),d(7,4),d(8,5),Y(9,"div",3))},dependencies:[oe],encapsulation:2})}return i})();var Re=(()=>{class i extends Ot{_isNonInteractive=!1;static \u0275fac=(()=>{let t;return function(n){return(t||(t=N(i)))(n||i)}})();static \u0275cmp=g({type:i,selectors:[["mat-nav-list"]],hostAttrs:["role","navigation",1,"mat-mdc-nav-list","mat-mdc-list-base","mdc-list"],exportAs:["matNavList"],features:[L([{provide:Ot,useExisting:i}]),D],ngContentSelectors:Xe,decls:1,vars:0,template:function(e,n){e&1&&(w(),d(0))},styles:[Je],encapsulation:2})}return i})();var Oe=(()=>{class i{static \u0275fac=function(e){return new(e||i)};static \u0275mod=k({type:i});static \u0275inj=x({imports:[se,fe,De,T,Ne]})}return i})();var mi=20,hi=(()=>{class i{_ngZone=r(R);_platform=r(I);_renderer=r(Mt).createRenderer(null,null);_cleanupGlobalListener;_scrolled=new b;_scrolledCount=0;scrollContainers=new Map;register(t){this.scrollContainers.has(t)||this.scrollContainers.set(t,t.elementScrolled().subscribe(()=>this._scrolled.next(t)))}deregister(t){let e=this.scrollContainers.get(t);e&&(e.unsubscribe(),this.scrollContainers.delete(t))}scrolled(t=mi){return this._platform.isBrowser?new Vt(e=>{this._cleanupGlobalListener||(this._cleanupGlobalListener=this._ngZone.runOutsideAngular(()=>this._renderer.listen("document","scroll",()=>this._scrolled.next())));let n=t>0?this._scrolled.pipe(kt(t)).subscribe(e):this._scrolled.subscribe(e);return this._scrolledCount++,()=>{n.unsubscribe(),this._scrolledCount--,this._scrolledCount||(this._cleanupGlobalListener?.(),this._cleanupGlobalListener=void 0)}}):jt()}ngOnDestroy(){this._cleanupGlobalListener?.(),this._cleanupGlobalListener=void 0,this.scrollContainers.forEach((t,e)=>this.deregister(e)),this._scrolled.complete()}ancestorScrolled(t,e){let n=this.getAncestorScrollContainers(t);return this.scrolled(e).pipe(j(a=>!a||n.indexOf(a)>-1))}getAncestorScrollContainers(t){let e=[];return this.scrollContainers.forEach((n,a)=>{this._targetContainsElement(a,t)&&e.push(a)}),e}_targetContainsElement(t,e){let n=ne(e),a=t.getElementRef().nativeElement;do if(n==a)return!0;while(n=n.parentElement);return!1}static \u0275fac=function(e){return new(e||i)};static \u0275prov=Dt({token:i,factory:i.\u0275fac})}return i})(),at=(()=>{class i{elementRef=r(v);scrollDispatcher=r(hi);ngZone=r(R);dir=r(_t,{optional:!0});_scrollElement=this.elementRef.nativeElement;_destroyed=new b;_renderer=r(U);_cleanupScroll;_elementScrolled=new b;ngOnInit(){this._cleanupScroll=this.ngZone.runOutsideAngular(()=>this._renderer.listen(this._scrollElement,"scroll",t=>this._elementScrolled.next(t))),this.scrollDispatcher.register(this)}ngOnDestroy(){this._cleanupScroll?.(),this._elementScrolled.complete(),this.scrollDispatcher.deregister(this),this._destroyed.next(),this._destroyed.complete()}elementScrolled(){return this._elementScrolled}getElementRef(){return this.elementRef}scrollTo(t){let e=this.elementRef.nativeElement,n=this.dir&&this.dir.value=="rtl";t.left==null&&(t.left=n?t.end:t.start),t.right==null&&(t.right=n?t.start:t.end),t.bottom!=null&&(t.top=e.scrollHeight-e.clientHeight-t.bottom),n&&nt()!=it.NORMAL?(t.left!=null&&(t.right=e.scrollWidth-e.clientWidth-t.left),nt()==it.INVERTED?t.left=t.right:nt()==it.NEGATED&&(t.left=t.right?-t.right:t.right)):t.right!=null&&(t.left=e.scrollWidth-e.clientWidth-t.right),this._applyScrollToOptions(t)}_applyScrollToOptions(t){let e=this.elementRef.nativeElement;me()?e.scrollTo(t):(t.top!=null&&(e.scrollTop=t.top),t.left!=null&&(e.scrollLeft=t.left))}measureScrollOffset(t){let e="left",n="right",a=this.elementRef.nativeElement;if(t=="top")return a.scrollTop;if(t=="bottom")return a.scrollHeight-a.clientHeight-a.scrollTop;let o=this.dir&&this.dir.value=="rtl";return t=="start"?t=o?n:e:t=="end"&&(t=o?e:n),o&&nt()==it.INVERTED?t==e?a.scrollWidth-a.clientWidth-a.scrollLeft:a.scrollLeft:o&&nt()==it.NEGATED?t==e?a.scrollLeft+a.scrollWidth-a.clientWidth:-a.scrollLeft:t==e?a.scrollLeft:a.scrollWidth-a.clientWidth-a.scrollLeft}static \u0275fac=function(e){return new(e||i)};static \u0275dir=_({type:i,selectors:[["","cdk-scrollable",""],["","cdkScrollable",""]]})}return i})(),pi=20,Ee=(()=>{class i{_platform=r(I);_listeners;_viewportSize=null;_change=new b;_document=r(K);constructor(){let t=r(R),e=r(Mt).createRenderer(null,null);t.runOutsideAngular(()=>{if(this._platform.isBrowser){let n=a=>this._change.next(a);this._listeners=[e.listen("window","resize",n),e.listen("window","orientationchange",n)]}this.change().subscribe(()=>this._viewportSize=null)})}ngOnDestroy(){this._listeners?.forEach(t=>t()),this._change.complete()}getViewportSize(){this._viewportSize||this._updateViewportSize();let t={width:this._viewportSize.width,height:this._viewportSize.height};return this._platform.isBrowser||(this._viewportSize=null),t}getViewportRect(){let t=this.getViewportScrollPosition(),{width:e,height:n}=this.getViewportSize();return{top:t.top,left:t.left,bottom:t.top+n,right:t.left+e,height:n,width:e}}getViewportScrollPosition(){if(!this._platform.isBrowser)return{top:0,left:0};let t=this._document,e=this._getWindow(),n=t.documentElement,a=n.getBoundingClientRect(),o=-a.top||t.body?.scrollTop||e.scrollY||n.scrollTop||0,q=-a.left||t.body?.scrollLeft||e.scrollX||n.scrollLeft||0;return{top:o,left:q}}change(t=pi){return t>0?this._change.pipe(kt(t)):this._change}_getWindow(){return this._document.defaultView||window}_updateViewportSize(){let t=this._getWindow();this._viewportSize=this._platform.isBrowser?{width:t.innerWidth,height:t.innerHeight}:{width:0,height:0}}static \u0275fac=function(e){return new(e||i)};static \u0275prov=Dt({token:i,factory:i.\u0275fac})}return i})();var At=(()=>{class i{static \u0275fac=function(e){return new(e||i)};static \u0275mod=k({type:i});static \u0275inj=x({})}return i})();var vt=["*"],gi=["content"],Te=[[["mat-drawer"],["mat-sidenav"]],[["mat-drawer-content"],["mat-sidenav-content"]],"*"],Ae=["mat-drawer, mat-sidenav","mat-drawer-content, mat-sidenav-content","*"];function fi(i,l){if(i&1){let t=X();s(0,"div",1),F("click",function(){Z(t);let n=E();return $(n._onBackdropClicked())}),c()}if(i&2){let t=E();f("mat-drawer-shown",t._isShowingBackdrop())}}function _i(i,l){i&1&&(s(0,"mat-drawer-content"),d(1,2),c())}function bi(i,l){if(i&1){let t=X();s(0,"div",1),F("click",function(){Z(t);let n=E();return $(n._onBackdropClicked())}),c()}if(i&2){let t=E();f("mat-drawer-shown",t._isShowingBackdrop())}}function vi(i,l){i&1&&(s(0,"mat-sidenav-content"),d(1,2),c())}var wi=`.mat-drawer-container {
  position: relative;
  z-index: 1;
  color: var(--%NS%mat-sidenav-content-text-color, var(--%NS%mat-sys-on-background));
  background-color: var(--%NS%mat-sidenav-content-background-color, var(--%NS%mat-sys-background));
  box-sizing: border-box;
  display: block;
  overflow: hidden;
}
.mat-drawer-container[fullscreen] {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
}
.mat-drawer-container[fullscreen].mat-drawer-container-has-open {
  overflow: hidden;
}
.mat-drawer-container.mat-drawer-container-explicit-backdrop .mat-drawer-side {
  z-index: 3;
}
.mat-drawer-container.ng-animate-disabled .mat-drawer-backdrop,
.mat-drawer-container.ng-animate-disabled .mat-drawer-content, .ng-animate-disabled .mat-drawer-container .mat-drawer-backdrop,
.ng-animate-disabled .mat-drawer-container .mat-drawer-content {
  transition: none;
}

.mat-drawer-backdrop {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  display: block;
  z-index: 3;
  visibility: hidden;
}
.mat-drawer-backdrop.mat-drawer-shown {
  visibility: visible;
  background-color: var(--%NS%mat-sidenav-scrim-color, color-mix(in srgb, var(--%NS%mat-sys-neutral-variant20) 40%, transparent));
}
.mat-drawer-transition .mat-drawer-backdrop {
  transition-duration: 400ms;
  transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
  transition-property: background-color, visibility;
}
@media (forced-colors: active) {
  .mat-drawer-backdrop {
    opacity: 0.5;
  }
}

.mat-drawer-content {
  position: relative;
  z-index: 1;
  display: block;
  height: 100%;
  overflow: auto;
}
.mat-drawer-content.mat-drawer-content-hidden {
  opacity: 0;
}
.mat-drawer-transition .mat-drawer-content {
  transition-duration: 400ms;
  transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
  transition-property: transform, margin-left, margin-right;
}

.mat-drawer {
  position: relative;
  z-index: 4;
  color: var(--%NS%mat-sidenav-container-text-color, var(--%NS%mat-sys-on-surface-variant));
  box-shadow: var(--%NS%mat-sidenav-container-elevation-shadow, none);
  background-color: var(--%NS%mat-sidenav-container-background-color, var(--%NS%mat-sys-surface));
  border-top-right-radius: var(--%NS%mat-sidenav-container-shape, var(--%NS%mat-sys-corner-large));
  border-bottom-right-radius: var(--%NS%mat-sidenav-container-shape, var(--%NS%mat-sys-corner-large));
  width: var(--%NS%mat-sidenav-container-width, 360px);
  display: block;
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 3;
  outline: 0;
  box-sizing: border-box;
  overflow-y: auto;
  transform: translate3d(-100%, 0, 0);
}
@media (forced-colors: active) {
  .mat-drawer, [dir=rtl] .mat-drawer.mat-drawer-end {
    border-right: solid 1px currentColor;
  }
}
@media (forced-colors: active) {
  [dir=rtl] .mat-drawer, .mat-drawer.mat-drawer-end {
    border-left: solid 1px currentColor;
    border-right: none;
  }
}
.mat-drawer.mat-drawer-side {
  z-index: 2;
}
.mat-drawer.mat-drawer-end {
  right: 0;
  transform: translate3d(100%, 0, 0);
  border-top-left-radius: var(--%NS%mat-sidenav-container-shape, var(--%NS%mat-sys-corner-large));
  border-bottom-left-radius: var(--%NS%mat-sidenav-container-shape, var(--%NS%mat-sys-corner-large));
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
[dir=rtl] .mat-drawer {
  border-top-left-radius: var(--%NS%mat-sidenav-container-shape, var(--%NS%mat-sys-corner-large));
  border-bottom-left-radius: var(--%NS%mat-sidenav-container-shape, var(--%NS%mat-sys-corner-large));
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  transform: translate3d(100%, 0, 0);
}
[dir=rtl] .mat-drawer.mat-drawer-end {
  border-top-right-radius: var(--%NS%mat-sidenav-container-shape, var(--%NS%mat-sys-corner-large));
  border-bottom-right-radius: var(--%NS%mat-sidenav-container-shape, var(--%NS%mat-sys-corner-large));
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  left: 0;
  right: auto;
  transform: translate3d(-100%, 0, 0);
}
.mat-drawer-transition .mat-drawer {
  transition: transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1);
}
.mat-drawer:not(.mat-drawer-opened):not(.mat-drawer-animating) {
  visibility: hidden;
  box-shadow: none;
}
.mat-drawer:not(.mat-drawer-opened):not(.mat-drawer-animating) .mat-drawer-inner-container {
  display: none;
}
.mat-drawer.mat-drawer-opened.mat-drawer-opened {
  transform: none;
}

.mat-drawer-side {
  box-shadow: none;
  border-right-color: var(--%NS%mat-sidenav-container-divider-color, transparent);
  border-right-width: 1px;
  border-right-style: solid;
}
.mat-drawer-side.mat-drawer-end {
  border-left-color: var(--%NS%mat-sidenav-container-divider-color, transparent);
  border-left-width: 1px;
  border-left-style: solid;
  border-right: none;
}
[dir=rtl] .mat-drawer-side {
  border-left-color: var(--%NS%mat-sidenav-container-divider-color, transparent);
  border-left-width: 1px;
  border-left-style: solid;
  border-right: none;
}
[dir=rtl] .mat-drawer-side.mat-drawer-end {
  border-right-color: var(--%NS%mat-sidenav-container-divider-color, transparent);
  border-right-width: 1px;
  border-right-style: solid;
  border-left: none;
}

.mat-drawer-inner-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.mat-sidenav-fixed {
  position: fixed;
}
`;var yi=new A("MAT_DRAWER_DEFAULT_AUTOSIZE",{providedIn:"root",factory:()=>!1}),zt=new A("MAT_DRAWER_CONTAINER"),dt=(()=>{class i extends at{_platform=r(I);_changeDetectorRef=r(tt);_element=r(v);_ngZone=r(R);_isInert=!1;_container=r(Lt);ngAfterContentInit(){this._container._contentMarginChanges.subscribe(()=>this._changeDetectorRef.markForCheck())}_drawerToggled(t){t.opened?this._ngZone.runOutsideAngular(()=>{t._animationEnd.pipe(Qt(50),St(1)).subscribe(()=>this._updateInert())}):this._updateInert()}_drawerModeChanged(){this._updateInert()}_updateInert(){let t=this._container._isShowingBackdrop();if(t!==this._isInert){let e=this._element.nativeElement;this._isInert=t,t?e.setAttribute("inert","true"):e.removeAttribute("inert")}}_shouldBeHidden(){if(this._platform.isBrowser)return!1;let{start:t,end:e}=this._container;return t!=null&&t.mode!=="over"&&t.opened||e!=null&&e.mode!=="over"&&e.opened}static \u0275fac=(()=>{let t;return function(n){return(t||(t=N(i)))(n||i)}})();static \u0275cmp=g({type:i,selectors:[["mat-drawer-content"]],hostAttrs:[1,"mat-drawer-content"],hostVars:6,hostBindings:function(e,n){e&2&&(lt("margin-left",n._container._contentMargins.left,"px")("margin-right",n._container._contentMargins.right,"px"),f("mat-drawer-content-hidden",n._shouldBeHidden()))},features:[L([{provide:at,useExisting:i}]),D],ngContentSelectors:vt,decls:1,vars:0,template:function(e,n){e&1&&(w(),d(0))},encapsulation:2})}return i})(),Ft=(()=>{class i{_elementRef=r(v);_focusTrapFactory=r(ce);_focusMonitor=r(ae);_platform=r(I);_ngZone=r(R);_renderer=r(U);_interactivityChecker=r(le);_doc=r(K);_container=r(zt,{optional:!0});_focusTrap=null;_elementFocusedBeforeDrawerWasOpened=null;_eventCleanups;_isAttached=!1;_anchor=null;get position(){return this._position}set position(t){t=t==="end"?"end":"start",t!==this._position&&(this._isAttached&&this._updatePositionInParent(t),this._position=t,this.onPositionChanged.emit())}_position="start";get mode(){return this._mode}set mode(t){this._mode=t,this._updateFocusTrapState(),this._modeChanged.next(),this._getContent()?._drawerModeChanged()}_mode="over";get disableClose(){return this._disableClose}set disableClose(t){this._disableClose=y(t)}_disableClose=!1;get autoFocus(){let t=this._autoFocus;return t??(this.mode==="side"?"dialog":"first-tabbable")}set autoFocus(t){(t==="true"||t==="false"||t==null)&&(t=y(t)),this._autoFocus=t}_autoFocus;get opened(){return this._opened()}set opened(t){this.toggle(y(t))}_opened=C(!1);_openedVia=null;_animationStarted=new b;_animationEnd=new b;openedChange=new st(!0);_openedStream=this.openedChange.pipe(j(t=>t),ot(()=>{}));openedStart=this._animationStarted.pipe(j(()=>this.opened),Ct(void 0));_closedStream=this.openedChange.pipe(j(t=>!t),ot(()=>{}));closedStart=this._animationStarted.pipe(j(()=>!this.opened),Ct(void 0));_destroyed=new b;onPositionChanged=new st;_content;_modeChanged=new b;_injector=r(W);_changeDetectorRef=r(tt);constructor(){this.openedChange.pipe(S(this._destroyed)).subscribe(t=>{t?(this._elementFocusedBeforeDrawerWasOpened=this._doc.activeElement,this._takeFocus()):this._isFocusWithinDrawer()&&this._restoreFocus(this._openedVia||"program")}),this._eventCleanups=this._ngZone.runOutsideAngular(()=>{let t=this._renderer,e=this._elementRef.nativeElement;return[t.listen(e,"keydown",n=>{n.keyCode===27&&!this.disableClose&&!de(n)&&this._ngZone.run(()=>{this.close(),n.stopPropagation(),n.preventDefault()})}),t.listen(e,"transitionend",this._handleTransitionEvent),t.listen(e,"transitioncancel",this._handleTransitionEvent)]}),this._animationEnd.subscribe(()=>{this.openedChange.emit(this.opened)})}_focusByCssSelector(t,e){let n=this._elementRef.nativeElement.querySelector(t);n&&(this._interactivityChecker.isFocusable(n)||(n.tabIndex=-1,this._ngZone.runOutsideAngular(()=>{let a=()=>{o(),q(),n.removeAttribute("tabindex")},o=this._renderer.listen(n,"blur",a),q=this._renderer.listen(n,"mousedown",a)})),n.focus(e))}_takeFocus(){if(!this._focusTrap)return;let t=this._elementRef.nativeElement;switch(this.autoFocus){case!1:case"dialog":return;case!0:case"first-tabbable":gt(()=>{!this._focusTrap.focusInitialElement()&&typeof t.focus=="function"&&t.focus()},{injector:this._injector});break;case"first-heading":this._focusByCssSelector('h1, h2, h3, h4, h5, h6, [role="heading"]');break;default:this._focusByCssSelector(this.autoFocus);break}}_restoreFocus(t){this.autoFocus!=="dialog"&&(this._elementFocusedBeforeDrawerWasOpened?this._focusMonitor.focusVia(this._elementFocusedBeforeDrawerWasOpened,t):this._elementRef.nativeElement.blur(),this._elementFocusedBeforeDrawerWasOpened=null)}_isFocusWithinDrawer(){let t=this._doc.activeElement;return!!t&&this._elementRef.nativeElement.contains(t)}ngAfterViewInit(){this._isAttached=!0,this._position==="end"&&this._updatePositionInParent("end"),this._platform.isBrowser&&(this._focusTrap=this._focusTrapFactory.create(this._elementRef.nativeElement),this._updateFocusTrapState())}ngOnDestroy(){this._eventCleanups.forEach(t=>t()),this._focusTrap?.destroy(),this._anchor?.remove(),this._anchor=null,this._animationStarted.complete(),this._animationEnd.complete(),this._modeChanged.complete(),this._destroyed.next(),this._destroyed.complete()}open(t){return this.toggle(!0,t)}close(){return this.toggle(!1)}_closeViaBackdropClick(){return this._setOpen(!1,!0,"mouse")}toggle(t=!this.opened,e){t&&e&&(this._openedVia=e);let n=this._setOpen(t,!t&&this._isFocusWithinDrawer(),this._openedVia||"program");return t||(this._openedVia=null),n}_setOpen(t,e,n){return t===this.opened?Promise.resolve(t?"open":"close"):(this._opened.set(t),this._getContent()?._drawerToggled(this),this._container?._transitionsEnabled?(this._setIsAnimating(!0),setTimeout(()=>this._animationStarted.next())):setTimeout(()=>{this._animationStarted.next(),this._animationEnd.next()}),this._elementRef.nativeElement.classList.toggle("mat-drawer-opened",t),!t&&e&&this._restoreFocus(n),this._changeDetectorRef.markForCheck(),this._updateFocusTrapState(),new Promise(a=>{this.openedChange.pipe(St(1)).subscribe(o=>a(o?"open":"close"))}))}_getContent(){return this._container?._content||this._container?._userContent}_setIsAnimating(t){this._elementRef.nativeElement.classList.toggle("mat-drawer-animating",t)}_getWidth(){return this._elementRef.nativeElement.offsetWidth||0}_updateFocusTrapState(){this._focusTrap&&(this._focusTrap.enabled=this.opened&&!!this._container?._isShowingBackdrop())}_updatePositionInParent(t){if(!this._platform.isBrowser)return;let e=this._elementRef.nativeElement,n=e.parentNode;t==="end"?(this._anchor||(this._anchor=this._doc.createComment("mat-drawer-anchor"),n.insertBefore(this._anchor,e)),n.appendChild(e)):this._anchor&&this._anchor.parentNode.insertBefore(e,this._anchor)}_handleTransitionEvent=t=>{let e=this._elementRef.nativeElement;t.target===e&&this._ngZone.run(()=>{t.type==="transitionend"&&this._setIsAnimating(!1),this._animationEnd.next(t)})};static \u0275fac=function(e){return new(e||i)};static \u0275cmp=g({type:i,selectors:[["mat-drawer"]],viewQuery:function(e,n){if(e&1&&J(gi,5),e&2){let a;h(a=p())&&(n._content=a.first)}},hostAttrs:[1,"mat-drawer"],hostVars:12,hostBindings:function(e,n){e&2&&(M("align",null)("tabIndex",n.mode!=="side"?"-1":null),lt("visibility",!n._container&&!n.opened?"hidden":null),f("mat-drawer-end",n.position==="end")("mat-drawer-over",n.mode==="over")("mat-drawer-push",n.mode==="push")("mat-drawer-side",n.mode==="side"))},inputs:{position:"position",mode:"mode",disableClose:"disableClose",autoFocus:"autoFocus",opened:"opened"},outputs:{openedChange:"openedChange",_openedStream:"opened",openedStart:"openedStart",_closedStream:"closed",closedStart:"closedStart",onPositionChanged:"positionChanged"},exportAs:["matDrawer"],ngContentSelectors:vt,decls:3,vars:0,consts:[["content",""],["cdkScrollable","",1,"mat-drawer-inner-container"]],template:function(e,n){e&1&&(w(),s(0,"div",1,0),d(2),c())},dependencies:[at],encapsulation:2})}return i})(),Lt=(()=>{class i{_dir=r(_t,{optional:!0});_element=r(v);_ngZone=r(R);_changeDetectorRef=r(tt);_animationDisabled=ft();_transitionsEnabled=!1;_allDrawers;_drawers=new Ht;_content;_userContent;get start(){return this._start}get end(){return this._end}get autosize(){return this._autosize}set autosize(t){this._autosize=y(t)}_autosize=r(yi);get hasBackdrop(){return this._drawerHasBackdrop(this._start)||this._drawerHasBackdrop(this._end)}set hasBackdrop(t){this._backdropOverride=t==null?null:y(t)}_backdropOverride=null;backdropClick=new st;_start=null;_end=null;_left=null;_right=null;_destroyed=new b;_doCheckSubject=new b;_contentMargins={left:null,right:null};_contentMarginChanges=new b;get scrollable(){return this._userContent||this._content}_injector=r(W);constructor(){let t=r(I),e=r(Ee);this._dir?.change.pipe(S(this._destroyed)).subscribe(()=>{this._validateDrawers(),this.updateContentMargins()}),e.change().pipe(S(this._destroyed)).subscribe(()=>this.updateContentMargins()),!this._animationDisabled&&t.isBrowser&&this._ngZone.runOutsideAngular(()=>{setTimeout(()=>{this._element.nativeElement.classList.add("mat-drawer-transition"),this._transitionsEnabled=!0},200)})}ngAfterContentInit(){this._allDrawers.changes.pipe(pt(this._allDrawers),S(this._destroyed)).subscribe(t=>{this._drawers.reset(t.filter(e=>!e._container||e._container===this)),this._drawers.notifyOnChanges()}),this._drawers.changes.pipe(pt(null)).subscribe(()=>{this._validateDrawers(),this._drawers.forEach(t=>{this._watchDrawerToggle(t),this._watchDrawerPosition(t),this._watchDrawerMode(t)}),(!this._drawers.length||this._isDrawerOpen(this._start)||this._isDrawerOpen(this._end))&&this.updateContentMargins(),this._changeDetectorRef.markForCheck()}),this._ngZone.runOutsideAngular(()=>{this._doCheckSubject.pipe(Wt(10),S(this._destroyed)).subscribe(()=>this.updateContentMargins())})}ngOnDestroy(){this._contentMarginChanges.complete(),this._doCheckSubject.complete(),this._drawers.destroy(),this._destroyed.next(),this._destroyed.complete()}open(){this._drawers.forEach(t=>t.open())}close(){this._drawers.forEach(t=>t.close())}updateContentMargins(){let t=0,e=0;if(this._left&&this._left.opened){if(this._left.mode=="side")t+=this._left._getWidth();else if(this._left.mode=="push"){let n=this._left._getWidth();t+=n,e-=n}}if(this._right&&this._right.opened){if(this._right.mode=="side")e+=this._right._getWidth();else if(this._right.mode=="push"){let n=this._right._getWidth();e+=n,t-=n}}t=t||null,e=e||null,(t!==this._contentMargins.left||e!==this._contentMargins.right)&&(this._contentMargins={left:t,right:e},this._ngZone.run(()=>this._contentMarginChanges.next(this._contentMargins)))}ngDoCheck(){this._autosize&&this._isPushed()&&this._ngZone.runOutsideAngular(()=>this._doCheckSubject.next())}_watchDrawerToggle(t){t._animationStarted.pipe(S(this._drawers.changes)).subscribe(()=>{this.updateContentMargins(),this._changeDetectorRef.markForCheck()}),t.mode!=="side"&&t.openedChange.pipe(S(this._drawers.changes)).subscribe(()=>this._setContainerClass(t.opened))}_watchDrawerPosition(t){t.onPositionChanged.pipe(S(this._drawers.changes)).subscribe(()=>{gt({read:()=>this._validateDrawers()},{injector:this._injector})})}_watchDrawerMode(t){t._modeChanged.pipe(S(ht(this._drawers.changes,this._destroyed))).subscribe(()=>{this.updateContentMargins(),this._changeDetectorRef.markForCheck()})}_setContainerClass(t){let e=this._element.nativeElement.classList,n="mat-drawer-container-has-open";t?e.add(n):e.remove(n)}_validateDrawers(){this._start=this._end=null,this._drawers.forEach(t=>{t.position=="end"?(this._end!=null,this._end=t):(this._start!=null,this._start=t)}),this._right=this._left=null,this._dir&&this._dir.value==="rtl"?(this._left=this._end,this._right=this._start):(this._left=this._start,this._right=this._end)}_isPushed(){return this._isDrawerOpen(this._start)&&this._start.mode!="over"||this._isDrawerOpen(this._end)&&this._end.mode!="over"}_onBackdropClicked(){this.backdropClick.emit(),this._closeModalDrawersViaBackdrop()}_closeModalDrawersViaBackdrop(){[this._start,this._end].filter(t=>t&&!t.disableClose&&this._drawerHasBackdrop(t)).forEach(t=>t._closeViaBackdropClick())}_isShowingBackdrop(){return this._isDrawerOpen(this._start)&&this._drawerHasBackdrop(this._start)||this._isDrawerOpen(this._end)&&this._drawerHasBackdrop(this._end)}_isDrawerOpen(t){return t!=null&&t.opened}_drawerHasBackdrop(t){return this._backdropOverride==null?!!t&&t.mode!=="side":this._backdropOverride}static \u0275fac=function(e){return new(e||i)};static \u0275cmp=g({type:i,selectors:[["mat-drawer-container"]],contentQueries:function(e,n,a){if(e&1&&P(a,dt,5)(a,Ft,5),e&2){let o;h(o=p())&&(n._content=o.first),h(o=p())&&(n._allDrawers=o)}},viewQuery:function(e,n){if(e&1&&J(dt,5),e&2){let a;h(a=p())&&(n._userContent=a.first)}},hostAttrs:[1,"mat-drawer-container"],hostVars:2,hostBindings:function(e,n){e&2&&f("mat-drawer-container-explicit-backdrop",n._backdropOverride)},inputs:{autosize:"autosize",hasBackdrop:"hasBackdrop"},outputs:{backdropClick:"backdropClick"},exportAs:["matDrawerContainer"],features:[L([{provide:zt,useExisting:i}])],ngContentSelectors:Ae,decls:4,vars:2,consts:[[1,"mat-drawer-backdrop",3,"mat-drawer-shown"],[1,"mat-drawer-backdrop",3,"click"]],template:function(e,n){e&1&&(w(Te),z(0,fi,1,2,"div",0),d(1),d(2,1),z(3,_i,2,0,"mat-drawer-content")),e&2&&(B(n.hasBackdrop?0:-1),m(3),B(n._content?-1:3))},dependencies:[dt],styles:[`.mat-drawer-container {
  position: relative;
  z-index: 1;
  color: var(--%NS%mat-sidenav-content-text-color, var(--%NS%mat-sys-on-background));
  background-color: var(--%NS%mat-sidenav-content-background-color, var(--%NS%mat-sys-background));
  box-sizing: border-box;
  display: block;
  overflow: hidden;
}
.mat-drawer-container[fullscreen] {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
}
.mat-drawer-container[fullscreen].mat-drawer-container-has-open {
  overflow: hidden;
}
.mat-drawer-container.mat-drawer-container-explicit-backdrop .mat-drawer-side {
  z-index: 3;
}
.mat-drawer-container.ng-animate-disabled .mat-drawer-backdrop,
.mat-drawer-container.ng-animate-disabled .mat-drawer-content, .ng-animate-disabled .mat-drawer-container .mat-drawer-backdrop,
.ng-animate-disabled .mat-drawer-container .mat-drawer-content {
  transition: none;
}

.mat-drawer-backdrop {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  display: block;
  z-index: 3;
  visibility: hidden;
}
.mat-drawer-backdrop.mat-drawer-shown {
  visibility: visible;
  background-color: var(--%NS%mat-sidenav-scrim-color, color-mix(in srgb, var(--%NS%mat-sys-neutral-variant20) 40%, transparent));
}
.mat-drawer-transition .mat-drawer-backdrop {
  transition-duration: 400ms;
  transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
  transition-property: background-color, visibility;
}
@media (forced-colors: active) {
  .mat-drawer-backdrop {
    opacity: 0.5;
  }
}

.mat-drawer-content {
  position: relative;
  z-index: 1;
  display: block;
  height: 100%;
  overflow: auto;
}
.mat-drawer-content.mat-drawer-content-hidden {
  opacity: 0;
}
.mat-drawer-transition .mat-drawer-content {
  transition-duration: 400ms;
  transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
  transition-property: transform, margin-left, margin-right;
}

.mat-drawer {
  position: relative;
  z-index: 4;
  color: var(--%NS%mat-sidenav-container-text-color, var(--%NS%mat-sys-on-surface-variant));
  box-shadow: var(--%NS%mat-sidenav-container-elevation-shadow, none);
  background-color: var(--%NS%mat-sidenav-container-background-color, var(--%NS%mat-sys-surface));
  border-top-right-radius: var(--%NS%mat-sidenav-container-shape, var(--%NS%mat-sys-corner-large));
  border-bottom-right-radius: var(--%NS%mat-sidenav-container-shape, var(--%NS%mat-sys-corner-large));
  width: var(--%NS%mat-sidenav-container-width, 360px);
  display: block;
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 3;
  outline: 0;
  box-sizing: border-box;
  overflow-y: auto;
  transform: translate3d(-100%, 0, 0);
}
@media (forced-colors: active) {
  .mat-drawer, [dir=rtl] .mat-drawer.mat-drawer-end {
    border-right: solid 1px currentColor;
  }
}
@media (forced-colors: active) {
  [dir=rtl] .mat-drawer, .mat-drawer.mat-drawer-end {
    border-left: solid 1px currentColor;
    border-right: none;
  }
}
.mat-drawer.mat-drawer-side {
  z-index: 2;
}
.mat-drawer.mat-drawer-end {
  right: 0;
  transform: translate3d(100%, 0, 0);
  border-top-left-radius: var(--%NS%mat-sidenav-container-shape, var(--%NS%mat-sys-corner-large));
  border-bottom-left-radius: var(--%NS%mat-sidenav-container-shape, var(--%NS%mat-sys-corner-large));
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
[dir=rtl] .mat-drawer {
  border-top-left-radius: var(--%NS%mat-sidenav-container-shape, var(--%NS%mat-sys-corner-large));
  border-bottom-left-radius: var(--%NS%mat-sidenav-container-shape, var(--%NS%mat-sys-corner-large));
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  transform: translate3d(100%, 0, 0);
}
[dir=rtl] .mat-drawer.mat-drawer-end {
  border-top-right-radius: var(--%NS%mat-sidenav-container-shape, var(--%NS%mat-sys-corner-large));
  border-bottom-right-radius: var(--%NS%mat-sidenav-container-shape, var(--%NS%mat-sys-corner-large));
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  left: 0;
  right: auto;
  transform: translate3d(-100%, 0, 0);
}
.mat-drawer-transition .mat-drawer {
  transition: transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1);
}
.mat-drawer:not(.mat-drawer-opened):not(.mat-drawer-animating) {
  visibility: hidden;
  box-shadow: none;
}
.mat-drawer:not(.mat-drawer-opened):not(.mat-drawer-animating) .mat-drawer-inner-container {
  display: none;
}
.mat-drawer.mat-drawer-opened.mat-drawer-opened {
  transform: none;
}

.mat-drawer-side {
  box-shadow: none;
  border-right-color: var(--%NS%mat-sidenav-container-divider-color, transparent);
  border-right-width: 1px;
  border-right-style: solid;
}
.mat-drawer-side.mat-drawer-end {
  border-left-color: var(--%NS%mat-sidenav-container-divider-color, transparent);
  border-left-width: 1px;
  border-left-style: solid;
  border-right: none;
}
[dir=rtl] .mat-drawer-side {
  border-left-color: var(--%NS%mat-sidenav-container-divider-color, transparent);
  border-left-width: 1px;
  border-left-style: solid;
  border-right: none;
}
[dir=rtl] .mat-drawer-side.mat-drawer-end {
  border-right-color: var(--%NS%mat-sidenav-container-divider-color, transparent);
  border-right-width: 1px;
  border-right-style: solid;
  border-left: none;
}

.mat-drawer-inner-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.mat-sidenav-fixed {
  position: fixed;
}
`],encapsulation:2})}return i})(),bt=(()=>{class i extends dt{static \u0275fac=(()=>{let t;return function(n){return(t||(t=N(i)))(n||i)}})();static \u0275cmp=g({type:i,selectors:[["mat-sidenav-content"]],hostAttrs:[1,"mat-drawer-content","mat-sidenav-content"],features:[L([{provide:at,useExisting:i},{provide:dt,useExisting:i}]),D],ngContentSelectors:vt,decls:1,vars:0,template:function(e,n){e&1&&(w(),d(0))},encapsulation:2})}return i})(),Bt=(()=>{class i extends Ft{get fixedInViewport(){return this._fixedInViewport}set fixedInViewport(t){this._fixedInViewport=y(t)}_fixedInViewport=!1;get fixedTopGap(){return this._fixedTopGap}set fixedTopGap(t){this._fixedTopGap=et(t)}_fixedTopGap=0;get fixedBottomGap(){return this._fixedBottomGap}set fixedBottomGap(t){this._fixedBottomGap=et(t)}_fixedBottomGap=0;static \u0275fac=(()=>{let t;return function(n){return(t||(t=N(i)))(n||i)}})();static \u0275cmp=g({type:i,selectors:[["mat-sidenav"]],hostAttrs:[1,"mat-drawer","mat-sidenav"],hostVars:16,hostBindings:function(e,n){e&2&&(M("tabIndex",n.mode!=="side"?"-1":null)("align",null),lt("top",n.fixedInViewport?n.fixedTopGap:null,"px")("bottom",n.fixedInViewport?n.fixedBottomGap:null,"px"),f("mat-drawer-end",n.position==="end")("mat-drawer-over",n.mode==="over")("mat-drawer-push",n.mode==="push")("mat-drawer-side",n.mode==="side")("mat-sidenav-fixed",n.fixedInViewport))},inputs:{fixedInViewport:"fixedInViewport",fixedTopGap:"fixedTopGap",fixedBottomGap:"fixedBottomGap"},exportAs:["matSidenav"],features:[L([{provide:Ft,useExisting:i}]),D],ngContentSelectors:vt,decls:3,vars:0,consts:[["content",""],["cdkScrollable","",1,"mat-drawer-inner-container"]],template:function(e,n){e&1&&(w(),s(0,"div",1,0),d(2),c())},dependencies:[at],encapsulation:2})}return i})(),Fe=(()=>{class i extends Lt{_allDrawers=void 0;_content=void 0;static \u0275fac=(()=>{let t;return function(n){return(t||(t=N(i)))(n||i)}})();static \u0275cmp=g({type:i,selectors:[["mat-sidenav-container"]],contentQueries:function(e,n,a){if(e&1&&P(a,bt,5)(a,Bt,5),e&2){let o;h(o=p())&&(n._content=o.first),h(o=p())&&(n._allDrawers=o)}},hostAttrs:[1,"mat-drawer-container","mat-sidenav-container"],hostVars:2,hostBindings:function(e,n){e&2&&f("mat-drawer-container-explicit-backdrop",n._backdropOverride)},exportAs:["matSidenavContainer"],features:[L([{provide:zt,useExisting:i},{provide:Lt,useExisting:i}]),D],ngContentSelectors:Ae,decls:4,vars:2,consts:[[1,"mat-drawer-backdrop",3,"mat-drawer-shown"],[1,"mat-drawer-backdrop",3,"click"]],template:function(e,n){e&1&&(w(Te),z(0,bi,1,2,"div",0),d(1),d(2,1),z(3,vi,2,0,"mat-sidenav-content")),e&2&&(B(n.hasBackdrop?0:-1),m(3),B(n._content?-1:3))},dependencies:[bt],styles:[wi],encapsulation:2})}return i})(),Le=(()=>{class i{static \u0275fac=function(e){return new(e||i)};static \u0275mod=k({type:i});static \u0275inj=x({imports:[At,T,At]})}return i})();var ki=["*",[["mat-toolbar-row"]]],Si=["*","mat-toolbar-row"],Ci=(()=>{class i{static \u0275fac=function(e){return new(e||i)};static \u0275dir=_({type:i,selectors:[["mat-toolbar-row"]],hostAttrs:[1,"mat-toolbar-row"],exportAs:["matToolbarRow"]})}return i})(),ze=(()=>{class i{_elementRef=r(v);_platform=r(I);_document=r(K);color;_toolbarRows;ngAfterViewInit(){this._platform.isBrowser&&(this._checkToolbarMixedModes(),this._toolbarRows.changes.subscribe(()=>this._checkToolbarMixedModes()))}_checkToolbarMixedModes(){this._toolbarRows.length}static \u0275fac=function(e){return new(e||i)};static \u0275cmp=g({type:i,selectors:[["mat-toolbar"]],contentQueries:function(e,n,a){if(e&1&&P(a,Ci,5),e&2){let o;h(o=p())&&(n._toolbarRows=o)}},hostAttrs:[1,"mat-toolbar"],hostVars:6,hostBindings:function(e,n){e&2&&($t(n.color?"mat-"+n.color:""),f("mat-toolbar-multiple-rows",n._toolbarRows.length>0)("mat-toolbar-single-row",n._toolbarRows.length===0))},inputs:{color:"color"},exportAs:["matToolbar"],ngContentSelectors:Si,decls:2,vars:0,template:function(e,n){e&1&&(w(ki),d(0),d(1,1))},styles:[`.mat-toolbar {
  background: var(--%NS%mat-toolbar-container-background-color, var(--%NS%mat-sys-surface));
  color: var(--%NS%mat-toolbar-container-text-color, var(--%NS%mat-sys-on-surface));
}
.mat-toolbar, .mat-toolbar h1, .mat-toolbar h2, .mat-toolbar h3, .mat-toolbar h4, .mat-toolbar h5, .mat-toolbar h6 {
  font-family: var(--%NS%mat-toolbar-title-text-font, var(--%NS%mat-sys-title-large-font));
  font-size: var(--%NS%mat-toolbar-title-text-size, var(--%NS%mat-sys-title-large-size));
  line-height: var(--%NS%mat-toolbar-title-text-line-height, var(--%NS%mat-sys-title-large-line-height));
  font-weight: var(--%NS%mat-toolbar-title-text-weight, var(--%NS%mat-sys-title-large-weight));
  letter-spacing: var(--%NS%mat-toolbar-title-text-tracking, var(--%NS%mat-sys-title-large-tracking));
  margin: 0;
}
@media (forced-colors: active) {
  .mat-toolbar {
    outline: solid 1px;
  }
}
.mat-toolbar .mat-form-field-underline,
.mat-toolbar .mat-form-field-ripple,
.mat-toolbar .mat-focused .mat-form-field-ripple {
  background-color: currentColor;
}
.mat-toolbar .mat-form-field-label,
.mat-toolbar .mat-focused .mat-form-field-label,
.mat-toolbar .mat-select-value,
.mat-toolbar .mat-select-arrow,
.mat-toolbar .mat-form-field.mat-focused .mat-select-arrow {
  color: inherit;
}
.mat-toolbar .mat-input-element {
  caret-color: currentColor;
}
.mat-toolbar .mat-mdc-button-base.mat-mdc-button-base.mat-unthemed {
  --%NS%mat-button-text-label-text-color: var(--%NS%mat-toolbar-container-text-color, var(--%NS%mat-sys-on-surface));
  --%NS%mat-button-outlined-label-text-color: var(--%NS%mat-toolbar-container-text-color, var(--%NS%mat-sys-on-surface));
}

.mat-toolbar-row, .mat-toolbar-single-row {
  display: flex;
  box-sizing: border-box;
  padding: 0 16px;
  width: 100%;
  flex-direction: row;
  align-items: center;
  white-space: nowrap;
  height: var(--%NS%mat-toolbar-standard-height, 64px);
}
@media (max-width: 599px) {
  .mat-toolbar-row, .mat-toolbar-single-row {
    height: var(--%NS%mat-toolbar-mobile-height, 56px);
  }
}

.mat-toolbar-multiple-rows {
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  width: 100%;
  min-height: var(--%NS%mat-toolbar-standard-height, 64px);
}
@media (max-width: 599px) {
  .mat-toolbar-multiple-rows {
    min-height: var(--%NS%mat-toolbar-mobile-height, 56px);
  }
}
`],encapsulation:2})}return i})();var Be=(()=>{class i{static \u0275fac=function(e){return new(e||i)};static \u0275mod=k({type:i});static \u0275inj=x({imports:[T]})}return i})();var mt="https://github.com/Celtian/qdb-converter",Pe=[{path:"validation-and-export",slug:"validation-and-export",title:"Dataset tools",label:"Dataset tools",icon:"fact_check",content:{eyebrow:"Dataset tools",title:"Check, optimize, and publish managed data",summary:"Validation and Playernames work with either library. Playernames overwrites the selected managed copy or creates a new Converted result, while Export creates an external copy.",actions:[{label:"Manage datasets",route:"/managing-datasets",primary:!0},{label:"Conversion guide",route:"/converting"}],sections:[{eyebrow:"Validate",title:"Choose the managed dataset type",paragraphs:["Select Imported dataset or Converted dataset, find the snapshot by name, and run validation. The report summarizes errors and warnings and groups issues by table and field where possible."],items:["Imported snapshots are checked against their detected FIFA edition.","Converted snapshots are checked against their target FIFA edition.","Validation does not modify or repair the snapshot.","Run the report again after replacing or recreating problematic data."]},{eyebrow:"Playernames",title:"Close ID holes or remove unused names",paragraphs:["Choose an imported or converted snapshot, then select Minimize, Remove unused, or both. Combined runs remove unreferenced playernames and dcplayernames rows first, then assign contiguous IDs and rewrite firstnameid, lastnameid, playerjerseynameid, and commonnameid references in players.","Before the run, one control-free canvas shows playernames and dcplayernames in separate rows on a shared ID axis. Matching IDs align across rows, headline totals sum both tables, disjoint schema ranges are placed next to each other without inventing holes in the invalid numeric gap, and editions without dcplayernames show one row. The canvas distinguishes occupied runs, active-span holes, remaining capacity, and IDs outside each table\u2019s published FIFA range. Drag horizontally to pan, pinch or use Ctrl/Cmd plus the wheel to zoom, and double-click to reset. Hover or use the arrow keys to inspect a table row and contiguous run. If strict validation finds duplicate or ambiguous references after profiling, the chart remains available for diagnostics while operations stay blocked. Dataset details retain the same before-and-after Playernames views, while their live inspection shows separate cards only for fifatables-supported tables. Preserved unsupported text files remain listed through the import warning instead of appearing as table cards.","Overwrite the selected application-managed dataset after confirmation or save a new entry in Converted datasets. Both choices produce a complete DB Master text snapshot, including unaffected and otherwise unsupported text tables."],items:["Overwrite changes only the selected managed copy; original external sources are never modified.","Managed names must be unique and no longer than 80 characters.","Minimize repairs referenced integer IDs outside the published range when capacity permits; Remove unused alone requires IDs to already be in range.","Missing or ambiguous references, duplicate or invalid IDs, and range-capacity overflow stop the operation.","Copy-on-write installation leaves the existing managed snapshot active after failure or cancellation.","Overwriting a managed t3db import converts its application-owned representation to text while preserving its original t3db provenance."]},{eyebrow:"Export",title:"Select a converted dataset and destination",paragraphs:["Choose an available converted dataset and a parent destination folder. QDB Converter creates a uniquely named child folder, writes the complete snapshot, and offers Reveal in folder when the export succeeds."],steps:["Select the converted dataset.","Choose the parent output folder.","Review the destination summary.","Export and reveal the resulting child folder."]},{eyebrow:"Text contract",title:"Write deterministic DB Master text",paragraphs:["Each table uses target-schema field order, a UTF-16LE byte-order mark, tab separators, CRLF line endings, and DB Master-compatible quoting. Repeated exports create new folders rather than overwriting earlier output."]},{eyebrow:"Safety",title:"Keep managed and external files independent",paragraphs:["Deleting a converted or Playernames result later removes only its application-owned managed copy. Previously exported folders remain where you created them."],note:"Export requires a converted dataset. Playernames can use either an imported or converted source."}]}},{path:"settings",slug:"settings",title:"Settings",label:"Settings",icon:"settings",content:{eyebrow:"Preferences and storage",title:"Control appearance, table layouts, and managed copies",summary:"Settings stores local desktop preferences and provides explicit cleanup controls for application-owned datasets.",sections:[{eyebrow:"Theme",title:"Follow the desktop or choose an appearance",paragraphs:["System follows the current operating-system appearance. Light and Dark keep the selected application theme until you change it again."]},{eyebrow:"Columns",title:"Configure both dataset table layouts",paragraphs:["The Dataset column layouts card contains Imported and Converted tabs. Each tab edits the default visibility and order for its library while keeping required Name and Actions columns available."],items:["Toggle optional columns.","Move columns with pointer, touch, or keyboard controls.","Save changes immediately.","Reset only the active library to its default layout."]},{eyebrow:"Storage",title:"Delete selected managed libraries",paragraphs:["Choose Imported datasets, Converted datasets, or both. The action is disabled when nothing is selected or the selected library is empty, and confirmation reports the number and category of managed copies that will be removed."],note:"Cleanup never deletes original source files or folders, and it never deletes previously exported folders."}]}},{path:"development",slug:"development",title:"Development",label:"Development",icon:"code",content:{eyebrow:"Contributor guide",title:"Develop the desktop app and documentation together",summary:"The repository uses Bun, Angular 22, Electron, strict TypeScript, Vitest, Angular Material, and Electron Forge.",actions:[{label:"Browse the source",href:mt,primary:!0},{label:"Read CONTRIBUTING.md",href:`${mt}/blob/master/CONTRIBUTING.md`}],facts:[{label:"Bun",value:"1.3.14"},{label:"Node.js",value:"24.18.x"},{label:"Angular",value:"22"},{label:"Electron",value:"43"}],sections:[{eyebrow:"Setup",title:"Install and run",paragraphs:["Install the pinned dependencies, start the Electron development application, or serve the documentation separately."],code:`bun install --frozen-lockfile
bun run start

# Documentation only
bun run start:docs`},{eyebrow:"Workspace",title:"Know the project boundaries",paragraphs:["projects/electron/src contains the standalone Angular renderer. projects/electron/electron contains Electron main-process, preload, workers, storage, validation, and conversion code. projects/electron/shared contains serializable contracts. projects/docs contains the prerendered documentation site."]},{eyebrow:"Quality gates",title:"Run the same checks as CI",paragraphs:["The validation suite checks formatting, Angular and Node lint rules, strict type safety, Electron and docs unit tests, accessibility expectations, and coverage thresholds."],code:`bun run validate
bun run build

# Individual checks
bun run format:check
bun run lint
bun run typecheck
bun run test:coverage`},{eyebrow:"Packaging",title:"Build a local desktop package",paragraphs:["Desktop packaging builds the Electron renderer and main process, then asks Electron Forge to package the current host. Documentation is built by the aggregate build and release validation jobs, not bundled into the desktop ASAR."],code:"bun run package:desktop"}]}},{path:"releases",slug:"releases",title:"Releases",label:"Releases",icon:"new_releases",content:{eyebrow:"Delivery",title:"Stable Windows releases and versioned documentation",summary:"A stable version tag validates both Angular applications and Electron, publishes Windows artifacts with checksums, then updates GitHub Pages.",actions:[{label:"Latest release",href:`${mt}/releases/latest`,primary:!0},{label:"Release history",href:`${mt}/releases`},{label:"Changelog",href:`${mt}/blob/master/CHANGELOG.md`}],sections:[{eyebrow:"Trigger",title:"Publish from a stable semantic-version tag",paragraphs:["Tags matching vMAJOR.MINOR.PATCH must point to the current master commit and match package.json. The release workflow stops before publishing when either check fails."]},{eyebrow:"Validation",title:"Build once before publishing",paragraphs:["Ubuntu installs pinned dependencies, validates source and tests, builds the Electron renderer, documentation, and Electron main process, verifies the output layout, and uploads documentation plus generated version metadata for downstream jobs."]},{eyebrow:"Windows",title:"Publish installer and portable assets",paragraphs:["The Windows job creates Squirrel Setup, update metadata, NuGet package, and portable ZIP assets. Every published file receives its own lowercase SHA-256 sidecar, and GitHub-generated release notes include unsigned-application guidance."]},{eyebrow:"Documentation",title:"Deploy only after the Windows release succeeds",paragraphs:["The prerendered site is published to the gh-pages branch under /qdb-converter/. A copy of index.html is stored as 404.html so direct navigation and refreshes can return to Angular routing."]}]}}];var Ve="https://github.com/Celtian/qdb-converter",wt=[{path:"",slug:"overview",title:"Documentation",label:"Overview",icon:"home",content:{eyebrow:"Local-first desktop app",title:"Convert FIFA databases with a reviewable workflow",summary:"Import DB Master text folders or paired PC t3db sources, validate managed snapshots, convert compatible tables between FIFA 11\u201323, repair player-name tables, and export deterministic text datasets.",actions:[{label:"Download for Windows",route:"/download",primary:!0},{label:"Start with importing",route:"/importing"}],facts:[{label:"Supported games",value:"FIFA 11\u201323"},{label:"Platform",value:"Windows x64"},{label:"Input formats",value:"Text folder or t3db + XML"},{label:"Output format",value:"DB Master text folder"}],sections:[{eyebrow:"01 \xB7 Import",title:"Make a managed source snapshot",paragraphs:["Choose one or more DB Master-compatible text folders, or pair a PC format-8 t3db database with its matching metadata XML. QDB Converter inspects the schema and identifies compatible FIFA editions before any managed copy is created.","Every selected source must pass structural and data validation. Imported snapshots live in application-owned storage; the source folder, database, and XML remain untouched."],actions:[{label:"Read the import guide",route:"/importing"}]},{eyebrow:"02 \xB7 Manage",title:"Keep source and converted datasets separate",paragraphs:["Browse, search, filter, sort, inspect, rename, validate, and remove imported and converted datasets from their separate libraries. Saved column visibility and ordering keep both tables focused on the information you use."],actions:[{label:"Manage datasets",route:"/managing-datasets"}]},{eyebrow:"03 \xB7 Convert",title:"Build against the target schema",paragraphs:["Select an imported dataset and a FIFA 11\u201323 target. The conversion engine includes every source table supported by the target, orders fields by the target schema, substitutes target defaults for unusable values, and creates an independent managed result."],actions:[{label:"Understand conversion",route:"/converting"}]},{eyebrow:"04 \xB7 Dataset tools",title:"Validate, optimize player names, and export",paragraphs:["Run validation on either library at any time. Inspect player-name ID ranges, close holes, repair out-of-range integer IDs, remove unused names, or combine both operations, then overwrite the selected managed snapshot or create a new Converted result. Export remains the path to an external folder."],actions:[{label:"Validation and export guide",route:"/validation-and-export"}]},{eyebrow:"Security",title:"Filesystem access stays in Electron",paragraphs:["The Angular renderer has no Node.js or direct filesystem access. A typed preload bridge exposes only dataset operations, while Electron validates requests and runs inspection, import, validation, conversion, and Playernames work outside the renderer."],wide:!0}]}},{path:"features",slug:"features",title:"Features",label:"Features",icon:"featured_play_list",content:{eyebrow:"Capabilities",title:"A focused pipeline from source data to portable output",summary:"QDB Converter keeps inspection, managed storage, conversion, validation, and export explicit so each result can be reviewed before it leaves the application.",actions:[{label:"Download the app",route:"/download",primary:!0},{label:"Import a dataset",route:"/importing"}],sections:[{eyebrow:"Sources",title:"Inspect two database formats",paragraphs:["Import DB Master-compatible text folders or a PC format-8 t3db database paired with metadata XML. The source chooser remembers the last format, supports multiple text sources in one queue, and shows detected tables, rows, FIFA compatibility, paths, and warnings."],items:["UTF-16LE DB Master text tables","Paired .db and .xml PC t3db sources","FIFA 11\u201323 compatibility detection","Validation before import"]},{eyebrow:"Libraries",title:"Manage application-owned copies",paragraphs:["Imported and converted datasets have separate catalogs and details. Opening details analyzes every managed table and shows its current ID holes, capacity, and out-of-range values when a canonical ranged row ID exists. Search and filters run against the current library, columns can be shown, hidden, and reordered, and destructive actions identify exactly which managed copies will be removed."],items:["Independent names and status badges","Search, filters, sorting, and pagination","Persistent table column layouts","Single and bulk deletion with confirmation"]},{eyebrow:"Conversion",title:"Produce target-shaped tables",paragraphs:["Conversion is deterministic for the same managed source and target edition. It keeps compatible tables and rows, writes target field order and defaults, and records table-level counts for substituted values and rating differences."],items:["Every target-compatible fifatables table","Target numeric ranges and defaults","Preserved stored overall ratings","Source contract and loan dates retained when valid"]},{eyebrow:"Output",title:"Validate, optimize, and export on demand",paragraphs:["Validate imported or converted snapshots without changing them. Playernames shows accessible before-and-after ID-range bars, can minimize and repair referenced IDs, remove unused rows, or apply both, then atomically overwrite the managed snapshot or create a new Converted result. Exports can be revealed directly in the operating-system file manager."]},{eyebrow:"Preferences",title:"Fit the desktop",paragraphs:["Follow the system appearance or choose a persistent light or dark theme. Configure imported and converted table layouts from one tabbed Settings card, and clear one or both managed libraries without affecting original sources or existing exports."]}]}},{path:"download",slug:"download",title:"Download and installation",label:"Download & installation",icon:"download",content:{eyebrow:"Windows x64",title:"Install QDB Converter or run it from a ZIP",summary:"Use the installer for the normal Windows setup or extract the portable ZIP. Official builds are published only through this project\u2019s GitHub Releases.",actions:[{label:"Open the latest release",href:`${Ve}/releases/latest`,primary:!0},{label:"View all releases",href:`${Ve}/releases`}],facts:[{label:"Recommended",value:"QDB-Converter-Setup.exe"},{label:"Alternative",value:"Windows x64 ZIP"},{label:"Updates",value:"GitHub Releases"},{label:"License",value:"MIT"}],sections:[{eyebrow:"Recommended",title:"Install with Setup",paragraphs:["Download QDB-Converter-Setup.exe from the latest release and run it. The installed application checks GitHub Releases for compatible updates when it starts."],steps:["Open the official latest release.","Download QDB-Converter-Setup.exe and its .sha256 sidecar.","Verify the checksum when you need additional assurance.","Run the installer and launch QDB Converter."]},{eyebrow:"Portable",title:"Run from the ZIP",paragraphs:["Download the Windows x64 ZIP, extract the complete archive to a writable folder, and run QDB Converter.exe. Do not run the executable from inside the compressed archive."]},{eyebrow:"Windows security",title:"Review unsigned-app warnings carefully",paragraphs:["Current releases are unsigned, so Windows SmartScreen or antivirus software may display a warning. Confirm that the asset came from the Celtian/qdb-converter release page and compare the supplied SHA-256 sidecar before deciding whether to continue."],note:"Do not disable antivirus globally to run the application."},{eyebrow:"First run",title:"Create your first managed dataset",paragraphs:["Open Import, select a source format, inspect the source, choose a compatible FIFA edition, validate it, and confirm the managed name. The original source remains unchanged."],actions:[{label:"Continue to importing",route:"/importing"}]}]}},{path:"importing",slug:"importing",title:"Importing",label:"Importing",icon:"upload_file",content:{eyebrow:"Source datasets",title:"Inspect and validate before creating a managed copy",summary:"The import wizard separates source selection, FIFA edition choice, validation, and the final import so an incompatible or damaged source cannot silently enter the library.",actions:[{label:"Manage imported datasets",route:"/managing-datasets",primary:!0},{label:"Conversion guide",route:"/converting"}],sections:[{eyebrow:"Step 1",title:"Choose the source format",paragraphs:["Text folder accepts one or more folders containing DB Master-compatible table files. PC t3db accepts exactly one .db file and its matching metadata .xml file. Changing formats clears the current selection to avoid mixing incompatible inputs."],table:{caption:"Supported import formats",columns:["Format","Files","Important requirement"],rows:[["Text folder","One folder per dataset","UTF-16LE table files with DB Master layout"],["PC t3db","One .db plus one .xml","PC format version 8 with matching metadata"]]}},{eyebrow:"Step 2",title:"Review detected source information",paragraphs:["Inspection reports the display name, source paths, source kind, table and row totals, compatible FIFA editions, and warnings. Rename a queued text source before import when the detected folder name is not useful."],note:"Inspection does not modify the selected files or folders."},{eyebrow:"Step 3",title:"Choose an edition and validate",paragraphs:["Select one compatible FIFA edition for each source, then run validation. Validation checks table structure, field values, identifiers, numeric ranges, and known relationships against that edition. Sources with errors cannot be imported."],items:["Warnings explain suspicious data that does not block import.","Errors identify data that must be corrected at the source.","Changing the chosen edition invalidates the previous validation.","Long-running validation and import operations can be cancelled."]},{eyebrow:"Step 4",title:"Create the managed snapshot",paragraphs:["Review the validated sources and names, then import them. QDB Converter creates private application-owned copies and refreshes the Imported datasets library."],note:"Removing an imported snapshot later deletes only the managed copy. Original source files are never removed."}]}},{path:"managing-datasets",slug:"managing-datasets",title:"Managing datasets",label:"Managing datasets",icon:"storage",content:{eyebrow:"Dataset libraries",title:"Search, inspect, and maintain managed snapshots",summary:"Imported datasets are conversion sources. Converted datasets are independent results. Each library has its own filters, columns, details, names, validation actions, and deletion boundaries.",actions:[{label:"Convert a dataset",route:"/converting",primary:!0},{label:"Settings guide",route:"/settings"}],sections:[{eyebrow:"Find",title:"Search, filter, sort, and page",paragraphs:["Search dataset names, open Filters to stage library-specific criteria, sort supported columns, and page through the results. Apply runs the staged filter set; Cancel discards draft changes; Clear all removes draft filters."],items:["Imported filters cover source kind, FIFA version, status, table count, and row count.","Converted filters cover source and target editions, status, table count, and row count.","Applied filters remain local to the desktop application."]},{eyebrow:"Columns",title:"Choose the visible table layout",paragraphs:["Open Columns to show, hide, and reorder optional fields. Drag a handle or use the keyboard controls, then Apply to save visibility and order. Reset to defaults restores the application layout.","Settings exposes the same preferences in one Dataset column layouts card with Imported and Converted tabs."]},{eyebrow:"Details",title:"Inspect provenance, IDs, and conversion summaries",paragraphs:["Imported details show the source format, original paths, detected FIFA edition, integrity status, size, table and row totals, and import time. Converted details add the source dataset, source and target editions, conversion time, and per-table conversion summary.","Each table card analyzes the current managed snapshot in a read-only worker. Its control-free range overview renders green occupied runs and amber hole runs proportionally across the active span, represents the complete remaining range with a compact gray capacity tail, and uses red edge indicators for occupied out-of-range values. Drag horizontally to pan; pinch or use Ctrl/Cmd plus the wheel to zoom while ordinary vertical wheel input continues scrolling the dialog. Double-click or press 0 to reset. Pointer and arrow-key inspection report each contiguous run\u2019s start, end, and count, while Page Up/Down and +/- provide keyboard pan and zoom. Duplicate and invalid identifiers remain visibly reported, and tables without a reliable unique ranged row ID show an explanatory unavailable state."]},{eyebrow:"Names",title:"Rename without changing the snapshot",paragraphs:["Rename a managed dataset from its details action. Names are kept unique within the relevant library and do not rename source files or existing exported folders."]},{eyebrow:"Deletion",title:"Remove only application-owned copies",paragraphs:["Delete one dataset from its details view, select multiple rows for bulk deletion, or use Settings to clear imported datasets, converted datasets, or both. Confirmation describes the affected managed records."],note:"Deleting imported data does not automatically delete converted results, and no catalog action deletes original sources or external exports.",wide:!0}]}},{path:"converting",slug:"converting",title:"Converting",label:"Converting",icon:"transform",content:{eyebrow:"FIFA 11\u201323",title:"Create an independent dataset for the target edition",summary:"Conversion reads one validated managed source, applies the target fifatables schema, and saves a new managed text dataset without changing the import.",actions:[{label:"Validation and export",route:"/validation-and-export",primary:!0},{label:"Review features",route:"/features"}],sections:[{eyebrow:"Step 1",title:"Select a source and target",paragraphs:["Choose an available imported dataset and a target from FIFA 11 through FIFA 23. Give the result a unique name in the Converted datasets library."],note:"A source with no tables supported by the target edition cannot produce a conversion."},{eyebrow:"Schema",title:"Map every compatible table",paragraphs:["For each supported source table, QDB Converter writes the target schema\u2019s field order. Missing, empty, non-numeric, out-of-range, or invalid date values use the target field default. Unsupported source fields and tables do not enter the result."],items:["String and numeric values are normalized for the target field type.","Target minimums, maximums, defaults, and date encoding are enforced.","Contract and loan dates remain unchanged when they are valid for the target.","The same source snapshot and target produce deterministic table content."]},{eyebrow:"Player ratings",title:"Preserve stored overall ratings",paragraphs:["Player overall ratings are copied rather than recalculated. When the stored value differs from the target edition\u2019s rating formula, the conversion summary reports the difference so it can be reviewed without silently changing the source decision."]},{eyebrow:"Result",title:"Review table-level conversion counts",paragraphs:["The completed result records table and row totals plus counts for substituted values and player rating differences. It becomes an independent managed dataset that can be renamed, validated, deleted, or exported."]}]}},...Pe];var rt={version:"0.0.6",date:"2026-08-08T17:05:42.076Z",author:{name:"Dominik Hlad\xEDk",email:"dominik.hladik@seznam.cz",url:"https://github.com/Celtian"},git:{branch:"HEAD",commit:"242b46011877c76330ec2cbb4e0c4ac7a1aa1f8a"}};var G="https://github.com/Celtian/qdb-converter",Pt=rt.version,je={version:Pt,versionLabel:`v${Pt}`,author:rt.author.name,copyrightYear:new Date(rt.date).getUTCFullYear(),links:{repository:G,version:`${G}/tree/v${Pt}`,latestRelease:`${G}/releases/latest`,releases:`${G}/releases`,changelog:`${G}/blob/master/CHANGELOG.md`,license:`${G}/blob/master/LICENSE.md`,issues:`${G}/issues`}};var We=new A("[ngxAppVersion] Options"),Qe=i=>({provide:We,useValue:{version:i.version}}),Ue=(()=>{class i{options=r(We);element=r(v);renderer=r(U);ngOnInit(){this.renderer.setAttribute(this.element.nativeElement,"app-version",this.options.version)}static \u0275fac=function(e){return new(e||i)};static \u0275dir=_({type:i,selectors:[["","ngxAppVersion",""]]})}return i})();var Mi=()=>({exact:!0}),Ii=(i,l)=>l.path;function Ri(i,l){if(i&1){let t=X();s(0,"button",24),F("click",function(){Z(t);let n=E();return $(n.toggleNavigation())}),s(1,"mat-icon",9),u(2,"menu"),c()()}if(i&2){let t=E();M("aria-expanded",t.navigationOpened())}}function Oi(i,l){if(i&1){let t=X();s(0,"a",25,0),F("click",function(){Z(t);let n=E();return $(n.closeNavigation())}),s(2,"mat-icon",26),u(3),c(),s(4,"span",27),u(5),c()()}if(i&2){let t=l.$implicit,e=It(1);O("activated",e.isActive)("routerLink","/"+t.path)("routerLinkActiveOptions",Xt(5,Mi)),m(3),Rt(t.icon),m(2),Rt(t.label)}}var Ei="(max-width: 620px)",yt=class i{breakpoint=r(ie);pages=wt;site=je;compactNavigation=Ce(this.breakpoint.observe(Ei).pipe(ot(l=>l.matches)),{initialValue:!1});mobileNavigationOpen=C(!1);navigationMode=ct(()=>this.compactNavigation()?"over":"side");navigationOpened=ct(()=>!this.compactNavigation()||this.mobileNavigationOpen());toggleNavigation(){this.mobileNavigationOpen.update(l=>!l)}closeNavigation(){this.compactNavigation()&&this.mobileNavigationOpen.set(!1)}navigationChanged(l){this.compactNavigation()&&!l&&this.mobileNavigationOpen.set(!1)}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=g({type:i,selectors:[["app-root"]],features:[Gt([Ue])],decls:47,vars:13,consts:[["activePage","routerLinkActive"],["href","#main-content",1,"fixed","top-2","left-2","z-100","rounded-lg","bg-inverse-surface","px-4","py-skip","font-bold","text-inverse-on-surface","no-underline"],[1,"sticky","top-0","z-20","shrink-0"],["type","button","matIconButton","","aria-label","Open documentation navigation","aria-controls","documentation-navigation",1,"mr-1"],["routerLink","/","aria-label","QDB Converter documentation home",1,"inline-flex","min-w-0","items-center","gap-brand-gap","text-base","font-bold","text-inherit","no-underline"],["ngSrc","qdb-converter-icon.png","width","28","height","28","alt","","priority",""],[1,"font-normal","text-on-surface-variant","max-mobile:hidden"],[1,"flex-1"],["matButton","","target","_blank","rel","noopener noreferrer","aria-label","QDB Converter source on GitHub (opens in a new tab)",3,"href"],["aria-hidden","true"],["id","documentation-navigation","aria-label","Documentation navigation",3,"openedChange","mode","opened"],[1,"mx-4","mt-6","mb-2","text-xs","font-bold","tracking-section","text-on-surface-variant","uppercase"],["aria-label","Documentation pages"],["mat-list-item","","routerLinkActive","active","ariaCurrentWhenActive","page",3,"activated","routerLink","routerLinkActiveOptions"],[1,"flex","min-h-content-screen","flex-col"],["id","main-content","tabindex","-1"],[1,"m-auto","flex","w-full","max-w-360","items-start","justify-between","gap-8","px-docs-inline","py-6","max-mobile:flex-col"],[1,"text-sm"],["target","_blank","rel","noopener noreferrer",3,"href"],["aria-label","Project links",1,"flex","flex-wrap","justify-end","gap-1","max-mobile:justify-start"],["matButton","","target","_blank","rel","noopener noreferrer","aria-label","Latest download (opens in a new tab)",3,"href"],["matButton","","target","_blank","rel","noopener noreferrer","aria-label","Changelog (opens in a new tab)",3,"href"],["matButton","","target","_blank","rel","noopener noreferrer","aria-label","Report an issue (opens in a new tab)",3,"href"],["matButton","","target","_blank","rel","noopener noreferrer","aria-label","MIT License (opens in a new tab)",3,"href"],["type","button","matIconButton","","aria-label","Open documentation navigation","aria-controls","documentation-navigation",1,"mr-1",3,"click"],["mat-list-item","","routerLinkActive","active","ariaCurrentWhenActive","page",3,"click","activated","routerLink","routerLinkActiveOptions"],["matListItemIcon","","aria-hidden","true"],["matListItemTitle",""]],template:function(t,e){t&1&&(s(0,"a",1),u(1,"Skip to content"),c(),s(2,"header",2)(3,"mat-toolbar"),z(4,Ri,3,1,"button",3),s(5,"a",4),Y(6,"img",5),s(7,"span"),u(8,"QDB Converter"),c(),s(9,"span",6),u(10,"Documentation"),c()(),Y(11,"span",7),s(12,"a",8)(13,"mat-icon",9),u(14,"code"),c(),u(15," GitHub "),c()()(),s(16,"mat-sidenav-container")(17,"mat-sidenav",10),F("openedChange",function(a){return e.navigationChanged(a)}),s(18,"p",11),u(19," Documentation "),c(),s(20,"mat-nav-list",12),qt(21,Oi,6,6,"a",13,Ii),c()(),s(23,"mat-sidenav-content")(24,"div",14)(25,"main",15),Y(26,"router-outlet"),c(),s(27,"footer")(28,"div",16)(29,"div")(30,"strong"),u(31,"QDB Converter"),c(),s(32,"p"),u(33,"Secure, deterministic FIFA 11\u201323 database conversion."),c(),s(34,"p",17),u(35),s(36,"a",18),u(37),c()()(),s(38,"nav",19)(39,"a",20),u(40,"Latest download"),c(),s(41,"a",21),u(42,"Changelog"),c(),s(43,"a",22),u(44,"Report an issue"),c(),s(45,"a",23),u(46,"MIT License"),c()()()()()()()),t&2&&(m(4),B(e.compactNavigation()?4:-1),m(8),O("href",e.site.links.repository,Q),m(5),O("mode",e.navigationMode())("opened",e.navigationOpened()),m(4),Zt(e.pages),m(14),Yt(" \xA9 ",e.site.copyrightYear," ",e.site.author," \xB7 "),m(),O("href",e.site.links.version,Q),M("aria-label","QDB Converter "+e.site.versionLabel+" source (opens in a new tab)"),m(),Kt("QDB Converter ",e.site.versionLabel),m(2),O("href",e.site.links.latestRelease,Q),m(2),O("href",e.site.links.changelog,Q),m(2),O("href",e.site.links.issues,Q),m(2),O("href",e.site.links.license,Q))},dependencies:[Jt,be,_e,ge,we,ve,Oe,Re,Ie,Tt,Et,Le,Bt,Fe,bt,Be,ze,xe,ke,ye],styles:['[_nghost-%COMP%]{display:flex;min-height:100dvh;flex-direction:column;background:var(--%NS%mat-sys-surface)}a[href="#main-content"][_ngcontent-%COMP%]{transform:translateY(-160%)}a[href="#main-content"][_ngcontent-%COMP%]:focus{transform:translateY(0)}mat-toolbar[_ngcontent-%COMP%]{min-height:56px;border-bottom:1px solid var(--%NS%mat-sys-outline-variant);background:var(--%NS%mat-sys-surface-container-low);color:var(--%NS%mat-sys-on-surface)}mat-toolbar[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{border-radius:.4rem}mat-toolbar[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]   span[_ngcontent-%COMP%] + span[_ngcontent-%COMP%]:before{content:"\\b7";margin-right:.65rem}mat-sidenav-container[_ngcontent-%COMP%]{min-height:calc(100dvh - 56px);flex:1 0 auto;background:radial-gradient(circle at top right,color-mix(in srgb,var(--%NS%mat-sys-primary) 12%,transparent),transparent 35rem),var(--%NS%mat-sys-surface)}mat-sidenav[_ngcontent-%COMP%]{width:15.5rem;border-right:1px solid var(--%NS%mat-sys-outline-variant);border-radius:0;background:var(--%NS%mat-sys-surface-container-low)}mat-nav-list[_ngcontent-%COMP%]{padding:0 .5rem}mat-nav-list[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]{margin-bottom:.15rem;border-radius:.5rem}mat-nav-list[_ngcontent-%COMP%]   a.active[_ngcontent-%COMP%]{background:var(--%NS%mat-sys-primary-container);color:var(--%NS%mat-sys-on-primary-container)}main[_ngcontent-%COMP%]{min-width:0;flex:1}main[_ngcontent-%COMP%]:focus{outline:none}footer[_ngcontent-%COMP%]{flex:0 0 auto;border-top:1px solid var(--%NS%mat-sys-outline-variant);background:var(--%NS%mat-sys-surface-container-low);color:var(--%NS%mat-sys-on-surface-variant)}footer[_ngcontent-%COMP%] > div[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%]{color:var(--%NS%mat-sys-on-surface)}footer[_ngcontent-%COMP%] > div[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{margin:.35rem 0 0}footer[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]{color:var(--%NS%mat-sys-primary)}@media(width<=620px){header[_ngcontent-%COMP%]   a[aria-label*=GitHub][_ngcontent-%COMP%]{min-width:48px;padding:0;font-size:0}header[_ngcontent-%COMP%]   a[aria-label*=GitHub][_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{margin:0}}@media(prefers-reduced-motion:reduce){a[href="#main-content"][_ngcontent-%COMP%], mat-sidenav[_ngcontent-%COMP%], mat-sidenav-container[_ngcontent-%COMP%], mat-sidenav-content[_ngcontent-%COMP%]{transition-duration:.01ms!important}}']})};var He=[...wt.map(i=>({path:i.path,loadComponent:()=>import("./chunk-KB5CQLTY.js").then(l=>l.DocumentationPage),data:{content:i.content,slug:i.slug},title:`${i.title} \xB7 QDB Converter`})),{path:"**",redirectTo:""}];var Ge={providers:[Ut(),Se(He),ee(),Qe({version:rt.version})]};te(yt,Ge).catch(i=>console.error(i));
